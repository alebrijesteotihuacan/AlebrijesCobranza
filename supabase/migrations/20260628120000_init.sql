-- =============================================================
-- Alebrijes Cobranza — Initial schema
-- Migration: 20260628120000_init
-- =============================================================

-- =============================================================
-- 2.1.2.1 — Extensions
-- =============================================================
create extension if not exists "pgcrypto"      with schema extensions;
create extension if not exists "pg_net"        with schema extensions;
create extension if not exists "pg_cron"       with schema extensions;

-- =============================================================
-- 2.1.2.2 — clientes
-- =============================================================
create table if not exists public.clientes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  whatsapp    text not null,
  dia_pago    smallint not null check (dia_pago in (15, 30)),
  monto       numeric(10,2) not null check (monto > 0),
  categoria   text,
  activo      boolean not null default true,
  notas       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists uq_clientes_whatsapp
  on public.clientes (whatsapp);
create index if not exists idx_clientes_activo
  on public.clientes (activo);
create index if not exists idx_clientes_dia_pago
  on public.clientes (dia_pago);

-- =============================================================
-- 2.1.2.3 — pagos
-- =============================================================
create table if not exists public.pagos (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.clientes(id) on delete cascade,
  periodo     char(7) not null,
  monto       numeric(10,2) not null check (monto > 0),
  fecha_pago  timestamptz not null default now(),
  metodo      text,
  notas       text,
  unique (cliente_id, periodo)
);

create index if not exists idx_pagos_cliente
  on public.pagos (cliente_id);
create index if not exists idx_pagos_periodo
  on public.pagos (periodo);

-- =============================================================
-- 2.1.2.4 — mensajes_enviados
-- =============================================================
create table if not exists public.mensajes_enviados (
  id                   uuid primary key default gen_random_uuid(),
  cliente_id           uuid not null references public.clientes(id) on delete cascade,
  periodo              char(7) not null,
  offset_dias          smallint not null,
  plantilla_id         text,
  whatsapp_message_id  text,
  estado               text not null check (estado in ('enviado','fallido')),
  error                text,
  enviado_at           timestamptz not null default now(),
  unique (cliente_id, periodo, offset_dias)
);

create index if not exists idx_mensajes_env_cliente
  on public.mensajes_enviados (cliente_id, enviado_at desc);
create index if not exists idx_mensajes_env_periodo
  on public.mensajes_enviados (periodo);

-- =============================================================
-- 2.1.2.5 — plantillas
-- =============================================================
create table if not exists public.plantillas (
  id          text primary key,
  offset_dias smallint not null unique,
  plantilla   text not null,
  activo      boolean not null default true,
  updated_at  timestamptz not null default now()
);

-- =============================================================
-- 2.1.2.6 — comprobantes_recibidos
-- =============================================================
create table if not exists public.comprobantes_recibidos (
  id                   uuid primary key default gen_random_uuid(),
  cliente_id           uuid references public.clientes(id) on delete set null,
  whatsapp_from        text not null,
  whatsapp_message_id  text unique,
  tipo                 text not null check (tipo in ('image','document','text','audio','video')),
  texto                text,
  storage_path         text,
  mime_type            text,
  estado               text not null default 'pendiente'
                       check (estado in ('pendiente','validado','rechazado')),
  periodo_asignado     char(7),
  notas_admin          text,
  recibido_at          timestamptz not null default now(),
  validado_at          timestamptz,
  validado_por         uuid references auth.users(id)
);

create index if not exists idx_comprobantes_estado_recibido
  on public.comprobantes_recibidos (estado, recibido_at desc);
create index if not exists idx_comprobantes_cliente
  on public.comprobantes_recibidos (cliente_id);
create index if not exists idx_comprobantes_periodo
  on public.comprobantes_recibidos (periodo_asignado);

-- =============================================================
-- 2.1.2.7 — mensajes_desconocidos
-- =============================================================
create table if not exists public.mensajes_desconocidos (
  id                   uuid primary key default gen_random_uuid(),
  whatsapp_from        text not null,
  texto                text,
  tipo                 text,
  whatsapp_message_id  text,
  recibido_at          timestamptz not null default now()
);

create index if not exists idx_desconocidos_recibido
  on public.mensajes_desconocidos (recibido_at desc);

-- =============================================================
-- 2.1.2.12 — Trigger: set updated_at on clientes
-- =============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_clientes_updated_at on public.clientes;
create trigger trg_clientes_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_plantillas_updated_at on public.plantillas;
create trigger trg_plantillas_updated_at
  before update on public.plantillas
  for each row execute function public.set_updated_at();

-- =============================================================
-- 2.1.2.9 — Enable RLS on all tables
-- =============================================================
alter table public.clientes              enable row level security;
alter table public.pagos                 enable row level security;
alter table public.mensajes_enviados     enable row level security;
alter table public.plantillas            enable row level security;
alter table public.comprobantes_recibidos enable row level security;
alter table public.mensajes_desconocidos enable row level security;

-- =============================================================
-- 2.1.2.10 — RLS Policies: deny all to anon and authenticated
-- All DB access (frontend + Edge Functions) uses service_role,
-- which bypasses RLS. Public roles have no access by design.
-- =============================================================

-- clientes
drop policy if exists "deny all anon authenticated clientes" on public.clientes;
create policy "deny all anon authenticated clientes"
  on public.clientes for all
  to anon, authenticated
  using (false) with check (false);

-- pagos
drop policy if exists "deny all anon authenticated pagos" on public.pagos;
create policy "deny all anon authenticated pagos"
  on public.pagos for all
  to anon, authenticated
  using (false) with check (false);

-- mensajes_enviados
drop policy if exists "deny all anon authenticated mensajes_enviados" on public.mensajes_enviados;
create policy "deny all anon authenticated mensajes_enviados"
  on public.mensajes_enviados for all
  to anon, authenticated
  using (false) with check (false);

-- plantillas
drop policy if exists "deny all anon authenticated plantillas" on public.plantillas;
create policy "deny all anon authenticated plantillas"
  on public.plantillas for all
  to anon, authenticated
  using (false) with check (false);

-- comprobantes_recibidos
drop policy if exists "deny all anon authenticated comprobantes" on public.comprobantes_recibidos;
create policy "deny all anon authenticated comprobantes"
  on public.comprobantes_recibidos for all
  to anon, authenticated
  using (false) with check (false);

-- mensajes_desconocidos
drop policy if exists "deny all anon authenticated desconocidos" on public.mensajes_desconocidos;
create policy "deny all anon authenticated desconocidos"
  on public.mensajes_desconocidos for all
  to anon, authenticated
  using (false) with check (false);

-- =============================================================
-- 2.1.2.11 — Seed: 8 plantillas (tono formal amigable)
-- =============================================================
insert into public.plantillas (id, offset_dias, plantilla) values
  ('recordatorio_-3', -3, 'Estimado {{nombre}}, le recordamos que en 3 días ({{dia_pago}}) es su fecha de pago de la mensualidad del Club Alebrijes Oaxaca. Monto: ${{monto}} MXN. Le agradecemos su puntualidad. — Administración Alebrijes'),
  ('recordatorio_-1', -1, 'Estimado {{nombre}}, le informamos que mañana ({{dia_pago}}) es su fecha de pago de la mensualidad del Club Alebrijes Oaxaca. Monto: ${{monto}} MXN. — Administración Alebrijes'),
  ('pago_hoy',        0, 'Estimado {{nombre}}, el día de hoy es su fecha de pago de la mensualidad del Club Alebrijes Oaxaca. Monto: ${{monto}} MXN. Datos para pago: {{info_pago}}. — Administración Alebrijes'),
  ('atraso_1',        1, 'Estimado {{nombre}}, le informamos que su mensualidad del Club Alebrijes Oaxaca presenta 1 día de atraso. Monto: ${{monto}} MXN. Le solicitamos ponerse al corriente a la brevedad. Datos para pago: {{info_pago}}. — Administración Alebrijes'),
  ('atraso_3',        3, 'Estimado {{nombre}}, su mensualidad del Club Alebrijes Oaxaca presenta 3 días de atraso. Monto: ${{monto}} MXN. Favor de regularizar a la mayor brevedad posible. Datos para pago: {{info_pago}}. — Administración Alebrijes'),
  ('atraso_7',        7, 'Estimado {{nombre}}, su mensualidad del Club Alebrijes Oaxaca presenta 7 días de atraso. Monto: ${{monto}} MXN. Le pedimos comunicarse con la administración para regularizar su situación. — Administración Alebrijes'),
  ('pago_validado', 999, 'Estimado {{nombre}}, le confirmamos que su pago de ${{monto}} MXN correspondiente al periodo {{periodo}} ha sido validado correctamente. Agradecemos su puntualidad y compromiso con el Club Alebrijes Oaxaca. — Administración Alebrijes'),
  ('pago_rechazado', 998, 'Estimado {{nombre}}, revisamos el comprobante que nos hizo llegar y lamentamos informarle que no fue posible validarlo. Le solicitamos comunicarse con la administración o volver a enviarlo. — Administración Alebrijes')
on conflict (id) do update
  set plantilla = excluded.plantilla,
      offset_dias = excluded.offset_dias,
      updated_at = now();

-- =============================================================
-- 2.1.2.13 — Helper view: comprobantes pendientes con datos
-- =============================================================
create or replace view public.v_comprobantes_pendientes as
select
  c.id,
  c.whatsapp_from,
  c.tipo,
  c.texto,
  c.storage_path,
  c.mime_type,
  c.recibido_at,
  c.periodo_asignado,
  cl.id   as cliente_id,
  cl.nombre,
  cl.whatsapp as cliente_whatsapp,
  cl.dia_pago,
  cl.monto
from public.comprobantes_recibidos c
left join public.clientes cl on cl.id = c.cliente_id
where c.estado = 'pendiente'
order by c.recibido_at desc;

-- =============================================================
-- Migration complete
-- =============================================================
