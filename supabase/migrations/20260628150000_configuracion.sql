-- =============================================================
-- Migration: 20260628150000_configuracion
-- Key-value store for app-wide editable settings
-- =============================================================

create table if not exists public.configuracion (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- Seed: información de pago editable desde UI
insert into public.configuracion (key, value) values
  ('info_pago', 'Banco Azteca · CLABE 1271 8001 3747 4787 85 · Tarjeta 5263 5401 6581 7087 · Transferencia a nombre de Club Alebrijes Oaxaca')
on conflict (key) do nothing;

-- Enable RLS
alter table public.configuracion enable row level security;

-- Deny all to anon/authenticated; only service_role can read/write
drop policy if exists "deny all configuracion" on public.configuracion;
create policy "deny all configuracion"
  on public.configuracion for all
  to anon, authenticated
  using (false) with check (false);
