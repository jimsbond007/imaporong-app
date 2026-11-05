create or replace function public.admin_update_resident_record(
  p_resident_id uuid,
  p_full_name text,
  p_address text,
  p_age integer,
  p_gender text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  linked_profile_id uuid;
begin
  if not exists (
    select 1
    from public.profiles as current_profile
    where current_profile.id = auth.uid()
      and current_profile.role = 'admin'
  ) then
    raise exception 'Administrator access is required to edit resident records';
  end if;

  update public.residents
  set
    full_name = p_full_name,
    address = p_address,
    age = p_age,
    gender = p_gender
  where id = p_resident_id
  returning profile_id into linked_profile_id;

  if not found then
    raise exception 'Resident record not found';
  end if;

  if linked_profile_id is not null then
    update public.profiles
    set
      full_name = p_full_name,
      address = p_address,
      age = p_age,
      gender = p_gender
    where id = linked_profile_id;
  end if;
end;
$$;

revoke all on function public.admin_update_resident_record(uuid, text, text, integer, text) from public, anon;
grant execute on function public.admin_update_resident_record(uuid, text, text, integer, text) to authenticated;
