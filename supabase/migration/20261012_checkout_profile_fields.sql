begin;


-- ============================================================
-- EMRINNO CHECKOUT PROFILE
--
-- Real customer information used for payment processing.
-- No fabricated phone/address/customer data.
-- ============================================================

alter table public.profiles
  add column if not exists
    phone text,

  add column if not exists
    address_line1 text,

  add column if not exists
    city text,

  add column if not exists
    postcode text,

  add column if not exists
    country text;


-- ------------------------------------------------------------
-- Match SSLCOMMERZ documented field-size limits.
-- ------------------------------------------------------------

alter table public.profiles
  add constraint
    profiles_phone_check
  check (
    phone is null
    or (
      char_length(phone)
        between 6 and 20
    )
  );


alter table public.profiles
  add constraint
    profiles_address_line1_check
  check (
    address_line1 is null
    or char_length(address_line1)
      between 2 and 50
  );


alter table public.profiles
  add constraint
    profiles_city_check
  check (
    city is null
    or char_length(city)
      between 2 and 50
  );


alter table public.profiles
  add constraint
    profiles_postcode_check
  check (
    postcode is null
    or char_length(postcode)
      between 1 and 30
  );


alter table public.profiles
  add constraint
    profiles_country_check
  check (
    country is null
    or char_length(country)
      between 2 and 50
  );


-- ------------------------------------------------------------
-- Restrict browser UPDATE access to actual profile fields.
-- ------------------------------------------------------------

revoke update
on public.profiles
from authenticated;


grant update (
  full_name,
  phone,
  address_line1,
  city,
  postcode,
  country
)
on public.profiles
to authenticated;


commit;