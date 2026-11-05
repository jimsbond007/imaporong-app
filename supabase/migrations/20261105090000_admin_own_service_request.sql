drop policy if exists service_requests_admin_insert_own on public.service_requests;
create policy service_requests_admin_insert_own
on public.service_requests for insert
with check (
  resident_id = auth.uid()
  and exists (
    select 1
    from public.profiles as current_profile
    where current_profile.id = auth.uid()
      and current_profile.role = 'admin'
  )
);
