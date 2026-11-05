alter table public.service_requests
  add column if not exists resident_hidden_at timestamptz;

create or replace function public.hide_completed_request_from_resident(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.service_requests
  set resident_hidden_at = now()
  where id = p_request_id
    and resident_id = auth.uid()
    and status = 'received'
    and resident_hidden_at is null
    and exists (
      select 1
      from public.profiles as current_profile
      where current_profile.id = auth.uid()
        and current_profile.role = 'resident'
    );

  if not found then
    raise exception 'Request not found or not eligible for removal from resident history';
  end if;
end;
$$;

revoke all on function public.hide_completed_request_from_resident(uuid) from public, anon;
grant execute on function public.hide_completed_request_from_resident(uuid) to authenticated;
