-- Barangay Maporong Request Slip fields
-- Run this once in Supabase Dashboard > SQL Editor, or with `supabase db push`.

alter table public.service_requests
  add column if not exists height text,
  add column if not exists weight text,
  add column if not exists business text,
  add column if not exists capital text,
  add column if not exists cp_no text,
  add column if not exists birth_place text,
  add column if not exists slip_number text;

create sequence if not exists public.service_request_slip_seq;

-- Give existing requests a slip number too so old records can still be printed.
update public.service_requests
set slip_number = 'REQ-' || to_char(coalesce(created_at, now()), 'YYYY') || '-' ||
  lpad(nextval('public.service_request_slip_seq')::text, 6, '0')
where slip_number is null;

-- Generate REQ-YYYY-000001 style slip numbers automatically on every new request.
create or replace function public.set_request_slip_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.slip_number is null or btrim(new.slip_number) = '' then
    new.slip_number := 'REQ-' || to_char(coalesce(new.created_at, now()), 'YYYY') || '-' ||
      lpad(nextval('public.service_request_slip_seq')::text, 6, '0');
  end if;

  return new;
end;
$$;

drop trigger if exists set_request_slip_number on public.service_requests;

create trigger set_request_slip_number
before insert on public.service_requests
for each row
execute function public.set_request_slip_number();
