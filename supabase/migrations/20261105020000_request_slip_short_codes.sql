create or replace function public.request_slip_code(code_value bigint)
returns text
language plpgsql
immutable
strict
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  remaining_value bigint := code_value;
  result text := '';
begin
  if code_value < 0 or code_value > 1679615 then
    raise exception 'Request slip number exceeds the four-character code limit';
  end if;

  loop
    result := substr(alphabet, (remaining_value % 36)::integer + 1, 1) || result;
    remaining_value := remaining_value / 36;
    exit when remaining_value = 0;
  end loop;

  return lpad(result, 4, '0');
end;
$$;

with numbered_requests as (
  select id, row_number() over (order by created_at nulls first, id) as sequence_number
  from public.service_requests
)
update public.service_requests as requests
set slip_number = 'RQS-' || public.request_slip_code(numbered_requests.sequence_number)
from numbered_requests
where requests.id = numbered_requests.id;

select setval(
  'public.service_request_slip_seq',
  greatest((select count(*) from public.service_requests), 1),
  (select count(*) > 0 from public.service_requests)
);

create unique index if not exists service_requests_slip_number_key
on public.service_requests (slip_number);

create or replace function public.set_request_slip_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.slip_number := 'RQS-' || public.request_slip_code(
    nextval('public.service_request_slip_seq')
  );
  return new;
end;
$$;
