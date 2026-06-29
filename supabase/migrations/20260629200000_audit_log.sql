-- =============================================================
-- Migration: 20260629200000_audit_log
-- Append-only audit log for admin actions
-- =============================================================

create table if not exists public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  user_email   text,
  action       text not null,                  -- e.g. 'cliente.create'
  resource     text not null,                  -- e.g. 'clientes'
  resource_id  text,
  details      jsonb default '{}'::jsonb,
  ip           inet,
  user_agent   text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_audit_log_created_at on public.audit_log (created_at desc);
create index if not exists idx_audit_log_user_id    on public.audit_log (user_id);
create index if not exists idx_audit_log_action     on public.audit_log (action);
create index if not exists idx_audit_log_resource   on public.audit_log (resource);

-- Enable RLS: deny all to anon/authenticated, only service_role reads
alter table public.audit_log enable row level security;

drop policy if exists "deny all audit_log" on public.audit_log;
create policy "deny all audit_log"
  on public.audit_log for all
  to anon, authenticated
  using (false) with check (false);

-- Helper function: write to audit_log
-- Uses SECURITY DEFINER so any caller (service_role) can write
create or replace function public.write_audit_log(
  p_user_id    uuid,
  p_user_email text,
  p_action     text,
  p_resource   text,
  p_resource_id text,
  p_details    jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log
    (user_id, user_email, action, resource, resource_id, details)
  values
    (p_user_id, p_user_email, p_action, p_resource, p_resource_id, coalesce(p_details, '{}'::jsonb));
end;
$$;
