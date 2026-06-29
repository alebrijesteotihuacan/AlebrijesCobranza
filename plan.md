# 📋 Plan: Alebrijes Cobranza — WhatsApp Collection App

> **Versión:** 3.0 (final)
> **Stack:** Next.js 15 + Supabase + WhatsApp Cloud API
> **Cliente:** Alebrijes Oaxaca — Fuerzas Básicas Teotihuacán

---

## 1. Resumen del Proyecto

App web **simple y moderna** para gestionar la cobranza mensual de **Alebrijes Oaxaca — Fuerzas Básicas Teotihuacán**. Permite registrar clientes (jugadores/tutores) con su número de WhatsApp, fecha de pago (15 o 30) y monto, y **envía automáticamente** mensajes de recordatorio y cobranza en momentos clave del ciclo de pago. Además, los clientes pueden **enviar su comprobante de pago por WhatsApp** y el admin lo **valida manualmente desde el dashboard**.

### Ciclo de mensajes automáticos

| Offset respecto a fecha de pago | Mensaje |
|---|---|
| **-3 días** | "En 3 días es la fecha de pago de tu mensualidad Alebrijes. Recuerda." |
| **-1 día** | "Mañana es tu fecha de pago. Tenlo listo." |
| **0 (día de pago)** | "Hoy es tu fecha de pago. Realiza tu pago a: [datos bancarios]." |
| **+1 día** | "Tienes 1 día de atraso, ponte al corriente." |
| **+3 días** | "Tienes 3 días de atraso, ponte al corriente." |
| **+7 días** | "Tienes 7 días de atraso. Favor de regularizar tu situación." |

Los días se calculan en **hora central de México (UTC-6)** y solo se envía **una vez por (cliente, offset, mes)**.

### Flujo de validación de comprobantes

```
Cliente envía foto/PDF  ──►  WhatsApp Webhook
                              ├─ descarga media
                              ├─ guarda temporalmente en Storage
                              └─ crea registro pendiente

Admin abre /comprobantes ──►  Revisa thumbnail + datos
                              ├─ [Validar]   → crea pago + envía WhatsApp ✅
                              └─ [Rechazar]  → envía WhatsApp ⚠️ "no procede"

(En ambos casos el archivo se borra; solo queda el registro textual)
```

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Next.js 15 (App Router) + TypeScript |
| **Estilos** | Tailwind CSS v4 + shadcn/ui |
| **Backend / DB** | Supabase (Postgres + Auth + Edge Functions + pg_cron + Storage) |
| **Mensajería** | Meta WhatsApp Cloud API (oficial) |
| **Despliegue** | Vercel (frontend) + Supabase Cloud (backend) |
| **Calendario/Fechas** | `date-fns-tz` para zona horaria `America/Mexico_City` |

> **Sin servicios externos extra.** Todo corre en Supabase + Vercel.

---

## 3. Variables de Entorno (`.env`)

### Frontend (`.env.local` en raíz de Next.js)
```bash
# Supabase (cliente público — seguro exponerlo)
NEXT_PUBLIC_SUPABASE_URL=https://wcsqafedvjjwtntepmhf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # anon key, NO la service_role

# App
NEXT_PUBLIC_APP_NAME="Alebrijes Cobranza"
NEXT_PUBLIC_PAYMENT_INFO="Banco X · Cuenta 1234 · CLABE 567 · Transferencia a nombre de Club Alebrijes Oaxaca"
```

### Supabase Edge Function secrets (vía `supabase secrets set`)
```bash
# WhatsApp Cloud API (Meta)
WHATSAPP_TOKEN=EAAxxxxxxx...                # Token permanente de System User
WHATSAPP_PHONE_NUMBER_ID=1234567890         # ID del número verificado
WHATSAPP_BUSINESS_ACCOUNT_ID=987654         # WABA ID (opcional)

# Verificación del webhook
WHATSAPP_APP_SECRET=abc123...               # de Meta → App Settings → Basic
WHATSAPP_WEBHOOK_VERIFY_TOKEN=alebrijes_2026  # tú lo inventas y lo registras en Meta

# Supabase (service_role — NUNCA exponer en frontend)
SUPABASE_URL=https://wcsqafedvjjwtntepmhf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...        # service_role key
```

> ⚠️ El `service_role`, `WHATSAPP_TOKEN` y `WHATSAPP_APP_SECRET` **solo** viven en Edge Functions / server. El cliente solo usa `anon` key con RLS.

---

## 4. Modelo de Datos (Supabase / Postgres)

```sql
-- Tabla principal: clientes (jugadores/tutores)
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  whatsapp text not null,                  -- formato: 52 + 10 dígitos (sin +)
  dia_pago smallint not null check (dia_pago in (15, 30)),
  monto numeric(10,2) not null check (monto > 0),
  categoria text,                          -- ej: 'Sub-15', 'Sub-17' (opcional)
  activo boolean not null default true,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pagos del mes (para "marcar como pagado" y reportes)
create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  periodo char(7) not null,                -- 'YYYY-MM' del mes que se pagó
  monto numeric(10,2) not null,
  fecha_pago timestamptz not null default now(),
  metodo text,                             -- 'transferencia', 'efectivo', 'comprobante_whatsapp'
  notas text,
  unique (cliente_id, periodo)
);

-- Bitácora de mensajes enviados (auditoría y dedupe)
create table public.mensajes_enviados (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  periodo char(7) not null,
  offset_dias smallint not null,
  whatsapp_message_id text,
  estado text,                             -- 'enviado', 'fallido'
  error text,
  enviado_at timestamptz not null default now(),
  unique (cliente_id, periodo, offset_dias)
);

-- Configuración de plantillas de mensaje (editables desde dashboard)
create table public.plantillas (
  id text primary key,
  offset_dias smallint not null unique,
  plantilla text not null,                 -- usa {{nombre}}, {{monto}}, {{dias}}
  activo boolean not null default true
);

-- Comprobantes recibidos por WhatsApp (validación manual)
create table public.comprobantes_recibidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete set null,
  whatsapp_from text not null,
  whatsapp_message_id text unique,
  tipo text not null check (tipo in ('image','document','text','audio','video')),
  texto text,
  storage_path text,                       -- temporal, se borra al resolver
  mime_type text,
  estado text not null default 'pendiente'
         check (estado in ('pendiente','validado','rechazado')),
  periodo_asignado char(7),
  notas_admin text,
  recibido_at timestamptz not null default now(),
  validado_at timestamptz,
  validado_por uuid references auth.users(id)
);

create index on comprobantes_recibidos (estado, recibido_at desc);
create index on comprobantes_recibidos (cliente_id);

-- Mensajes entrantes de números no registrados
create table public.mensajes_desconocidos (
  id uuid primary key default gen_random_uuid(),
  whatsapp_from text not null,
  texto text,
  tipo text,
  whatsapp_message_id text,
  recibido_at timestamptz default now()
);
```

### RLS (Row Level Security)
- `anon` y `authenticated`: **sin acceso** a ninguna tabla.
- Acceso total **solo** desde la **service_role key** (Edge Function + Dashboard con usuario admin autenticado).
- `auth.users`: Supabase Auth normal, 1 usuario admin.

### Datos seed (plantillas iniciales) — Tono: Formal amigable
```sql
insert into public.plantillas (id, offset_dias, plantilla) values
  ('recordatorio_-3', -3, 'Estimado {{nombre}}, le recordamos que en 3 días ({{dia_pago}}) es su fecha de pago de la mensualidad del Club Alebrijes Oaxaca. Monto: ${{monto}} MXN. Le agradecemos su puntualidad. — Administración Alebrijes'),
  ('recordatorio_-1', -1, 'Estimado {{nombre}}, le informamos que mañana ({{dia_pago}}) es su fecha de pago de la mensualidad del Club Alebrijes Oaxaca. Monto: ${{monto}} MXN. — Administración Alebrijes'),
  ('pago_hoy',        0, 'Estimado {{nombre}}, el día de hoy es su fecha de pago de la mensualidad del Club Alebrijes Oaxaca. Monto: ${{monto}} MXN. Datos para pago: {{info_pago}}. — Administración Alebrijes'),
  ('atraso_1',        1, 'Estimado {{nombre}}, le informamos que su mensualidad del Club Alebrijes Oaxaca presenta 1 día de atraso. Monto: ${{monto}} MXN. Le solicitamos ponerse al corriente a la brevedad. Datos para pago: {{info_pago}}. — Administración Alebrijes'),
  ('atraso_3',        3, 'Estimado {{nombre}}, su mensualidad del Club Alebrijes Oaxaca presenta 3 días de atraso. Monto: ${{monto}} MXN. Favor de regularizar a la mayor brevedad posible. Datos para pago: {{info_pago}}. — Administración Alebrijes'),
  ('atraso_7',        7, 'Estimado {{nombre}}, su mensualidad del Club Alebrijes Oaxaca presenta 7 días de atraso. Monto: ${{monto}} MXN. Le pedimos comunicarse con la administración para regularizar su situación. — Administración Alebrijes'),
  ('pago_validado', 999, 'Estimado {{nombre}}, le confirmamos que su pago de ${{monto}} MXN correspondiente al periodo {{periodo}} ha sido validado correctamente. Agradecemos su puntualidad y compromiso con el Club Alebrijes Oaxaca. — Administración Alebrijes'),
  ('pago_rechazado', 998, 'Estimado {{nombre}}, revisamos el comprobante que nos hizo llegar y lamentamos informarle que no fue posible validarlo. Le solicitamos comunicarse con la administración o volver a enviarlo. — Administración Alebrijes');
```

---

## 5. Política de Retención de Comprobantes

| Estado del comprobante | ¿Se guarda el archivo? | Razón |
|---|---|---|
| **Recibido** (entra al webhook) | ✅ Sí, temporalmente | El admin necesita verlo para decidir |
| **Validado / Rechazado** (acción del admin) | ❌ Se borra inmediatamente | Ya no se necesita; queda solo el registro textual |
| **Pendiente > 7 días** (admin nunca lo revisó) | ❌ Job diario lo borra | Limpieza por si el admin lo olvidó |

El **registro en `comprobantes_recibidos` se queda** (sin archivo) como evidencia de qué se recibió y qué decisión se tomó. Solo **el binario se elimina**.

---

## 6. Diseño del Frontend (paleta Alebrijes)

### Paleta de colores (extraída de los logos)

| Token | Hex | Uso |
|---|---|---|
| `--alebrijes-orange` | `#F47920` | Botones primarios, acentos, links |
| `--alebrijes-orange-dark` | `#C45A12` | Hover, bordes activos |
| `--alebrijes-red` | `#D63A1A` | Estados de error/morosidad |
| `--alebrijes-black` | `#0A0A0A` | Texto principal, fondo navbar |
| `--alebrijes-white` | `#FFFFFF` | Fondo principal |
| `--alebrijes-gray-50/100/200` | `#F7F7F7 / #EEE / #DDD` | Bordes, separadores |
| `--alebrijes-success` | `#16A34A` | "Pagado / Validado" |
| `--alebrijes-warning` | `#EAB308` | "Por vencer / Pendiente" |

**Tipografía:** Inter (texto) + **Bebas Neue** o **Anton** (títulos, para evocar el logo deportivo).

### Estructura de páginas (App Router)

```
app/
├── layout.tsx                    # Layout raíz con fuentes y tema
├── page.tsx                      # Redirect → /login o /dashboard
├── login/
│   └── page.tsx                  # Formulario email/password
├── dashboard/
│   ├── layout.tsx                # Sidebar + topbar
│   ├── page.tsx                  # Resumen: KPIs del mes
│   ├── clientes/
│   │   ├── page.tsx              # Lista de clientes (tabla)
│   │   ├── nuevo/page.tsx        # Form crear cliente
│   │   └── [id]/page.tsx         # Editar cliente + "validar sin comprobante"
│   ├── comprobantes/
│   │   └── page.tsx              # Bandeja de revisión con thumbnails
│   ├── desconocidos/
│   │   └── page.tsx              # Mensajes de números no registrados
│   ├── mensajes/
│   │   └── page.tsx              # Historial de mensajes salientes
│   ├── reportes/
│   │   └── page.tsx              # Gráficas: cobrado, morosos, etc.
│   └── configuracion/
│       └── page.tsx              # Editar plantillas e info de pago
```

### Componentes principales (`/components`)
- `<Sidebar />` — Logo Alebrijes, navegación, usuario, badges de pendientes
- `<Topbar />` — Breadcrumb + mes actual + botón logout
- `<KpiCard />` — Tarjeta de KPI con icono
- `<ClienteForm />` — Form reactivo con validación Zod
- `<ClienteTable />` — Tabla con paginación, búsqueda, filtros, badge de estado
- `<ComprobanteCard />` — Card con thumbnail, datos del cliente, acciones
- `<ComprobanteViewer />` — Visor modal de imagen/PDF (lightbox)
- `<ValidarDialog />` — Confirmación con campo de periodo y notas
- `<MensajeTimeline />` — Línea de tiempo de mensajes por cliente
- `<StatusBadge />` — Pagado / Pendiente / Atrasado / Validado / Rechazado
- `<PagoModal />` — Modal para "Marcar como pagado" (sin comprobante)

### Responsive
- **Mobile-first**, breakpoints `sm 640 / md 768 / lg 1024 / xl 1280`
- Sidebar colapsable en móvil (hamburger)
- Tablas → tarjetas apiladas en móvil
- Botones y formularios full-width en móvil

---

## 7. Edge Functions

### 1. `whatsapp-webhook`

**GET (verificación inicial de Meta):**
```ts
// Meta manda: ?hub.mode=subscribe&hub.verify_token=XXX&hub.challenge=YYY
if (mode === 'subscribe' && token === WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
  return new Response(challenge, { status: 200 });
}
```

**POST (mensajes entrantes):**
1. Validar firma `X-Hub-Signature-256` con `WHATSAPP_APP_SECRET`
2. Parsear `entry[].changes[].value.messages[]`
3. Para cada mensaje: extraer `from`, `type`, `id`, `media_id`, `text`
4. Buscar cliente por teléfono
5. Si hay media, descargar y subir a Storage
6. Crear registro en `comprobantes_recibidos` (o `mensajes_desconocidos`)

### 2. `enviar-mensaje` (genérica)

Reutilizable por:
- Cron diario de recordatorios
- Acción "Validar comprobante" → `pago_validado`
- Acción "Rechazar comprobante" → `pago_rechazado`
- Futuros mensajes ad-hoc desde el dashboard

```ts
// POST { cliente_id, plantilla_id, variables: {} }
1. Carga plantilla desde DB
2. Renderiza variables ({{nombre}}, {{monto}}, etc.)
3. POST https://graph.facebook.com/v19.0/{PHONE_ID}/messages
4. Guarda en mensajes_enviados (estado, error, message_id)
5. Retorna { ok, message_id, error }
```

### 3. `enviar-recordatorios` (cron)

**Trigger:** pg_cron todos los días a **9:00 AM hora México** (15:00 UTC).

```ts
1. now = now() en America/Mexico_City
2. Para cada cliente activo:
     proxima_fecha_pago = calcular_siguiente_dia_pago(cliente.dia_pago, now)
     periodo = YYYY-MM de proxima_fecha_pago
     offset = (now - proxima_fecha_pago) en días
3. Para cada (cliente, offset) donde offset ∈ {-3, -1, 0, 1, 3, 7}:
     a. Saltar si ya existe en mensajes_enviados
     b. Saltar si hay pago registrado en ese periodo
     c. Saltar si hay comprobante validado en ese periodo
     d. Cargar plantilla y renderizar
     e. Llamar a enviar-mensaje()
```

### pg_cron (en SQL migration)
```sql
select cron.schedule(
  'enviar-recordatorios-diarios',
  '0 15 * * *',
  $$ select net.http_post(
       url := 'https://wcsqafedvjjwtntepmhf.supabase.co/functions/v1/enviar-recordatorios',
       headers := jsonb_build_object(
         'Authorization', 'Bearer ' || current_setting('app.cron_key', true),
         'Content-Type', 'application/json'
       ),
       body := '{}'::jsonb
     ); $$
);
```

---

## 8. Estructura de Archivos del Proyecto

```
AlebrijesCobranza/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/login/
│   ├── (app)/dashboard/...
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn (button, input, table, dialog...)
│   ├── dashboard/                # Sidebar, Topbar, KpiCard
│   ├── clientes/                 # ClienteForm, ClienteTable, PagoModal
│   ├── comprobantes/             # ComprobanteCard, ComprobanteViewer, ValidarDialog
│   └── mensajes/                 # MensajeTimeline
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── utils.ts                  # cn(), formatMXN, formatDate
│   ├── dates.ts                  # calcular_siguiente_dia_pago, offset_dias
│   ├── whatsapp.ts               # sendWhatsApp()
│   └── validations.ts            # Zod schemas
├── types/
│   └── database.ts               # Tipos generados desde Supabase
├── public/
│   └── assets/
│       ├── alebrijes-logo.png
│       └── alebrijes-escudo.png
├── supabase/
│   ├── functions/
│   │   ├── whatsapp-webhook/index.ts
│   │   ├── enviar-mensaje/index.ts
│   │   └── enviar-recordatorios/index.ts
│   └── migrations/
│       └── 20260628_init.sql     # tablas, RLS, plantillas seed, cron
├── .env.local
├── .env.example
├── tailwind.config.ts
├── next.config.ts
├── package.json
├── plan.md                       # ← este archivo
└── README.md
```

---

## 9. Plan de Fases de Implementación

| Fase | Contenido | Tiempo |
|---|---|---|
| **0** | Setup inicial, copiar assets, README, plan.md | 5 min |
| **1** | Bootstrap Next.js + shadcn + Tailwind + paleta Alebrijes | 15 min |
| **2** | DB: 5 tablas + RLS + 8 plantillas seed + Storage bucket + pg_cron | 25 min |
| **3** | 3 Edge Functions + secrets + deploy + tests | 30 min |
| **4** | Auth + layout + sidebar con badges | 20 min |
| **5** | Clientes CRUD + botón "validar sin comprobante" | 30 min |
| **6** | Dashboard + reportes (KPIs) | 20 min |
| **7** | Comprobantes (visor live) + desconocidos + mensajes + config | 35 min |
| **8** | Deploy Vercel + configurar webhook en Meta + smoke test E2E | 20 min |
| **9** | Pulido opcional (toasts, loading, modo oscuro, CSV) | +30 min |

**Tiempo total estimado: ~3.5 horas** (+30 min si se hace la fase 9).

---

## 10. Configuración en Meta (paso clave)

1. En developers.facebook.com → tu app → **WhatsApp → Configuration**
2. **Webhook URL:** `https://wcsqafedvjjwtntepmhf.supabase.co/functions/v1/whatsapp-webhook`
3. **Verify Token:** `alebrijes_2026` (el mismo que `WHATSAPP_WEBHOOK_VERIFY_TOKEN`)
4. **Webhook Fields:** marcar `messages` y `message_template_status_update`
5. **App Settings → Basic:** copiar el **App Secret** → `WHATSAPP_APP_SECRET`

---

## 11. Seguridad

- **RLS estricto:** `anon` sin acceso a tablas
- Solo `service_role` (en Edge Functions) accede a datos
- Frontend usa solo `anon` key + auth de Supabase
- Storage `comprobantes` privado, URLs firmadas temporales
- Webhook valida firma `X-Hub-Signature-256` con `WHATSAPP_APP_SECRET`
- Service role key y `WHATSAPP_TOKEN` **nunca** en frontend ni en git
- Variables sensibles solo en Supabase secrets y Vercel env (producción)

---

## 12. Decisiones Tomadas

| # | Decisión | Elección |
|---|---|---|
| 1 | Stack frontend | Next.js 15 + Tailwind + shadcn/ui |
| 2 | WhatsApp API | Meta Cloud API (ya configurada) |
| 3 | Cron | Supabase pg_cron + Edge Function |
| 4 | Auth dashboard | Login email/password (Supabase Auth) |
| 5 | Features extra | Todas: marcar pagado, historial, editar, reportes |
| 6 | Moneda / zona | MXN / America/Mexico_City (UTC-6) |
| 7 | Tipo de comprobante | Solo archivos (imagen/PDF) |
| 8 | Notificar rechazo | Sí, con plantilla `pago_rechazado` |
| 9 | Validar sin comprobante | Sí, botón en `/clientes/[id]` |
| 10 | Retención comprobantes | Borrar al resolver + limpieza 7d |
| 11 | Números desconocidos | Vista dedicada `/dashboard/desconocidos` |
