-- ============================================================================
-- iMaporong Phase A security hardening + announcements
--
-- Run this in Supabase Dashboard > SQL Editor (or `supabase db push`) after the
-- 2026-11-05 migrations. It is written to be re-runnable.
--
-- What this migration does:
--   1. Adds a role helper that cannot be spoofed from the browser.
--   2. Locks the `profiles` table down to "own row or admin".
--   3. Prevents residents from promoting themselves to admin or self-verifying.
--   4. Rebuilds `residents` and `service_requests` policies on top of the helper.
--   5. Creates `announcements` with public read + admin-only write.
--   6. Creates a public statistics RPC that exposes counts only, never PII.
--   7. Creates profiles automatically for new auth users (from signup metadata).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Role helpers
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER so the lookup bypasses RLS. Without this, a policy on
-- `profiles` that calls a function which reads `profiles` would recurse.
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  )
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ----------------------------------------------------------------------------
-- 2. Profiles: enable RLS and replace every existing policy
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', policy_name);
  end loop;
end $$;

create policy profiles_select_own_or_admin
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy profiles_insert_own_or_admin
on public.profiles for insert
to authenticated
with check (id = auth.uid() or public.is_admin());

create policy profiles_update_own_or_admin
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- No delete policy: profiles are removed by deleting the auth user.

-- ----------------------------------------------------------------------------
-- 3. Privilege guards on profiles
-- ----------------------------------------------------------------------------
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Trusted server-side work (migrations, service role, trigger chain).
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'The profile id cannot be changed.';
  end if;

  if new.role is distinct from old.role then
    raise exception 'Only barangay administrators can change account roles.';
  end if;

  if new.is_verified is distinct from old.is_verified then
    raise exception 'Only barangay administrators can verify residents.';
  end if;

  if new.bid_number is distinct from old.bid_number then
    raise exception 'Only barangay administrators can assign BID numbers.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_privileges on public.profiles;
create trigger guard_profile_privileges
before update on public.profiles
for each row
execute function public.guard_profile_privileges();

create or replace function public.guard_profile_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.id is distinct from auth.uid() then
    raise exception 'You can only create your own profile.';
  end if;

  -- Residents cannot self-promote or self-verify, even by crafting a request.
  new.role := 'resident';
  new.is_verified := false;
  new.bid_number := null;

  return new;
end;
$$;

drop trigger if exists guard_profile_insert on public.profiles;
create trigger guard_profile_insert
before insert on public.profiles
for each row
execute function public.guard_profile_insert();

-- ----------------------------------------------------------------------------
-- 4. Residents: rebuild policies on the helper
-- ----------------------------------------------------------------------------
alter table public.residents enable row level security;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'residents'
  loop
    execute format('drop policy if exists %I on public.residents', policy_name);
  end loop;
end $$;

create policy residents_select_own_or_admin
on public.residents for select
to authenticated
using (profile_id = auth.uid() or public.is_admin());

create policy residents_insert_admin
on public.residents for insert
to authenticated
with check (public.is_admin());

create policy residents_update_admin
on public.residents for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy residents_delete_admin
on public.residents for delete
to authenticated
using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. Service requests: rebuild policies + guard resident updates
-- ----------------------------------------------------------------------------
alter table public.service_requests enable row level security;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'service_requests'
  loop
    execute format('drop policy if exists %I on public.service_requests', policy_name);
  end loop;
end $$;

create policy service_requests_select_own_or_admin
on public.service_requests for select
to authenticated
using (resident_id = auth.uid() or public.is_admin());

create policy service_requests_insert_own_or_admin
on public.service_requests for insert
to authenticated
with check (
  (resident_id = auth.uid() and status = 'pending')
  or public.is_admin()
);

create policy service_requests_update_own_or_admin
on public.service_requests for update
to authenticated
using (resident_id = auth.uid() or public.is_admin())
with check (resident_id = auth.uid() or public.is_admin());

create policy service_requests_delete_admin
on public.service_requests for delete
to authenticated
using (public.is_admin());

-- Residents may only hide a request from their own history or store the
-- generated slip number. Status, feedback and archive fields are admin-only.
create or replace function public.guard_service_request_resident_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.resident_id is distinct from old.resident_id
     or new.status is distinct from old.status
     or new.rejection_reason is distinct from old.rejection_reason
     or new.received_at is distinct from old.received_at
     or new.full_name is distinct from old.full_name
     or new.service_type is distinct from old.service_type
     or new.purpose is distinct from old.purpose then
    raise exception 'Residents cannot change the processing details of a request.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_service_request_resident_update on public.service_requests;
create trigger guard_service_request_resident_update
before update on public.service_requests
for each row
execute function public.guard_service_request_resident_update();

-- ----------------------------------------------------------------------------
-- 6. Announcements
-- ----------------------------------------------------------------------------
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 160),
  body text not null check (char_length(btrim(body)) between 3 and 4000),
  category text not null default 'General',
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_published_at_idx
  on public.announcements (published_at desc)
  where published = true;

create or replace function public.touch_announcement_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_announcement_updated_at on public.announcements;
create trigger touch_announcement_updated_at
before update on public.announcements
for each row
execute function public.touch_announcement_updated_at();

alter table public.announcements enable row level security;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'announcements'
  loop
    execute format('drop policy if exists %I on public.announcements', policy_name);
  end loop;
end $$;

create policy announcements_public_read
on public.announcements for select
to anon, authenticated
using (published = true);

create policy announcements_admin_read
on public.announcements for select
to authenticated
using (public.is_admin());

create policy announcements_admin_insert
on public.announcements for insert
to authenticated
with check (public.is_admin());

create policy announcements_admin_update
on public.announcements for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy announcements_admin_delete
on public.announcements for delete
to authenticated
using (public.is_admin());

grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;

-- ----------------------------------------------------------------------------
-- 7. Public statistics (counts only, no PII)
-- ----------------------------------------------------------------------------
create or replace function public.get_public_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'verified_residents', (
      select count(*) from public.residents where is_verified = true
    ),
    'requests_served', (
      select count(*) from public.service_requests where status = 'received'
    ),
    'announcements', (
      select count(*) from public.announcements where published = true
    )
  )
$$;

revoke all on function public.get_public_stats() from public;
grant execute on function public.get_public_stats() to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 8. Create a profile for every new auth user
-- ----------------------------------------------------------------------------
-- Signup sends full_name, address, age and gender as auth metadata, so the
-- profile exists before email confirmation and never depends on a client
-- insert succeeding.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  raw_age text := nullif(btrim(metadata ->> 'age'), '');
begin
  insert into public.profiles (id, full_name, address, age, gender, role, is_verified)
  values (
    new.id,
    coalesce(nullif(btrim(metadata ->> 'full_name'), ''), 'Resident'),
    coalesce(nullif(btrim(metadata ->> 'address'), ''), 'Address not provided'),
    case when raw_age ~ '^[0-9]+$' then raw_age::int else null end,
    nullif(btrim(metadata ->> 'gender'), ''),
    'resident',
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
