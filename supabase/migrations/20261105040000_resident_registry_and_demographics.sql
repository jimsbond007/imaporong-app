alter table public.profiles
  add column if not exists age integer,
  add column if not exists gender text;

create table if not exists public.residents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  address text not null,
  age integer,
  gender text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  constraint residents_age_range check (age is null or age between 0 and 120)
);

create unique index if not exists residents_profile_id_key
  on public.residents (profile_id)
  where profile_id is not null;

create index if not exists residents_name_address_search_idx
  on public.residents (lower(full_name), lower(address));

insert into public.residents (profile_id, full_name, address, age, gender, is_verified)
select
  profiles.id,
  coalesce(nullif(btrim(profiles.full_name), ''), 'Resident'),
  coalesce(nullif(btrim(profiles.address), ''), 'Address not provided'),
  profiles.age,
  profiles.gender,
  coalesce(profiles.is_verified, false)
from public.profiles as profiles
on conflict (profile_id) where profile_id is not null
do update set
  full_name = excluded.full_name,
  address = excluded.address,
  age = coalesce(excluded.age, residents.age),
  gender = coalesce(excluded.gender, residents.gender),
  is_verified = residents.is_verified or excluded.is_verified;

create or replace function public.sync_profile_to_resident()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matching_resident_id uuid;
begin
  select id
  into matching_resident_id
  from public.residents
  where profile_id = new.id;

  if matching_resident_id is not null then
    update public.residents
    set
      full_name = coalesce(nullif(btrim(new.full_name), ''), full_name),
      address = coalesce(nullif(btrim(new.address), ''), address),
      age = coalesce(new.age, age),
      gender = coalesce(nullif(btrim(new.gender), ''), gender),
      is_verified = is_verified or coalesce(new.is_verified, false)
    where id = matching_resident_id;
    return new;
  end if;

  select id
  into matching_resident_id
  from public.residents
  where profile_id is null
    and lower(btrim(full_name)) = lower(btrim(coalesce(new.full_name, '')))
    and lower(btrim(address)) = lower(btrim(coalesce(new.address, '')))
  order by created_at, id
  limit 1;

  if matching_resident_id is not null then
    update public.residents
    set
      profile_id = new.id,
      full_name = coalesce(nullif(btrim(new.full_name), ''), full_name),
      address = coalesce(nullif(btrim(new.address), ''), address),
      age = coalesce(new.age, age),
      gender = coalesce(nullif(btrim(new.gender), ''), gender),
      is_verified = is_verified or coalesce(new.is_verified, false)
    where id = matching_resident_id;
  else
    insert into public.residents (profile_id, full_name, address, age, gender, is_verified)
    values (
      new.id,
      coalesce(nullif(btrim(new.full_name), ''), 'Resident'),
      coalesce(nullif(btrim(new.address), ''), 'Address not provided'),
      new.age,
      nullif(btrim(new.gender), ''),
      coalesce(new.is_verified, false)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists sync_profile_to_resident on public.profiles;
create trigger sync_profile_to_resident
after insert or update of full_name, address, age, gender, is_verified
on public.profiles
for each row
execute function public.sync_profile_to_resident();

alter table public.residents enable row level security;

drop policy if exists residents_select_for_owner_or_admin on public.residents;
create policy residents_select_for_owner_or_admin
on public.residents for select
using (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.profiles as current_profile
    where current_profile.id = auth.uid()
      and (current_profile.role = 'admin' or current_profile.is_admin = true)
  )
);

drop policy if exists residents_admin_manage on public.residents;
create policy residents_admin_manage
on public.residents for all
using (
  exists (
    select 1
    from public.profiles as current_profile
    where current_profile.id = auth.uid()
      and (current_profile.role = 'admin' or current_profile.is_admin = true)
  )
)
with check (
  exists (
    select 1
    from public.profiles as current_profile
    where current_profile.id = auth.uid()
      and (current_profile.role = 'admin' or current_profile.is_admin = true)
  )
);
