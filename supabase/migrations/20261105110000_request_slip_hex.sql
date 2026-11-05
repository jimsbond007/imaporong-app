-- Request slip numbers use the short hexadecimal form RQS-XXXXXXXX.
-- This replaces the earlier base-36 sequence format.

create or replace function public.set_request_slip_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.slip_number := 'RQS-' || upper(substr(replace(new.id::text, '-', ''), 1, 8));
  return new;
end;
$$;

drop trigger if exists set_request_slip_number on public.service_requests;

create trigger set_request_slip_number
before insert on public.service_requests
for each row
execute function public.set_request_slip_number();

-- Normalize existing request numbers to the same hexadecimal format.
update public.service_requests
set slip_number = 'RQS-' || upper(substr(replace(id::text, '-', ''), 1, 8))
where slip_number is null
   or slip_number !~ '^RQS-[0-9A-F]{8}$';
