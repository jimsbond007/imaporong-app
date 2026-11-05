drop policy if exists residents_select_for_owner_or_admin on public.residents;
create policy residents_select_for_owner_or_admin
on public.residents for select
using (
  (
    profile_id = auth.uid()
    and exists (
      select 1
      from public.profiles as current_profile
      where current_profile.id = auth.uid()
        and current_profile.role = 'resident'
    )
  )
  or exists (
    select 1
    from public.profiles as current_profile
    where current_profile.id = auth.uid()
      and current_profile.role = 'admin'
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
      and current_profile.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles as current_profile
    where current_profile.id = auth.uid()
      and current_profile.role = 'admin'
  )
);
