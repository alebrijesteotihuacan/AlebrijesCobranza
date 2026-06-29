-- =============================================================
-- Migration: 20260628130000_storage_bucket
-- Create comprobantes storage bucket (private) + RLS policies
-- =============================================================

-- 1) Create the private bucket
insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

-- 2) Deny all access to anon and authenticated
--    Only service_role (used by Edge Functions) can read/write.
drop policy if exists "deny all comprobantes bucket" on storage.objects;
create policy "deny all comprobantes bucket"
  on storage.objects
  for all
  to anon, authenticated
  using (bucket_id = 'comprobantes' and false)
  with check (bucket_id = 'comprobantes' and false);
