create or replace function public.prepare_platform_order(
  p_user_id uuid,
  p_service_code text,
  p_service_reference_id uuid,
  p_purchase_key text,
  p_offer_code text,
  p_amount_bdt integer,
  p_currency text,
  p_pricing_version text,
  p_service_snapshot jsonb default '{}'::jsonb,
  p_expires_at timestamptz default null
)
returns table (
  reused boolean,
  order_id uuid,
  user_id uuid,
  service_code text,
  service_reference_id uuid,
  purchase_key text,
  offer_code text,
  amount_bdt integer,
  currency text,
  pricing_version text,
  service_snapshot jsonb,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  expires_at timestamptz,
  paid_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.orders%rowtype;
  v_new public.orders%rowtype;

  v_has_existing boolean := false;

  v_service_status text;

  v_lock_key bigint;
begin
  -- ----------------------------------------------------------
  -- Validate service availability.
  -- Billing cannot be created for COMING_SOON/DISABLED tools.
  -- ----------------------------------------------------------

  select s.status
  into v_service_status
  from public.services s
  where s.code = p_service_code;

  if not found then
    raise exception
      'SERVICE_NOT_FOUND';
  end if;

  if v_service_status <> 'ACTIVE' then
    raise exception
      'SERVICE_NOT_ACTIVE';
  end if;


  -- ----------------------------------------------------------
  -- Basic trusted-input validation.
  -- Table constraints provide an additional layer.
  -- ----------------------------------------------------------

  if p_user_id is null then
    raise exception
      'INVALID_USER';
  end if;

  if p_service_reference_id is null then
    raise exception
      'INVALID_SERVICE_REFERENCE';
  end if;

  if p_amount_bdt <= 0 then
    raise exception
      'INVALID_AMOUNT';
  end if;

  if p_currency <> 'BDT' then
    raise exception
      'INVALID_CURRENCY';
  end if;


  -- ----------------------------------------------------------
  -- Serialize preparation for THIS logical purchase.
  --
  -- This protects against:
  -- - double clicks
  -- - multiple browser requests
  -- - concurrent server requests
  -- ----------------------------------------------------------

  v_lock_key :=
    pg_catalog.hashtextextended(
      p_service_code
      || '|'
      || p_service_reference_id::text
      || '|'
      || p_purchase_key,
      0
    );

  perform
    pg_catalog.pg_advisory_xact_lock(
      v_lock_key
    );


  -- ----------------------------------------------------------
  -- Find the active order for this logical purchase.
  -- ----------------------------------------------------------

  select o.*
  into v_existing
  from public.orders o
  where
    o.service_code =
      p_service_code
    and
    o.service_reference_id =
      p_service_reference_id
    and
    o.purchase_key =
      p_purchase_key
    and
    o.status in (
      'CREATED',
      'PENDING_PAYMENT'
    )
  limit 1
  for update;

  v_has_existing := found;


  -- ----------------------------------------------------------
  -- Automatically expire an order whose expiry has passed.
  -- ----------------------------------------------------------

  if
    v_has_existing
    and v_existing.expires_at is not null
    and v_existing.expires_at <= now()
  then
    update public.orders
    set status = 'EXPIRED'
    where id = v_existing.id;

    v_has_existing := false;
  end if;


  -- ----------------------------------------------------------
  -- Existing active order handling.
  -- ----------------------------------------------------------

  if v_has_existing then

    -- Same authoritative commercial snapshot:
    -- safely reuse the existing order.

    if
      v_existing.user_id =
        p_user_id
      and
      v_existing.offer_code =
        p_offer_code
      and
      v_existing.amount_bdt =
        p_amount_bdt
      and
      v_existing.currency =
        p_currency
      and
      v_existing.pricing_version =
        p_pricing_version
      and
      v_existing.service_snapshot =
        coalesce(
          p_service_snapshot,
          '{}'::jsonb
        )
    then
      return query
      select
        true,
        o.id,
        o.user_id,
        o.service_code,
        o.service_reference_id,
        o.purchase_key,
        o.offer_code,
        o.amount_bdt,
        o.currency,
        o.pricing_version,
        o.service_snapshot,
        o.status,
        o.created_at,
        o.updated_at,
        o.expires_at,
        o.paid_at
      from public.orders o
      where o.id =
        v_existing.id;

      return;
    end if;


    -- Never allow a resource to become associated with
    -- another user's order.

    if
      v_existing.user_id <>
        p_user_id
    then
      raise exception
        'ORDER_OWNERSHIP_CONFLICT';
    end if;


    -- Once the user has entered the gateway flow,
    -- do not replace the commercial order.
    --
    -- SSLCOMMERZ may still return a callback for it.

    if
      v_existing.status =
        'PENDING_PAYMENT'
    then
      raise exception
        'PAYMENT_ALREADY_IN_PROGRESS';
    end if;


    -- CREATED means payment has not started.
    --
    -- If package/price/snapshot changed, preserve history
    -- by cancelling rather than rewriting the order.

    update public.orders
    set status = 'CANCELLED'
    where
      id = v_existing.id
      and status = 'CREATED';

  end if;


  -- ----------------------------------------------------------
  -- Create immutable commercial order snapshot.
  -- ----------------------------------------------------------

  insert into public.orders (
    user_id,
    service_code,
    service_reference_id,
    purchase_key,
    offer_code,
    amount_bdt,
    currency,
    pricing_version,
    service_snapshot,
    status,
    expires_at
  )
  values (
    p_user_id,
    p_service_code,
    p_service_reference_id,
    p_purchase_key,
    p_offer_code,
    p_amount_bdt,
    p_currency,
    p_pricing_version,
    coalesce(
      p_service_snapshot,
      '{}'::jsonb
    ),
    'CREATED',
    p_expires_at
  )
  returning *
  into v_new;


  return query
  select
    false,
    v_new.id,
    v_new.user_id,
    v_new.service_code,
    v_new.service_reference_id,
    v_new.purchase_key,
    v_new.offer_code,
    v_new.amount_bdt,
    v_new.currency,
    v_new.pricing_version,
    v_new.service_snapshot,
    v_new.status,
    v_new.created_at,
    v_new.updated_at,
    v_new.expires_at,
    v_new.paid_at;
end;
$$;


-- Nobody using the browser Supabase client may execute it.

revoke all
on function public.prepare_platform_order(
  uuid,
  text,
  uuid,
  text,
  text,
  integer,
  text,
  text,
  jsonb,
  timestamptz
)
from public, anon, authenticated;


-- Trusted Emrinno backend only.

grant execute
on function public.prepare_platform_order(
  uuid,
  text,
  uuid,
  text,
  text,
  integer,
  text,
  text,
  jsonb,
  timestamptz
)
to service_role;