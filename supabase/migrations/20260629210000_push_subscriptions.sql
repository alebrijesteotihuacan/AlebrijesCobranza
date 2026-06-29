-- =============================================================
-- Migration: 20260629210000_push_subscriptions
-- Store Web Push subscriptions for admin notifications (9.8)
-- =============================================================

create table if not exists public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  endpoint      text not null unique,
  p256dh        text not null,
  auth          text not null,
  user_agent    text,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

create index if not exists idx_push_subs_user_id on public.push_subscriptions (user_id);

-- Enable RLS: deny all to anon/authenticated, only service_role reads
alter table public.push_subscriptions enable row level security;

drop policy if exists "deny all push_subscriptions" on public.push_subscriptions;
create policy "deny all push_subscriptions"
  on public.push_subscriptions for all
  to anon, authenticated
  using (false) with check (false);
