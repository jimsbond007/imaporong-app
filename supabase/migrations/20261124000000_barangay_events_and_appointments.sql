-- ============================================================================
-- iMaporong barangay calendar events + walk-in appointments
--
-- Run in Supabase Dashboard > SQL Editor (or `supabase db push`) AFTER
-- 20261105120000_security_hardening_and_announcements.sql, which defines
-- public.is_admin(). Written to be re-runnable.
--
--   1. barangay_events   public read, admin-only write (calendar entries)
--   2. appointments      residents book/cancel their own, staff manage all
--   3. appointment_slot_counts()  slot availability without exposing anyone
--
-- Office schedule assumed below (keep in sync with lib/appointments.ts):
--   Monday-Friday, hourly slots 08:00-11:00 and 13:00-16:00, 5 per slot,
--   bookable up to 45 days ahead, max 3 active upcoming per resident.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Calendar events
-- ----------------------------------------------------------------------------
create table if not exists public.barangay_events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 120),
  description text check (description is null or char_length(description) <= 1000),
  kind text not null default 'event' check (kind in ('event', 'closure', 'notice')),
  start_date date not null,
  end_date date not null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint barangay_events_range check (end_date >= start_date)
);

create index if not exists barangay_events_dates_idx
  on public.barangay_events (start_date, end_date);

alter table public.barangay_events enable row level security;

drop policy if exists barangay_events_public_read on public.barangay_events;
drop policy if exists barangay_events_admin_insert on public.barangay_events;
drop policy if exists barangay_events_admin_update on public.barangay_events;
drop policy if exists barangay_events_admin_delete on public.barangay_events;

create policy barangay_events_public_read
on public.barangay_events for select
to anon, authenticated
using (true);

create policy barangay_events_admin_insert
on public.barangay_events for insert
to authenticated
with check (public.is_admin());

create policy barangay_events_admin_update
on public.barangay_events for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy barangay_events_admin_delete
on public.barangay_events for delete
to authenticated
using (public.is_admin());

grant select on public.barangay_events to anon, authenticated;
grant insert, update, delete on public.barangay_events to authenticated;

-- ----------------------------------------------------------------------------
-- 2. Appointments
-- ----------------------------------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  contact_no text check (contact_no is null or char_length(contact_no) <= 20),
  purpose text not null check (char_length(btrim(purpose)) between 3 and 120),
  slip_number text check (slip_number is null or char_length(slip_number) <= 40),
  notes text check (notes is null or char_length(notes) <= 500),
  appt_date date not null,
  time_slot text not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_date_idx on public.appointments (appt_date, time_slot);
create index if not exists appointments_resident_idx on public.appointments (resident_id, appt_date);

create or replace function public.touch_appointment_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_appointment_updated_at on public.appointments;
create trigger touch_appointment_updated_at
before update on public.appointments
for each row
execute function public.touch_appointment_updated_at();

-- Booking rules. SECURITY DEFINER so capacity is counted across every
-- resident, not just the rows the booking resident is allowed to see.
create or replace function public.enforce_appointment_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Manila')::date;
  now_time time := (now() at time zone 'Asia/Manila')::time;
begin
  -- Trusted server-side work and staff skip the resident rules.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  new.resident_id := auth.uid();
  new.status := 'pending';
  new.admin_note := null;

  if new.appt_date < today then
    raise exception 'Please choose today or a later date.';
  end if;

  if new.appt_date > today + 45 then
    raise exception 'Appointments can be booked up to 45 days ahead.';
  end if;

  if extract(isodow from new.appt_date) > 5 then
    raise exception 'The barangay hall accepts walk-ins Monday to Friday only.';
  end if;

  if new.time_slot <> all (array['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00']) then
    raise exception 'Please choose one of the available time slots.';
  end if;

  if new.appt_date = today and new.time_slot::time <= now_time then
    raise exception 'That time has already passed. Please pick a later slot.';
  end if;

  if exists (
    select 1 from public.barangay_events e
    where e.kind = 'closure'
      and new.appt_date between e.start_date and e.end_date
  ) then
    raise exception 'The barangay hall is closed on that date.';
  end if;

  -- Serialise bookings for the same slot so two residents cannot both take
  -- the last place.
  perform pg_advisory_xact_lock(hashtext(new.appt_date::text || new.time_slot));

  if (
    select count(*) from public.appointments a
    where a.appt_date = new.appt_date
      and a.time_slot = new.time_slot
      and a.status in ('pending', 'confirmed')
  ) >= 5 then
    raise exception 'That time slot is already full. Please choose another one.';
  end if;

  if exists (
    select 1 from public.appointments a
    where a.resident_id = new.resident_id
      and a.appt_date = new.appt_date
      and a.status in ('pending', 'confirmed')
  ) then
    raise exception 'You already have an appointment on that day.';
  end if;

  if (
    select count(*) from public.appointments a
    where a.resident_id = new.resident_id
      and a.appt_date >= today
      and a.status in ('pending', 'confirmed')
  ) >= 3 then
    raise exception 'You can have up to 3 upcoming appointments at a time.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_appointment_rules on public.appointments;
create trigger enforce_appointment_rules
before insert on public.appointments
for each row
execute function public.enforce_appointment_rules();

-- Residents may only cancel their own appointment. Everything else is staff-only.
create or replace function public.guard_appointment_update()
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
     or new.full_name is distinct from old.full_name
     or new.contact_no is distinct from old.contact_no
     or new.purpose is distinct from old.purpose
     or new.slip_number is distinct from old.slip_number
     or new.notes is distinct from old.notes
     or new.appt_date is distinct from old.appt_date
     or new.time_slot is distinct from old.time_slot
     or new.admin_note is distinct from old.admin_note then
    raise exception 'Residents can only cancel an appointment.';
  end if;

  if new.status is distinct from old.status
     and not (new.status = 'cancelled' and old.status in ('pending', 'confirmed')) then
    raise exception 'Only barangay staff can change this appointment.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_appointment_update on public.appointments;
create trigger guard_appointment_update
before update on public.appointments
for each row
execute function public.guard_appointment_update();

alter table public.appointments enable row level security;

drop policy if exists appointments_select_own_or_admin on public.appointments;
drop policy if exists appointments_insert_own_or_admin on public.appointments;
drop policy if exists appointments_update_own_or_admin on public.appointments;
drop policy if exists appointments_delete_admin on public.appointments;

create policy appointments_select_own_or_admin
on public.appointments for select
to authenticated
using (resident_id = auth.uid() or public.is_admin());

create policy appointments_insert_own_or_admin
on public.appointments for insert
to authenticated
with check (resident_id = auth.uid() or public.is_admin());

create policy appointments_update_own_or_admin
on public.appointments for update
to authenticated
using (resident_id = auth.uid() or public.is_admin())
with check (resident_id = auth.uid() or public.is_admin());

create policy appointments_delete_admin
on public.appointments for delete
to authenticated
using (public.is_admin());

grant select, insert, update, delete on public.appointments to authenticated;

-- ----------------------------------------------------------------------------
-- 3. Slot availability (counts only, never names)
-- ----------------------------------------------------------------------------
create or replace function public.appointment_slot_counts(p_from date, p_to date)
returns table (appt_date date, time_slot text, taken integer)
language sql
stable
security definer
set search_path = public
as $$
  select a.appt_date, a.time_slot, count(*)::integer
  from public.appointments a
  where a.appt_date between p_from and least(p_to, p_from + 120)
    and a.status in ('pending', 'confirmed')
  group by a.appt_date, a.time_slot
$$;

revoke all on function public.appointment_slot_counts(date, date) from public;
grant execute on function public.appointment_slot_counts(date, date) to authenticated;
