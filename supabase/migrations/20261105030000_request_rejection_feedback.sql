alter table public.service_requests
  add column if not exists rejection_reason text;
