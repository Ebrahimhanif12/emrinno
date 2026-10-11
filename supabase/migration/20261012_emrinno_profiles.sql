begin;


-- ============================================================
-- EMRINNO USER PROFILE
--
-- Platform-level profile shared by Subminno,
-- Presentation Maker, and future Emrinno services.
--
-- Authentication identity remains in auth.users.
-- This table stores application profile data only.
-- ============================================================

create table if not exists public.profiles (
  user_id uuid primary key
    references auth.users(id)
    on delete cascade,

  full_name text,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint profiles_full_name_length_check
  check (
    full_name is null
    or char_length(full_name)
      between 2 and 80
  )
);


-- ============================================================
-- UPDATED_AT
-- ============================================================

create or replace function
  public.set_profiles_updated_at()
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
  set_profiles_updated_at
on public.profiles;


create trigger
  set_profiles_updated_at
before update
on public.profiles
for each row
execute function
  public.set_profiles_updated_at();


revoke execute
on function
  public.set_profiles_updated_at()
from
  public,
  anon,
  authenticated;


-- ============================================================
-- CREATE PROFILE AUTOMATICALLY FOR NEW USERS
--
-- full_name may come from auth user metadata.
-- Existing email/password users may initially have NULL name.
-- ============================================================

create or replace function
  public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    user_id,
    full_name
  )
  values (
    new.id,

    nullif(
      trim(
        coalesce(
          new.raw_user_meta_data
            ->> 'full_name',
          ''
        )
      ),
      ''
    )
  )
  on conflict (user_id)
  do nothing;

  return new;
end;
$$;


drop trigger if exists
  create_profile_after_signup
on auth.users;


create trigger
  create_profile_after_signup
after insert
on auth.users
for each row
execute function
  public.create_profile_for_new_user();


revoke execute
on function
  public.create_profile_for_new_user()
from
  public,
  anon,
  authenticated;


-- ============================================================
-- BACKFILL EXISTING USERS
-- ============================================================

insert into public.profiles (
  user_id,
  full_name
)
select
  u.id,

  nullif(
    trim(
      coalesce(
        u.raw_user_meta_data
          ->> 'full_name',
        ''
      )
    ),
    ''
  )
from auth.users as u
on conflict (user_id)
do nothing;


-- ============================================================
-- RLS
-- ============================================================

alter table public.profiles
enable row level security;


revoke all
on public.profiles
from anon, authenticated;


grant
  select,
  update
on public.profiles
to authenticated;


create policy
  "Users can view own profile"
on public.profiles
for select
to authenticated
using (
  auth.uid() = user_id
);


create policy
  "Users can update own profile"
on public.profiles
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


grant
  select,
  insert,
  update
on public.profiles
to service_role;


commit;