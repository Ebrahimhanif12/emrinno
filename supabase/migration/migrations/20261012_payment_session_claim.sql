begin;


-- ============================================================
-- RECREATE create_payment_attempt()
--
-- Adds provider_checkout_url to the returned payment object.
-- ============================================================

drop function if exists
  public.create_payment_attempt(
    uuid,
    uuid,
    text
  );


create function public.create_payment_attempt(
  p_order_id uuid,
  p_user_id uuid,
  p_provider text
)
returns table (
  reused boolean,

  payment_id uuid,

  returned_order_id uuid,

  returned_provider text,

  merchant_transaction_id text,

  amount_bdt integer,

  currency text,

  status text,

  provider_session_id text,

  provider_checkout_url text,

  created_at timestamptz,

  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order
    public.orders%rowtype;

  v_existing
    public.payments%rowtype;

  v_payment
    public.payments%rowtype;

  v_payment_id uuid;

  v_merchant_transaction_id text;

  v_lock_key bigint;
begin

  if p_provider <> 'SSLCOMMERZ' then
    raise exception
      'UNSUPPORTED_PAYMENT_PROVIDER';
  end if;


  -- Serialize payment creation for this order.
  v_lock_key :=
    pg_catalog.hashtextextended(
      'PAYMENT|'
      || p_order_id::text,
      0
    );

  perform
    pg_catalog.pg_advisory_xact_lock(
      v_lock_key
    );


  -- Load authoritative order.
  select o.*
  into v_order
  from public.orders as o
  where
    o.id = p_order_id
  for update;


  if not found then
    raise exception
      'ORDER_NOT_FOUND';
  end if;


  if
    v_order.user_id <>
      p_user_id
  then
    raise exception
      'ORDER_OWNERSHIP_CONFLICT';
  end if;


  if
    v_order.status in (
      'PAID',
      'CANCELLED',
      'EXPIRED',
      'REFUNDED'
    )
  then
    raise exception
      'ORDER_NOT_PAYABLE';
  end if;


  -- Reuse existing active attempt.
  select p.*
  into v_existing
  from public.payments as p
  where
    p.order_id =
      p_order_id

    and p.provider =
      p_provider

    and p.status in (
      'CREATED',
      'PENDING',
      'REDIRECTED'
    )
  limit 1
  for update;


  if found then

    return query
    select
      true,
      p.id,
      p.order_id,
      p.provider,
      p.merchant_transaction_id,
      p.amount_bdt,
      p.currency,
      p.status,
      p.provider_session_id,
      p.provider_checkout_url,
      p.created_at,
      p.updated_at
    from public.payments as p
    where
      p.id =
        v_existing.id;

    return;

  end if;


  /*
   * No active payment exists.
   * A new attempt may begin only from CREATED order.
   */
  if
    v_order.status <>
      'CREATED'
  then
    raise exception
      'ORDER_NOT_READY_FOR_PAYMENT';
  end if;


  v_payment_id :=
    gen_random_uuid();


  /*
   * SSLCOMMERZ tran_id maximum is 30 characters.
   *
   * EM + 28 UUID hex characters = 30.
   */
  v_merchant_transaction_id :=
    'EM'
    ||
    upper(
      substring(
        replace(
          v_payment_id::text,
          '-',
          ''
        )
        from 1
        for 28
      )
    );


  insert into public.payments (
    id,
    order_id,
    provider,
    merchant_transaction_id,
    amount_bdt,
    currency,
    status
  )
  values (
    v_payment_id,
    v_order.id,
    p_provider,
    v_merchant_transaction_id,
    v_order.amount_bdt,
    v_order.currency,
    'CREATED'
  )
  returning *
  into v_payment;


  return query
  select
    false,
    v_payment.id,
    v_payment.order_id,
    v_payment.provider,
    v_payment.merchant_transaction_id,
    v_payment.amount_bdt,
    v_payment.currency,
    v_payment.status,
    v_payment.provider_session_id,
    v_payment.provider_checkout_url,
    v_payment.created_at,
    v_payment.updated_at;

end;
$$;


revoke all
on function public.create_payment_attempt(
  uuid,
  uuid,
  text
)
from
  public,
  anon,
  authenticated;


grant execute
on function public.create_payment_attempt(
  uuid,
  uuid,
  text
)
to service_role;



-- ============================================================
-- CLAIM PAYMENT FOR PROVIDER SESSION CREATION
--
-- Exactly one server request may transition:
--
-- CREATED -> PENDING
--
-- and therefore exactly one request gets permission
-- to call SSLCOMMERZ Create Session.
-- ============================================================

create or replace function
  public.claim_payment_attempt(
    p_payment_id uuid,
    p_user_id uuid
  )
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment
    public.payments%rowtype;

  v_order
    public.orders%rowtype;
begin

  select p.*
  into v_payment
  from public.payments as p
  where
    p.id =
      p_payment_id
  for update;


  if not found then
    raise exception
      'PAYMENT_NOT_FOUND';
  end if;


  select o.*
  into v_order
  from public.orders as o
  where
    o.id =
      v_payment.order_id
  for update;


  if not found then
    raise exception
      'ORDER_NOT_FOUND';
  end if;


  if
    v_order.user_id <>
      p_user_id
  then
    raise exception
      'ORDER_OWNERSHIP_CONFLICT';
  end if;


  if
    v_payment.provider <>
      'SSLCOMMERZ'
  then
    raise exception
      'INVALID_PAYMENT_PROVIDER';
  end if;


  /*
   * Another request already claimed it.
   */
  if
    v_payment.status =
      'PENDING'
  then
    return false;
  end if;


  /*
   * Checkout already exists.
   */
  if
    v_payment.status =
      'REDIRECTED'
  then
    return false;
  end if;


  if
    v_payment.status <>
      'CREATED'
  then
    raise exception
      'PAYMENT_NOT_CLAIMABLE';
  end if;


  if
    v_order.status <>
      'CREATED'
  then
    raise exception
      'ORDER_NOT_READY';
  end if;


  update public.payments as p
  set
    status =
      'PENDING'
  where
    p.id =
      v_payment.id;


  return true;

end;
$$;


revoke all
on function public.claim_payment_attempt(
  uuid,
  uuid
)
from
  public,
  anon,
  authenticated;


grant execute
on function public.claim_payment_attempt(
  uuid,
  uuid
)
to service_role;



-- ============================================================
-- UPDATE SUCCESSFUL SESSION ACTIVATION
--
-- PENDING -> REDIRECTED
-- CREATED order -> PENDING_PAYMENT
-- ============================================================

create or replace function
  public.activate_payment_session(
    p_payment_id uuid,
    p_user_id uuid,
    p_provider_session_id text,
    p_provider_checkout_url text
  )
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment
    public.payments%rowtype;

  v_order
    public.orders%rowtype;
begin

  if
    p_provider_session_id is null
    or trim(
      p_provider_session_id
    ) = ''
  then
    raise exception
      'INVALID_PROVIDER_SESSION';
  end if;


  if
    p_provider_checkout_url is null
    or trim(
      p_provider_checkout_url
    ) = ''

    or p_provider_checkout_url
      !~ '^https://'
  then
    raise exception
      'INVALID_PROVIDER_CHECKOUT_URL';
  end if;


  select p.*
  into v_payment
  from public.payments as p
  where
    p.id =
      p_payment_id
  for update;


  if not found then
    raise exception
      'PAYMENT_NOT_FOUND';
  end if;


  select o.*
  into v_order
  from public.orders as o
  where
    o.id =
      v_payment.order_id
  for update;


  if not found then
    raise exception
      'ORDER_NOT_FOUND';
  end if;


  if
    v_order.user_id <>
      p_user_id
  then
    raise exception
      'ORDER_OWNERSHIP_CONFLICT';
  end if;


  if
    v_payment.provider <>
      'SSLCOMMERZ'
  then
    raise exception
      'INVALID_PAYMENT_PROVIDER';
  end if;


  -- Idempotent replay.
  if
    v_payment.status =
      'REDIRECTED'

    and
    v_payment.provider_session_id =
      p_provider_session_id

    and
    v_payment.provider_checkout_url =
      p_provider_checkout_url

    and
    v_order.status =
      'PENDING_PAYMENT'
  then
    return;
  end if;


  if
    v_payment.status <>
      'PENDING'
  then
    raise exception
      'PAYMENT_NOT_READY';
  end if;


  if
    v_order.status <>
      'CREATED'
  then
    raise exception
      'ORDER_NOT_READY';
  end if;


  update public.payments as p
  set
    provider_session_id =
      p_provider_session_id,

    provider_checkout_url =
      p_provider_checkout_url,

    status =
      'REDIRECTED'

  where
    p.id =
      v_payment.id;


  update public.orders as o
  set
    status =
      'PENDING_PAYMENT'

  where
    o.id =
      v_order.id;

end;
$$;



-- ============================================================
-- UPDATE FAILED SESSION INITIATION
--
-- CREATED/PENDING -> FAILED
-- order remains CREATED
-- ============================================================

create or replace function
  public.fail_payment_attempt(
    p_payment_id uuid,
    p_user_id uuid
  )
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment
    public.payments%rowtype;

  v_order
    public.orders%rowtype;
begin

  select p.*
  into v_payment
  from public.payments as p
  where
    p.id =
      p_payment_id
  for update;


  if not found then
    raise exception
      'PAYMENT_NOT_FOUND';
  end if;


  select o.*
  into v_order
  from public.orders as o
  where
    o.id =
      v_payment.order_id
  for update;


  if not found then
    raise exception
      'ORDER_NOT_FOUND';
  end if;


  if
    v_order.user_id <>
      p_user_id
  then
    raise exception
      'ORDER_OWNERSHIP_CONFLICT';
  end if;


  if
    v_payment.provider <>
      'SSLCOMMERZ'
  then
    raise exception
      'INVALID_PAYMENT_PROVIDER';
  end if;


  if
    v_payment.status in (
      'CREATED',
      'PENDING'
    )
  then

    update public.payments as p
    set
      status =
        'FAILED'
    where
      p.id =
        v_payment.id;

  end if;

end;
$$;


commit;