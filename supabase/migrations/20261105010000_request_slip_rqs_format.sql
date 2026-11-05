-- Use the request UUID as the stable hexadecimal request slip number.
update public.service_requests
set slip_number = 'RQS-' || upper(replace(id::text, '-', ''));

create or replace function public.set_request_slip_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.slip_number := 'RQS-' || upper(replace(new.id::text, '-', ''));
  return new;
end;
$$;
