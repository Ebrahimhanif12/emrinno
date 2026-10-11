begin;


-- ============================================================
-- ACTIVATE A SUCCESSFULLY CREATED SSLCOMMERZ SESSION
--
-- Called only after SSLCOMMERZ returns:
--
-- status = SUCCESS
-- sessionkey
-- GatewayPageURL
--
-- Atomically:
--
-- payment CREATED  -> REDIRECTED
-- order CREATED    -> PENDING_PAYMENT
-- ============================================================

create or replace function
  public.activate_payment_session(
    p_payment_id uuid,
    p_user_id uuid,
    p_provider_session_id text
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


  select p.*
  into v_payment
  from public.payments as p
  where
    p.id = p_payment_id
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
  -- Idempotent replay.
  --
  -- If the same successful session was already activated,
  -- return safely.
  -- ----------------------------------------------------------

  if
    v_payment.status =
      'REDIRECTED'

    and
    v_payment.provider_session_id =
      p_provider_session_id

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
on function
  public.activate_payment_session(
    uuid,
    uuid,
    text
  )
from
  public,
  anon,
  authenticated;


grant execute
on function
  public.activate_payment_session(
    uuid,
    uuid,
    text
  )
to service_role;



-- ============================================================
-- FAILED SSLCOMMERZ SESSION CREATION
--
-- Payment attempt becomes FAILED.
-- Order stays CREATED so another attempt can safely be made.
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


  /*
   * Only an attempt that never successfully obtained
   * a gateway session may be marked FAILED here.
   */
  if
    v_payment.status =
      'CREATED'
  then

    update public.payments as p
    set
      status =
        'FAILED'
    where
      p.id =
        v_payment.id;

  end if;


  /*
   * Intentionally DO NOT modify the order.
   *
   * It remains CREATED and can receive a new
   * SSLCOMMERZ payment attempt.
   */

end;
$$;


revoke all
on function
  public.fail_payment_attempt(
    uuid,
    uuid
  )
from
  public,
  anon,
  authenticated;


grant execute
on function
  public.fail_payment_attempt(
    uuid,
    uuid
  )
to service_role;


commit;