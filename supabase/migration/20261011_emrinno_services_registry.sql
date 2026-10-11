begin;

-- ============================================================
-- EMRINNO PLATFORM SERVICE REGISTRY
--
-- This is the authoritative database registry for services
-- that can participate in platform billing.
-- ============================================================

create table if not exists public.services (
  code text primary key,

  name text not null,

  slug text not null unique,

  status text not null
    check (
      status in (
        'ACTIVE',
        'COMING_SOON',
        'DISABLED'
      )
    ),

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint services_code_format_check
    check (
      char_length(code) between 2 and 64
      and code ~ '^[A-Z0-9_]+$'
    ),

  constraint services_name_length_check
    check (
      char_length(name) between 1 and 100
    ),

  constraint services_slug_format_check
    check (
      char_length(slug) between 1 and 64
      and slug ~ '^[a-z0-9-]+$'
    )
);


-- ============================================================
-- INITIAL EMRINNO SERVICES
-- ============================================================

insert into public.services (
  code,
  name,
  slug,
  status
)
values
  (
    'SUBMINNO',
    'Subminno',
    'subminno',
    'ACTIVE'
  ),
  (
    'PRESENTATION',
    'Presentation Maker',
    'presentation',
    'COMING_SOON'
  )
on conflict (code)
do update set
  name = excluded.name,
  slug = excluded.slug,
  status = excluded.status;


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function
  public.set_services_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


drop trigger if exists
  set_services_updated_at
on public.services;


create trigger
  set_services_updated_at
before update
on public.services
for each row
execute function
  public.set_services_updated_at();


revoke execute
on function public.set_services_updated_at()
from public, anon, authenticated;


-- ============================================================
-- REMOVE OLD HARD-CODED SERVICE CHECK FROM ORDERS
-- ============================================================

alter table public.orders
  drop constraint if exists
  orders_service_code_check;


-- ============================================================
-- ADD PERMANENT FOREIGN KEY
--
-- Future services only need a new row in public.services.
-- No order-table CHECK constraint change is required.
-- ============================================================

alter table public.orders
  add constraint orders_service_code_fkey
  foreign key (service_code)
  references public.services(code)
  on update restrict
  on delete restrict;


-- ============================================================
-- SECURITY
-- ============================================================

alter table public.services
  enable row level security;


revoke all
on public.services
from anon, authenticated;


-- Service catalog is public metadata.
grant select
on public.services
to anon, authenticated;


create policy
  "Public can view service catalog"
on public.services
for select
to anon, authenticated
using (true);


-- Only trusted backend/admin code may mutate services.
grant
  select,
  insert,
  update
on public.services
to service_role;


commit;