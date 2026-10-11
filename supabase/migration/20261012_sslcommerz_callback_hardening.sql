begin;


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
   * Never downgrade a transaction that has already
   * been authoritatively validated by SSLCOMMERZ.
   *
   * This also protects risk_level=1 payments that
   * are intentionally waiting for review.
   */
  if
    (
      v_payment.verified_at
        is not null

      and
      v_payment.provider_status
        in (
          'VALID',
          'VALIDATED'
        )
    )

    or
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
      when
        p_provider_status =
          'FAILED'
      then
        'FAILED'

      when
        p_provider_status =
          'EXPIRED'
      then
        'EXPIRED'

      else
        'CANCELLED'
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
   * Customer may now safely try another
   * payment attempt for the same order.
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