begin;


create or replace function
  public.finalize_sslcommerz_payment(
    p_merchant_transaction_id text,
    p_provider_validation_id text,
    p_provider_transaction_id text,
    p_provider_status text,
    p_amount_bdt numeric,
    p_currency text,
    p_risk_level smallint
  )
returns text
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
    p_provider_status not in (
      'VALID',
      'VALIDATED'
    )
  then
    raise exception
      'INVALID_PROVIDER_STATUS';
  end if;


  if
    p_risk_level not in (
      0,
      1
    )
  then
    raise exception
      'INVALID_RISK_LEVEL';
  end if;


  select p.*
  into v_payment
  from public.payments as p
  where
    p.merchant_transaction_id =
      p_merchant_transaction_id
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
    v_payment.provider <>
      'SSLCOMMERZ'
  then
    raise exception
      'INVALID_PAYMENT_PROVIDER';
  end if;


  -- ----------------------------------------------------------
  -- Commercial-value verification.
  -- ----------------------------------------------------------

  if
    v_payment.amount_bdt::numeric <>
      p_amount_bdt

    or
    v_order.amount_bdt::numeric <>
      p_amount_bdt
  then
    raise exception
      'PAYMENT_AMOUNT_MISMATCH';
  end if;


  if
    v_payment.currency <>
      p_currency

    or
    v_order.currency <>
      p_currency

    or
    p_currency <>
      'BDT'
  then
    raise exception
      'PAYMENT_CURRENCY_MISMATCH';
  end if;


  -- ----------------------------------------------------------
  -- Idempotent replay.
  -- ----------------------------------------------------------

  if
    v_payment.status =
      'SUCCEEDED'

    and
    v_order.status =
      'PAID'
  then
    return 'PAID';
  end if;


  -- ----------------------------------------------------------
  -- Persist provider verification metadata.
  -- ----------------------------------------------------------

  update public.payments as p
  set
    provider_validation_id =
      p_provider_validation_id,

    provider_transaction_id =
      nullif(
        trim(
          p_provider_transaction_id
        ),
        ''
      ),

    provider_status =
      p_provider_status,

    risk_level =
      p_risk_level,

    verified_at =
      now()

  where
    p.id =
      v_payment.id;


  -- ----------------------------------------------------------
  -- Risk payment:
  --
  -- SSLCOMMERZ says service should be held.
  -- We deliberately do NOT grant the purchase.
  -- ----------------------------------------------------------

  if
    p_risk_level = 1
  then

    update public.payments as p
    set
      status =
        'PENDING'
    where
      p.id =
        v_payment.id;


    if
      v_order.status =
        'CREATED'
    then

      update public.orders as o
      set
        status =
          'PENDING_PAYMENT'
      where
        o.id =
          v_order.id;

    end if;


    return 'REVIEW';

  end if;


  -- ----------------------------------------------------------
  -- Verified safe payment.
  -- ----------------------------------------------------------

  update public.payments as p
  set
    status =
      'SUCCEEDED'
  where
    p.id =
      v_payment.id;


  update public.orders as o
  set
    status =
      'PAID'
  where
    o.id =
      v_order.id;


  return 'PAID';

end;
$$;


revoke all
on function
  public.finalize_sslcommerz_payment(
    text,
    text,
    text,
    text,
    numeric,
    text,
    smallint
  )
from
  public,
  anon,
  authenticated;


grant execute
on function
  public.finalize_sslcommerz_payment(
    text,
    text,
    text,
    text,
    numeric,
    text,
    smallint
  )
to service_role;


-- ============================================================
-- Terminal non-success callbacks.
--
-- These NEVER grant service.
-- ============================================================

create or replace function
  public.record_sslcommerz_terminal_callback(
    p_merchant_transaction_id text,
    p_provider_status text
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

  v_local_status text;
begin

  if
    p_provider_status not in (
      'FAILED',
      'CANCELLED',
      'EXPIRED',
      'UNATTEMPTED'
    )
  then
    raise exception
      'INVALID_TERMINAL_STATUS';
  end if;


  select p.*
  into v_payment
  from public.payments as p
  where
    p.merchant_transaction_id =
      p_merchant_transaction_id
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


  /*
   * A previously verified payment can never be
   * downgraded by a later callback.
   */
  if
    v_payment.status =
      'SUCCEEDED'

    or
    v_order.status =
      'PAID'
  then
    return;
  end if;


  v_local_status :=
    case
      when p_provider_status =
        'FAILED'
        then 'FAILED'

      when p_provider_status =
        'EXPIRED'
        then 'EXPIRED'

      else 'CANCELLED'
    end;


  update public.payments as p
  set
    status =
      v_local_status,

    provider_status =
      p_provider_status

  where
    p.id =
      v_payment.id;


  /*
   * Allow the customer to create another payment attempt.
   */
  if
    v_order.status =
      'PENDING_PAYMENT'
  then

    update public.orders as o
    set
      status =
        'CREATED'
    where
      o.id =
        v_order.id;

  end if;

end;
$$;


revoke all
on function
  public.record_sslcommerz_terminal_callback(
    text,
    text
  )
from
  public,
  anon,
  authenticated;


grant execute
on function
  public.record_sslcommerz_terminal_callback(
    text,
    text
  )
to service_role;


commit;