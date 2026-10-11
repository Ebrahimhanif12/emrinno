begin;


alter table public.payments
  add column if not exists
    provider_checkout_url text;


alter table public.payments
  add constraint
    payments_provider_checkout_url_check
  check (
    provider_checkout_url is null

    or (
      char_length(
        provider_checkout_url
      )
      between 1 and 500

      and provider_checkout_url
        ~ '^https://'
    )
  );


-- ============================================================
-- Replace session activation function.
--
-- We now persist BOTH:
--
-- sessionkey
-- GatewayPageURL
--
-- so an active checkout can be resumed safely.
-- ============================================================

drop function if exists
  public.activate_payment_session(
    uuid,
    uuid,
    text
  );


create function
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


  -- ----------------------------------------------------------
  -- Idempotent replay
  -- ----------------------------------------------------------

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
      'CREATED'
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


revoke all
on function public.activate_payment_session(
  uuid,
  uuid,
  text,
  text
)
from
  public,
  anon,
  authenticated;


grant execute
on function public.activate_payment_session(
  uuid,
  uuid,
  text,
  text
)
to service_role;


commit;