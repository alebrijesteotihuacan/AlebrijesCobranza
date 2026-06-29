# ✅ Tareas — Alebrijes Cobranza

> **Guía operativa detallada** del proyecto, de inicio a fin.
> Cada tarea es accionable, tiene criterios de aceptación y referencias a archivos.
> Marca con `[x]` cuando esté completada.

---

## 📑 Índice

- [🔐 FASE P — Prerrequisitos y Cuentas](#-fase-p--prerrequisitos-y-cuentas)
- [🎨 FASE 0 — Preparación del Proyecto](#-fase-0--preparación-del-proyecto)
- [🏗️ FASE 1 — Bootstrap del Frontend](#️-fase-1--bootstrap-del-frontend)
- [🗄️ FASE 2 — Base de Datos (Supabase)](#️-fase-2--base-de-datos-supabase)
- [⚡ FASE 3 — Edge Functions](#-fase-3--edge-functions)
- [🔑 FASE 4 — Auth y Layout](#-fase-4--auth-y-layout)
- [👥 FASE 5 — Clientes CRUD](#-fase-5--clientes-crud)
- [📊 FASE 6 — Dashboard y Reportes](#-fase-6--dashboard-y-reportes)
- [📩 FASE 7 — Comprobantes, Desconocidos, Mensajes y Configuración](#-fase-7--comprobantes-desconocidos-mensajes-y-configuración)
- [🚀 FASE 8 — Deploy y Configuración Final en Meta](#-fase-8--deploy-y-configuración-final-en-meta)
- [✨ FASE 9 — Pulido Opcional](#-fase-9--pulido-opcional)
- [🧪 Smoke Tests Finales](#-smoke-tests-finales)
- [📋 Checklist de Entrega](#-checklist-de-entrega)

---

## 🔐 FASE P — Prerrequisitos y Cuentas

> **Tiempo: 30–60 min** (mayoría de creación de cuentas, en paralelo se puede avanzar con código).

### P.1 — Cuenta de Supabase

- [x] P.1.1 — Crear cuenta en [supabase.com](https://supabase.com) (sign in with GitHub recomendado)
- [x] P.1.2 — Crear nuevo proyecto: nombre `alebrijes-cobranza`, región `South America (São Paulo)` o `North America` (la más cercana a México), plan **Free** (suficiente)
- [x] P.1.3 — Esperar a que el proyecto termine de aprovisionar (~2 min)
- [x] P.1.4 — Credenciales obtenidas y guardadas en gestor seguro (1Password / Bitwarden)
  - ⚠️ **NO** se documentan en este archivo (ni en ningún archivo del repo)
  - ⚠️ **Rotar `service_role` key** después de Fase 3 — la key actual fue compartida en chat
- [x] P.1.5 — Configurar autenticación: defaults OK (email/password habilitado, min 6 chars)
- [x] P.1.6 — Conexión MCP ✅ `✓ supabase connected`

### P.2 — Cuenta de Meta for Developers y WhatsApp Business

- [x] P.2.1 — Crear cuenta en [developers.facebook.com](https://developers.facebook.com) con la cuenta que administra la página de Facebook del club
- [x] P.2.2 — Crear nueva app tipo **Business**
- [x] P.2.3 — En la app, agregar el producto **"WhatsApp"** → Setup
- [x] P.2.4 — Verificar que el **número de teléfono** del club está agregado a WhatsApp Business
- [x] P.2.5 — Credenciales de WhatsApp obtenidas (guardadas en gestor seguro, no en repo):
  - `WHATSAPP_PHONE_NUMBER_ID` ✅
  - `WHATSAPP_BUSINESS_ACCOUNT_ID` ✅
  - `WHATSAPP_TOKEN` ✅ ⚠️ rotar tras Fase 3
- [x] P.2.6 — `WHATSAPP_APP_SECRET` ✅ ⚠️ rotar tras Fase 3
- [x] P.2.7 — `WHATSAPP_WEBHOOK_VERIFY_TOKEN` definido: `CobranzaAlebrijes2026`
- [x] P.2.8 — Verificación de negocio: **no requerida** (solo obligatoria >10k msgs/mes o marketing templates)

### P.3 — Herramientas Locales

- [x] P.3.1 — Instalar **Node.js 20+** ✅ v24.15.0
- [x] P.3.2 — Instalar **pnpm** ✅ 11.9.0
- [x] P.3.3 — Instalar **Supabase CLI** ✅ 2.105.0
- [x] P.3.4 — (Opcional) Instalar **Vercel CLI** ✅ 54.9.1
- [x] P.3.5 — **Git** inicializado y configurado ✅ `git init` + user config

### P.4 — Definir Contenido de la App

- [x] P.4.1 — **Información de pago** definida (Banco Azteca, CLABE y tarjeta SPEI). Se guardará en `NEXT_PUBLIC_PAYMENT_INFO` y en tabla `configuracion`. Editable desde `/dashboard/configuracion`.
- [x] P.4.2 — **Tono formal amigable** ("Estimado jugador/tutor..."). Plantillas actualizadas más abajo.

### P.5 — Criterios de Salida de la Fase P
- [x] Todas las credenciales anotadas en un gestor seguro (1Password, Bitwarden, etc.) — **NO en archivos del repo**
- [x] Número de WhatsApp verificado en Meta
- [x] Supabase CLI funciona: `supabase --version` OK y login `supabase login` (pendiente de hacer en Fase 3)

---

## 🎨 FASE 0 — Preparación del Proyecto

> **Tiempo: 10 min**

- [x] 0.1 — Confirmar estructura base: `C:\Users\52558\OneDrive\Documentos\Alebrijes Teotihuacán\AlebrijesCobranza\`
- [x] 0.2 — Verificar archivos previos:
  - [x] 0.2.1 — `plan.md` existe
  - [x] 0.2.2 — `README.md` existe
  - [x] 0.2.3 — `assets/` contiene las 2 imágenes
- [x] 0.3 — Crear carpetas vacías con `.gitkeep`:
  - [x] app/, components/, lib/, public/assets/, supabase/functions/, supabase/migrations/, types/, tests/
- [x] 0.4 — Copiar assets a `public/assets/`:
  - [x] 0.4.1 — `assets/Alebrijes Teotihuacan.png` → `public/assets/alebrijes-logo.png` (1.05 MB)
  - [x] 0.4.2 — `assets/03_TEOTIHUACAN_-_Fuerzas_Basicas.png` → `public/assets/alebrijes-escudo.png` (432 KB)
- [x] 0.5 — `.gitignore` creado con reglas para Next.js, Node, env files, Supabase, IDEs
- [x] 0.6 — `git init` + `git config user` + primer commit: `chore: initial project structure with docs, assets, and gitignore` (commit 0310ce0)

### Criterios de Salida Fase 0
- [x] Estructura de carpetas creada
- [x] Assets copiados
- [x] `.gitignore` en su lugar
- [x] `git init` ejecutado y primer commit hecho

---

## 🏗️ FASE 1 — Bootstrap del Frontend

> **Tiempo: 20 min**

### 1.1 — Crear proyecto Next.js

- [1] 1.1.1 — En la raíz del proyecto, ejecutar:
  ```bash
  npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --eslint --use-pnpm
  ```
  - [1] Responder "Yes" al overwrite si pide sobreescribir archivos
- [1] 1.1.2 — Verificar que se generó: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `app/`, `app/page.tsx`
- [1] 1.1.3 — Verificar versión de Next.js ≥ 15.0.0 en `package.json`
- [1] 1.1.4 — Commit: `chore: bootstrap next.js 15`

### 1.2 — Instalar dependencias base

- [1] 1.2.1 — Cliente Supabase:
  ```bash
  pnpm add @supabase/supabase-js @supabase/ssr
  ```
- [1] 1.2.2 — Fechas con zona horaria:
  ```bash
  pnpm add date-fns date-fns-tz
  ```
- [1] 1.2.3 — Validación:
  ```bash
  pnpm add zod
  ```
- [1] 1.2.4 — Iconos:
  ```bash
  pnpm add lucide-react
  ```
- [1] 1.2.5 — Utilidades:
  ```bash
  pnpm add clsx tailwind-merge class-variance-authority
  ```
- [1] 1.2.6 — (Opcional, para reportes) Gráficas:
  ```bash
  pnpm add recharts
  ```
- [1] 1.2.7 — Commit: `chore: install runtime dependencies`

### 1.3 — Configurar shadcn/ui

- [x] 1.3.1 — Inicializar shadcn:
  ```bash
  pnpm dlx shadcn@latest init --defaults --yes
  ```
  - [x] Style: **base-nova** (default moderno, similar a New York)
  - [x] Base color: **neutral** (mejor para customizar)
  - [x] CSS variables: **Yes**
  - [x] Icon library: **lucide**
  - [x] Aliases: `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`
- [x] 1.3.2 — Verificar que se creó `components.json` y `lib/utils.ts` ✓
- [x] 1.3.3 — Agregar componentes shadcn necesarios:
  ```bash
  pnpm dlx shadcn@latest add button input label card badge dialog dropdown-menu select table textarea sonner alert separator avatar sheet tabs tooltip --yes
  ```
  - [x] 16 archivos creados en `components/ui/`:
    - alert, avatar, badge, button, card, dialog, dropdown-menu, input, label, select, separator, sheet, sonner, table, tabs, textarea, tooltip
  - ⚠️ Nota: el plan mencionaba "toast" pero shadcn ahora usa **sonner** como su sistema de toasts
- [x] 1.3.4 — Commit: `chore: setup shadcn/ui with base components` (commit 79566d4)

### 1.4 — Paleta de colores Alebrijes

- [x] 1.4.1 — Editar `app/globals.css` con la paleta Alebrijes (formato `oklch()` para Tailwind v4)
  - [x] Variables CSS custom: `--alebrijes-orange`, `--alebrijes-orange-dark`, `--alebrijes-red`, `--alebrijes-black`, `--alebrijes-success`, `--alebrijes-warning`
  - [x] Override de tokens semánticos de shadcn: `--primary`, `--primary-foreground`, `--destructive`, `--ring`, `--chart-*`, `--sidebar-*` → usan la paleta Alebrijes
  - [x] Mapeo en `@theme inline` para generar utilities Tailwind: `bg-alebrijes-orange`, `text-alebrijes-red`, etc.
  - [x] Soporte para dark mode en `.dark` con la misma paleta
- [x] 1.4.2 — **N/A**: Tailwind v4 no usa `tailwind.config.ts` — la configuración se hace en CSS con `@theme inline`
- [x] 1.4.3 — Importar fuentes en `app/layout.tsx`:
  - [x] 1.4.3.1 — `Inter` (Google Fonts vía `next/font/google`) → cuerpo
  - [x] 1.4.3.2 — `Bebas_Neue` (Google Fonts vía `next/font/google`) → títulos (`h1`–`h6` con `font-heading`)
  - [x] Geist Mono para `--font-geist-mono` (mantenido)
  - [x] `Toaster` de sonner y `TooltipProvider` agregados al root
  - [x] `lang="es-MX"` y metadata de la app
- [x] 1.4.4 — Verificar render: `pnpm build` exitoso (compiló en 18s, TypeScript OK, 4 páginas estáticas)
- [x] 1.4.5 — `app/page.tsx` reemplazado: `redirect("/login")` (la página /login se implementa en Fase 4)
- [x] 1.4.6 — Commit: `feat: alebrijes color palette, brand fonts, and root redirect` (commit 4b0d868)

### 1.5 — Variables de entorno locales

- [ ] 1.5.1 — Crear `.env.local` con:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://<project_ref>.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
  NEXT_PUBLIC_APP_NAME="Alebrijes Cobranza"
  NEXT_PUBLIC_PAYMENT_INFO="Banco X · Cuenta 1234 · CLABE 567 · Transferencia a nombre de Club Alebrijes Oaxaca"
  ```
- [ ] 1.5.2 — Crear `.env.example` con la misma estructura (sin valores reales) para documentar
- [ ] 1.5.3 — Verificar que `.env.local` está en `.gitignore`

### Criterios de Salida Fase 1
- [ ] `pnpm dev` levanta sin errores
- [ ] Paleta Alebrijes aplicada (botón naranja de prueba se ve bien)
- [ ] Variables de entorno cargadas
- [ ] Commit: `chore: phase 1 complete`

---

## 🗄️ FASE 2 — Base de Datos (Supabase)

> **Tiempo: 25 min**

### 2.1 — Preparar archivo de migración

- [ ] 2.1.1 — Crear `supabase/migrations/20260628120000_init.sql`
- [ ] 2.1.2 — Dentro del archivo, en orden:
  - [ ] 2.1.2.1 — Extensiones necesarias: `pg_cron`, `pg_net`, `pgcrypto`
  - [ ] 2.1.2.2 — `CREATE TABLE` para `clientes`
  - [ ] 2.1.2.3 — `CREATE TABLE` para `pagos`
  - [ ] 2.1.2.4 — `CREATE TABLE` para `mensajes_enviados`
  - [ ] 2.1.2.5 — `CREATE TABLE` para `plantillas`
  - [ ] 2.1.2.6 — `CREATE TABLE` para `comprobantes_recibidos`
  - [ ] 2.1.2.7 — `CREATE TABLE` para `mensajes_desconocidos`
  - [ ] 2.1.2.8 — Índices (`comprobantes_recibidos (estado, recibido_at desc)`, etc.)
  - [ ] 2.1.2.9 — `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` en todas
  - [ ] 2.1.2.10 — Policies: `create policy "deny all anon"` para cada tabla
  - [ ] 2.1.2.11 — `INSERT` de las 8 plantillas seed
  - [ ] 2.1.2.12 — Trigger `set_updated_at` en `clientes`

### 2.2 — Aplicar migración vía MCP

- [ ] 2.2.1 — Aplicar con herramienta MCP `apply_migration` (nombre: `init`)
- [ ] 2.2.2 — Verificar que no hubo errores
- [ ] 2.2.3 — Verificar tablas creadas: `execute_sql` con query:
  ```sql
  select table_name from information_schema.tables
  where table_schema = 'public' order by table_name;
  ```
- [ ] 2.2.4 — Verificar plantillas seed: `select count(*) from public.plantillas` debe ser 8
- [ ] 2.2.5 — Commit: `feat(db): initial schema with 6 tables and seed`

### 2.3 — Storage Bucket para comprobantes

- [ ] 2.3.1 — Crear bucket `comprobantes` con `execute_sql`:
  ```sql
  insert into storage.buckets (id, name, public)
  values ('comprobantes', 'comprobantes', false)
  on conflict (id) do nothing;
  ```
- [ ] 2.3.2 — Aplicar policies de storage: solo service_role tiene acceso
  ```sql
  -- Negar todo a anon y authenticated
  create policy "deny all" on storage.objects
    for all to anon, authenticated
    using (bucket_id = 'comprobantes' and false);
  ```
- [ ] 2.3.3 — Verificar bucket en Dashboard de Supabase → Storage

### 2.4 — Programar pg_cron

- [ ] 2.4.1 — Confirmar que la extensión está habilitada
- [ ] 2.4.2 — Crear función RPC helper (opcional, para key del cron)
- [ ] 2.4.3 — Programar el cron vía `execute_sql`:
  ```sql
  select cron.schedule(
    'enviar-recordatorios-diarios',
    '0 15 * * *',
    $$ ... $$
  );
  ```
- [ ] 2.4.4 — Verificar: `select * from cron.job` debe mostrar la entrada

### Criterios de Salida Fase 2
- [ ] 6 tablas creadas con RLS
- [ ] 8 plantillas cargadas
- [ ] Bucket `comprobantes` existe y es privado
- [ ] pg_cron programado (se ejecutará diariamente a las 9 AM México)
- [ ] Commit: `feat(db): phase 2 complete`

---

## ⚡ FASE 3 — Edge Functions

> **Tiempo: 35 min**

### 3.1 — Función `whatsapp-webhook`

- [ ] 3.1.1 — Crear `supabase/functions/whatsapp-webhook/index.ts`
- [ ] 3.1.2 — Implementar handler `GET` (verificación de Meta):
  - [ ] 3.1.2.1 — Lee query params: `hub.mode`, `hub.verify_token`, `hub.challenge`
  - [ ] 3.1.2.2 — Si mode=`subscribe` y token=correcto → retorna challenge con 200
  - [ ] 3.1.2.3 — Si no → retorna 403
- [ ] 3.1.3 — Implementar handler `POST` (mensajes entrantes):
  - [ ] 3.1.3.1 — Validar firma `X-Hub-Signature-256` con `WHATSAPP_APP_SECRET` usando HMAC-SHA256
  - [ ] 3.1.3.2 — Parsear `entry[].changes[].value.messages[]`
  - [ ] 3.1.3.3 — Por cada mensaje: extraer `from`, `type`, `id`, `media_id`, `text/caption`
  - [ ] 3.1.3.4 — Crear cliente Supabase con service_role
  - [ ] 3.1.3.5 — Buscar cliente activo por `whatsapp` exacto
  - [ ] 3.1.3.6 — Si `media_id` existe:
    - [ ] 3.1.3.6.1 — GET a `https://graph.facebook.com/v19.0/{media_id}` con Bearer token para obtener URL
    - [ ] 3.1.3.6.2 — GET a esa URL → binario
    - [ ] 3.1.3.6.3 — Detectar extensión por mime_type
    - [ ] 3.1.3.6.4 — `supabase.storage.from('comprobantes').upload(path, blob)`
  - [ ] 3.1.3.7 — Si cliente existe → insert en `comprobantes_recibidos`
  - [ ] 3.1.3.8 — Si cliente no existe → insert en `mensajes_desconocidos`
  - [ ] 3.1.3.9 — Responder 200 OK rápido (Meta reintenta si >5s)
- [ ] 3.1.4 — Manejo de errores con try/catch y log a console (visible con `supabase functions logs`)
- [ ] 3.1.5 — Commit: `feat(functions): whatsapp webhook for incoming messages`

### 3.2 — Función `enviar-mensaje`

- [ ] 3.2.1 — Crear `supabase/functions/enviar-mensaje/index.ts`
- [ ] 3.2.2 — Validar body: `{ cliente_id, plantilla_id, variables: {} }`
- [ ] 3.2.3 — Cargar plantilla desde `plantillas` por ID
- [ ] 3.2.4 — Renderizar variables con regex: `/\{\{(\w+)\}\}/g` → reemplazar con `variables[key]` o `cliente[key]`
- [ ] 3.2.5 — POST a Meta API: `https://graph.facebook.com/v19.0/{PHONE_ID}/messages`
  ```json
  {
    "messaging_product": "whatsapp",
    "to": "<whatsapp>",
    "type": "text",
    "text": { "body": "<rendered>" }
  }
  ```
- [ ] 3.2.6 — Si responde 200: insert en `mensajes_enviados` con estado `enviado` y `whatsapp_message_id`
- [ ] 3.2.7 — Si falla: insert con estado `fallido` y `error`
- [ ] 3.2.8 — Retornar `{ ok, message_id, error }`
- [ ] 3.2.9 — Commit: `feat(functions): generic send-message function`

### 3.3 — Función `enviar-recordatorios`

- [ ] 3.3.1 — Crear `supabase/functions/enviar-recordatorios/index.ts`
- [ ] 3.3.2 — Cargar todos los clientes activos
- [ ] 3.3.3 — Por cada cliente:
  - [ ] 3.3.3.1 — Calcular `proximaFechaPago` con lib `dates.ts`:
    - [ ] 3.3.3.1.1 — Si hoy es día 1-14 y `dia_pago=15` → `proximaFechaPago` es día 15 de este mes
    - [ ] 3.3.3.1.2 — Si hoy es día 16-29 y `dia_pago=30` → `proximaFechaPago` es día 30 de este mes (o último día si el mes tiene 28/29/31)
    - [ ] 3.3.3.1.3 — Si ya pasó este mes → `proximaFechaPago` es día 15/30 del próximo mes
  - [ ] 3.3.3.2 — `periodo` = `YYYY-MM` de `proximaFechaPago`
  - [ ] 3.3.3.3 — `offsetDias` = diferencia en días entre hoy y `proximaFechaPago` (en TZ México)
- [ ] 3.3.4 — Si `offsetDias` ∈ {-3, -1, 0, 1, 3, 7}:
  - [ ] 3.3.4.1 — Verificar dedupe: no debe existir en `mensajes_enviados` (cliente_id, periodo, offsetDias)
  - [ ] 3.3.4.2 — Verificar pago: no debe existir en `pagos` con ese `periodo`
  - [ ] 3.3.4.3 — Verificar comprobante validado: no debe existir en `comprobantes_recibidos` con `estado='validado'` y `periodo_asignado=periodo`
  - [ ] 3.3.4.4 — Llamar internamente a `enviar-mensaje` con la plantilla correspondiente
- [ ] 3.3.5 — Retornar resumen `{ enviados, omitidos, fallidos }`
- [ ] 3.3.6 — Commit: `feat(functions): daily reminders cron trigger`

### 3.4 — Configurar secretos y deploy

- [ ] 3.4.1 — Setear todos los secretos en Supabase:
  ```bash
  supabase secrets set \
    WHATSAPP_TOKEN=<token> \
    WHATSAPP_PHONE_NUMBER_ID=<phone_id> \
    WHATSAPP_BUSINESS_ACCOUNT_ID=<waba_id> \
    WHATSAPP_APP_SECRET=<app_secret> \
    WHATSAPP_WEBHOOK_VERIFY_TOKEN=alebrijes_2026_xyz \
    SUPABASE_URL=https://<project_ref>.supabase.co \
    SUPABASE_SERVICE_ROLE_KEY=<service_role>
  ```
- [ ] 3.4.2 — Verificar: `supabase secrets list`
- [ ] 3.4.3 — Deploy de las 3 funciones:
  ```bash
  supabase functions deploy whatsapp-webhook --no-verify-jwt
  supabase functions deploy enviar-mensaje
  supabase functions deploy enviar-recordatorios
  ```
  - [ ] ⚠️ `--no-verify-jwt` solo en `whatsapp-webhook` porque Meta no envía JWT
- [ ] 3.4.4 — Verificar URLs desplegadas:
  - [ ] 3.4.4.1 — `https://<project_ref>.supabase.co/functions/v1/whatsapp-webhook`
  - [ ] 3.4.4.2 — `https://<project_ref>.supabase.co/functions/v1/enviar-mensaje`
  - [ ] 3.4.4.3 — `https://<project_ref>.supabase.co/functions/v1/enviar-recordatorios`

### 3.5 — Test manual de Edge Functions

- [ ] 3.5.1 — Test webhook (GET):
  ```bash
  curl "https://<project_ref>.supabase.co/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=alebrijes_2026_xyz&hub.challenge=12345"
  ```
  - [ ] Debe devolver `12345` con 200
- [ ] 3.5.2 — Test webhook (POST simulado): usar herramienta como Postman o curl con un payload fake
- [ ] 3.5.3 — Test enviar-mensaje con `supabase functions invoke`:
  ```bash
  supabase functions invoke enviar-mensaje \
    --body '{"cliente_id":"<test-uuid>","plantilla_id":"pago_hoy","variables":{}}'
  ```
- [ ] 3.5.4 — Verificar logs: `supabase functions logs enviar-mensaje --tail`

### Criterios de Salida Fase 3
- [ ] 3 Edge Functions desplegadas y operativas
- [ ] Secretos configurados
- [ ] Test de verificación GET del webhook pasa
- [ ] Test de envío manual a un número real funciona

---

## 🔑 FASE 4 — Auth y Layout

> **Tiempo: 25 min**

### 4.1 — Crear usuario admin

- [ ] 4.1.1 — En Supabase Dashboard → Authentication → Users → **Add user** → "Create new user"
- [ ] 4.1.2 — Email: `admin@alebrijes.com` (o el que decidas)
- [ ] 4.1.3 — Password: generar uno seguro, anotarlo en el gestor
- [ ] 4.1.4 — **Auto Confirm User**: sí

### 4.2 — Clientes Supabase

- [ ] 4.2.1 — Crear `lib/supabase/client.ts` (browser client)
- [ ] 4.2.2 — Crear `lib/supabase/server.ts` (server client con cookies)
- [ ] 4.2.3 — Crear `lib/supabase/middleware.ts` (helper para `middleware.ts`)
- [ ] 4.2.4 — Verificar tipos: `pnpm add -D supabase` y `pnpm supabase gen types typescript --project-id <ref> > types/database.ts`

### 4.3 — Middleware de protección

- [ ] 4.3.1 — Crear `middleware.ts` en la raíz
- [ ] 4.3.2 — Si la ruta empieza con `/dashboard` y no hay sesión → redirect a `/login`
- [ ] 4.3.3 — Si la ruta es `/login` y hay sesión → redirect a `/dashboard`
- [ ] 4.3.4 — Test manual: cerrar sesión y verificar redirect

### 4.4 — Página de Login

- [ ] 4.4.1 — Crear `app/(auth)/login/page.tsx`
- [ ] 4.4.2 — Layout con logo Alebrijes centrado
- [ ] 4.4.3 — Form con email + password (componentes shadcn)
- [ ] 4.4.4 — Submit llama `supabase.auth.signInWithPassword`
- [ ] 4.4.5 — Si éxito → `router.push('/dashboard')`
- [ ] 4.4.6 — Si error → toast de error
- [ ] 4.4.7 — Loading state en el botón
- [ ] 4.4.8 — Commit: `feat(auth): login page with supabase auth`

### 4.5 — Layout del Dashboard

- [ ] 4.5.1 — Crear `app/(app)/dashboard/layout.tsx`
- [ ] 4.5.2 — Estructura: `<Sidebar />` a la izquierda, `<Topbar />` arriba, contenido
- [ ] 4.5.3 — Crear `components/dashboard/sidebar.tsx`:
  - [ ] 4.5.3.1 — Logo de Alebrijes (`/assets/alebrijes-escudo.png`)
  - [ ] 4.5.3.2 — Links: Dashboard, Clientes, Comprobantes, Desconocidos, Mensajes, Reportes, Configuración
  - [ ] 4.5.3.3 — Badge en "Comprobantes" con count de pendientes (query a `comprobantes_recibidos where estado='pendiente'`)
  - [ ] 4.5.3.4 — Badge en "Desconocidos" con count
  - [ ] 4.5.3.5 — Footer con email del admin y botón logout
  - [ ] 4.5.3.6 — Responsive: drawer/hamburger en móvil
- [ ] 4.5.4 — Crear `components/dashboard/topbar.tsx`:
  - [ ] 4.5.4.1 — Breadcrumb dinámico
  - [ ] 4.5.4.2 — Mes actual formateado en español
  - [ ] 4.5.4.3 — Botón logout (mobile)
- [ ] 4.5.5 — Crear `app/(app)/dashboard/page.tsx` con un placeholder "Bienvenido" por ahora
- [ ] 4.5.6 — Commit: `feat(dashboard): layout with sidebar and topbar`

### Criterios de Salida Fase 4
- [ ] Login funciona con Supabase Auth
- [ ] Rutas protegidas redirigen a login si no hay sesión
- [ ] Sidebar muestra badges de pendientes (aún en 0)
- [ ] Layout responsive

---

## 👥 FASE 5 — Clientes CRUD

> **Tiempo: 35 min**

### 5.1 — Listar clientes

- [ ] 5.1.1 — `app/(app)/dashboard/clientes/page.tsx` (Server Component)
- [ ] 5.1.2 — Query con service_role: `select * from clientes order by created_at desc`
- [ ] 5.1.3 — Crear `components/clientes/cliente-table.tsx`:
  - [ ] 5.1.3.1 — Columnas: Nombre, WhatsApp, Día, Monto, Categoría, Estado (badge activo/inactivo), Acciones
  - [ ] 5.1.3.2 — Botón "Editar" → link a `/clientes/[id]`
  - [ ] 5.1.3.3 — Botón "Eliminar" (soft delete: `activo=false`) con confirmación
  - [ ] 5.1.3.4 — Search input (filtra en cliente)
  - [ ] 5.1.3.5 — Paginación o scroll infinito
- [ ] 5.1.4 — Botón "+ Nuevo Cliente" → link a `/clientes/nuevo`
- [ ] 5.1.5 — Estado vacío con mensaje "Aún no hay clientes"
- [ ] 5.1.6 — Commit: `feat(clientes): list page with table`

### 5.2 — Crear cliente

- [ ] 5.2.1 — `app/(app)/dashboard/clientes/nuevo/page.tsx`
- [ ] 5.2.2 — Crear `lib/validations.ts`:
  ```ts
  export const clienteSchema = z.object({
    nombre: z.string().min(2).max(100),
    whatsapp: z.string().regex(/^52\d{10}$/, 'Debe ser 52 + 10 dígitos'),
    dia_pago: z.union([z.literal(15), z.literal(30)]),
    monto: z.number().positive().max(99999),
    categoria: z.string().optional(),
    notas: z.string().optional(),
  });
  ```
- [ ] 5.2.3 — Crear `components/clientes/cliente-form.tsx` con shadcn Form + Zod resolver
- [ ] 5.2.4 — Server action `crearCliente(data)` que inserta en Supabase
- [ ] 5.2.5 — Submit → crear → toast éxito → redirect a `/clientes`
- [ ] 5.2.6 — Validación en cliente Y servidor
- [ ] 5.2.7 — Commit: `feat(clientes): create form with validation`

### 5.3 — Editar cliente

- [ ] 5.3.1 — `app/(app)/dashboard/clientes/[id]/page.tsx`
- [ ] 5.3.2 — Server Component carga el cliente
- [ ] 5.3.3 — Reutilizar `<ClienteForm />` con `defaultValues` del cliente
- [ ] 5.3.4 — Server action `actualizarCliente(id, data)`
- [ ] 5.3.5 — Mostrar sección "Historial de pagos" (lista de `pagos` del cliente)
- [ ] 5.3.6 — Mostrar sección "Mensajes enviados" (lista de `mensajes_enviados`)
- [ ] 5.3.7 — Commit: `feat(clientes): edit page with payment history`

### 5.4 — Marcar como pagado (sin comprobante)

- [ ] 5.4.1 — En `/clientes/[id]`, botón "Marcar como pagado"
- [ ] 5.4.2 — Abre `<PagoModal />` con:
  - [ ] 5.4.2.1 — Selector de periodo (`YYYY-MM`, default: mes actual)
  - [ ] 5.4.2.2 — Campo de monto (default: monto del cliente)
  - [ ] 5.4.2.3 — Campo de método (default: "manual")
  - [ ] 5.4.2.4 — Campo de notas opcional
- [ ] 5.4.3 — Submit → server action `registrarPago()`:
  - [ ] 5.4.3.1 — Verificar que no exista pago duplicado (mismo cliente, mismo periodo)
  - [ ] 5.4.3.2 — Insert en `pagos`
  - [ ] 5.4.3.3 — Toast éxito
  - [ ] 5.4.3.4 — Refresh de la página
- [ ] 5.4.4 — Commit: `feat(clientes): mark as paid without receipt`

### Criterios de Salida Fase 5
- [ ] CRUD completo de clientes funcional
- [ ] Validación Zod en cliente y servidor
- [ ] Búsqueda y filtros básicos
- [ ] Pago manual registrable

---

## 📊 FASE 6 — Dashboard y Reportes

> **Tiempo: 25 min**

### 6.1 — Dashboard principal

- [ ] 6.1.1 — `app/(app)/dashboard/page.tsx` (Server Component)
- [ ] 6.1.2 — Calcular KPIs del mes actual (en TZ México):
  - [ ] 6.1.2.1 — **Cobrado**: `sum(monto) from pagos where periodo = mes_actual`
  - [ ] 6.1.2.2 — **Pagos del mes**: `count(*) from pagos where periodo = mes_actual`
  - [ ] 6.1.2.3 — **Morosos**: clientes activos SIN pago en `pagos` y con `dia_pago` ya pasado este mes
  - [ ] 6.1.2.4 — **Pendientes**: `count(*) from comprobantes_recibidos where estado='pendiente'`
  - [ ] 6.1.2.5 — **Por vencer**: clientes con `dia_pago` en próximos 3 días sin pago
- [ ] 6.1.3 — Crear `components/dashboard/kpi-card.tsx` (reutilizable)
- [ ] 6.1.4 — Grid de 4-5 KPI cards en el top
- [ ] 6.1.5 — Tabla "Clientes recientes" debajo (últimos 5 modificados)
- [ ] 6.1.6 — Commit: `feat(dashboard): kpi cards and recent clients`

### 6.2 — Reportes

- [ ] 6.2.1 — `app/(app)/dashboard/reportes/page.tsx`
- [ ] 6.2.2 — Selector de mes/año
- [ ] 6.2.3 — Tabla resumen del mes:
  - [ ] 6.2.3.1 — Total clientes activos
  - [ ] 6.2.3.2 — Total cobrado
  - 6.2.3.3 — Total pendiente
  - [ ] 6.2.3.3 — % de cobranza (cobrado/esperado)
  - [ ] 6.2.3.4 — Lista de morosos con días de atraso
- [ ] 6.2.4 — Gráfica de barras con `recharts`: cobrados vs pendientes por día de pago (15 vs 30)
- [ ] 6.2.5 — (Opcional) Botón "Exportar CSV"
- [ ] 6.2.6 — Commit: `feat(reportes): monthly summary with charts`

### Criterios de Salida Fase 6
- [ ] Dashboard muestra KPIs reales
- [ ] Reportes mensuales funcionales
- [ ] Gráfica renderiza correctamente

---

## 📩 FASE 7 — Comprobantes, Desconocidos, Mensajes y Configuración

> **Tiempo: 40 min**

### 7.1 — Bandeja de Comprobantes

- [ ] 7.1.1 — `app/(app)/dashboard/comprobantes/page.tsx`
- [ ] 7.1.2 — Query: `comprobantes_recibidos where estado='pendiente' order by recibido_at desc`
- [ ] 7.1.3 — Crear `components/comprobantes/comprobante-card.tsx`:
  - [ ] 7.1.3.1 — Thumbnail del archivo:
    - [ ] 7.1.3.1.1 — Si `tipo='image'` → mostrar `<img>` con signed URL
    - [ ] 7.1.3.1.2 — Si `tipo='document'` → icono PDF + link "Ver PDF"
    - [ ] 7.1.3.1.3 — Si `tipo='text'` → mostrar el texto
  - [ ] 7.1.3.2 — Datos del cliente (nombre, whatsapp, día de pago, monto)
  - [ ] 7.1.3.3 — Texto del mensaje (caption)
  - [ ] 7.1.3.4 — Fecha de recepción (formato: "Hace 2h")
  - [ ] 7.1.3.5 — Botones "Validar" y "Rechazar"
- [ ] 7.1.4 — Generar signed URL temporal (15 min) server-side:
  ```ts
  const { data } = await supabase.storage
    .from('comprobantes')
    .createSignedUrl(storage_path, 900);
  ```
- [ ] 7.1.5 — Crear `components/comprobantes/comprobante-viewer.tsx`:
  - [ ] 7.1.5.1 — Modal/dialog con imagen grande o PDF embebido
  - [ ] 7.1.5.2 — Botón cerrar
- [ ] 7.1.6 — Commit: `feat(comprobantes): inbox with thumbnails`

### 7.2 — Acción Validar

- [ ] 7.2.1 — Click en "Validar" → abre `<ValidarDialog />`
- [ ] 7.2.2 — Dialog contiene:
  - [ ] 7.2.2.1 — Preview del comprobante
  - [ ] 7.2.2.2 — Selector de periodo (default: mes actual)
  - [ ] 7.2.2.3 — Notas opcionales
  - [ ] 7.2.2.4 — Botones "Cancelar" / "Validar"
- [ ] 7.2.3 — Server action `validarComprobante(id, periodo, notas)`:
  - [ ] 7.2.3.1 — Iniciar transacción (o secuencia de operaciones):
    - [ ] 7.2.3.1.1 — Insert en `pagos`
    - [ ] 7.2.3.1.2 — Update `comprobantes_recibidos` con estado='validado'
    - [ ] 7.2.3.1.3 — Borrar archivo de Storage
  - [ ] 7.2.3.2 — Llamar a Edge Function `enviar-mensaje` con plantilla `pago_validado`
  - [ ] 7.2.3.3 — Toast éxito
  - [ ] 7.2.3.4 — `revalidatePath('/dashboard/comprobantes')`
- [ ] 7.2.4 — Commit: `feat(comprobantes): validate action with confirmation`

### 7.3 — Acción Rechazar

- [ ] 7.3.1 — Click en "Rechazar" → abre dialog con campo de motivo
- [ ] 7.3.2 — Server action `rechazarComprobante(id, motivo)`:
  - [ ] 7.3.2.1 — Update `comprobantes_recibidos` con estado='rechazado', notas_admin=motivo
  - [ ] 7.3.2.2 — Borrar archivo de Storage
  - [ ] 7.3.2.3 — Llamar a Edge Function `enviar-mensaje` con plantilla `pago_rechazado`
  - [ ] 7.3.2.4 — Toast éxito
- [ ] 7.3.3 — Commit: `feat(comprobantes): reject action with notification`

### 7.4 — Vista de validados/rechazados

- [ ] 7.4.1 — Tabs en `/comprobantes`: Pendientes | Validados | Rechazados
- [ ] 7.4.2 — Tabs de Validados/Rechazados muestran histórico (sin archivo, solo metadatos)
- [ ] 7.4.3 — Filtro por rango de fechas

### 7.5 — Números Desconocidos

- [ ] 7.5.1 — `app/(app)/dashboard/desconocidos/page.tsx`
- [ ] 7.5.2 — Lista de mensajes de números no registrados
- [ ] 7.5.3 — Para cada uno: teléfono, texto, fecha, tipo
- [ ] 7.5.4 — Botón "Dar de alta como cliente" → redirige a `/clientes/nuevo` con `whatsapp` prellenado
- [ ] 7.5.5 — Botón "Marcar como ignorado" → delete del registro
- [ ] 7.5.6 — Commit: `feat(desconocidos): unknown numbers inbox`

### 7.6 — Mensajes Enviados (log)

- [ ] 7.6.1 — `app/(app)/dashboard/mensajes/page.tsx`
- [ ] 7.6.2 — Tabla con: Cliente, Plantilla, Periodo, Offset, Estado, Fecha
- [ ] 7.6.3 — Filtros: cliente, periodo, estado
- [ ] 7.6.4 — Paginación
- [ ] 7.6.5 — Commit: `feat(mensajes): sent messages log`

### 7.7 — Configuración

- [ ] 7.7.1 — `app/(app)/dashboard/configuracion/page.tsx`
- [ ] 7.7.2 — Sección 1: **Información de pago**
  - [ ] 7.7.2.1 — Textarea con el contenido de `NEXT_PUBLIC_PAYMENT_INFO`
  - [ ] 7.7.2.2 — Guardar en una tabla `configuracion` (key-value) o en variable de entorno del servidor
- [ ] 7.7.3 — Sección 2: **Plantillas de mensaje**
  - [ ] 7.7.3.1 — Lista de las 8 plantillas (solo las editables: las 6 automáticas + pago_validado + pago_rechazado)
  - [ ] 7.7.3.2 — Editor inline con preview de variables disponibles (`{{nombre}}`, `{{monto}}`, etc.)
  - [ ] 7.7.3.3 — Toggle activo/inactivo
  - [ ] 7.7.3.4 — Guardar cambios en `plantillas`
- [ ] 7.7.4 — Sección 3: **Info de la cuenta**
  - [ ] 7.7.4.1 — Email del admin
  - [ ] 7.7.4.2 — Botón "Cerrar sesión" / "Cambiar contraseña"
- [ ] 7.7.5 — Commit: `feat(configuracion): settings page`

### Criterios de Salida Fase 7
- [ ] Comprobantes se ven, validan y rechazan end-to-end
- [ ] Storage se borra al resolver
- [ ] Mensajes automáticos de validación/rechazo se envían
- [ ] Plantillas editables desde UI
- [ ] Números desconocidos tienen vista dedicada

---

## 🚀 FASE 8 — Deploy y Configuración Final en Meta

> **Tiempo: 25 min**

### 8.1 — Deploy del Frontend en Vercel

- [ ] 8.1.1 — Crear cuenta en [vercel.com](https://vercel.com) (sign in with GitHub)
- [ ] 8.1.2 — Opción A: Subir el repo a GitHub primero → Importar en Vercel
  - [ ] 8.1.2.1 — `git remote add origin <repo-url>`
  - [ ] 8.1.2.2 — `git push -u origin main`
  - [ ] 8.1.2.3 — En Vercel → New Project → Import repo
- [ ] 8.1.3 — Opción B: Deploy directo con CLI
  - [ ] 8.1.3.1 — `vercel login`
  - [ ] 8.1.3.2 — `vercel` (sigue el wizard)
- [ ] 8.1.4 — Configurar variables de entorno en Vercel (Project Settings → Environment Variables):
  - [ ] 8.1.4.1 — `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] 8.1.4.2 — `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] 8.1.4.3 — `NEXT_PUBLIC_APP_NAME`
  - [ ] 8.1.4.4 — `NEXT_PUBLIC_PAYMENT_INFO`
- [ ] 8.1.5 — Deploy: `vercel --prod` o push a main
- [ ] 8.1.6 — Anotar URL de producción: `https://alebrijes-cobranza.vercel.app`

### 8.2 — Configurar Webhook en Meta

- [ ] 8.2.1 — Ir a [developers.facebook.com](https://developers.facebook.com) → tu app → **WhatsApp → Configuration**
- [ ] 8.2.2 — En la sección **Webhook**, click **Edit**:
  - [ ] 8.2.2.1 — **Callback URL:** `https://<project_ref>.supabase.co/functions/v1/whatsapp-webhook`
  - [ ] 8.2.2.2 — **Verify Token:** el mismo que `WHATSAPP_WEBHOOK_VERIFY_TOKEN` (ej: `alebrijes_2026_xyz`)
  - [ ] 8.2.2.3 — Click **Verify and Save**
- [ ] 8.2.3 — En **Webhook Fields**, click **Manage** y suscribirse a:
  - [ ] 8.2.3.1 — `messages` ✓
  - [ ] 8.2.3.2 — `message_template_status_update` ✓
- [ ] 8.2.4 — En la misma página, **Webhook Permissions** (o App Settings → Advanced) verificar que el webhook puede recibir eventos del WABA

### 8.3 — Verificar Webhook Activo

- [ ] 8.3.1 — El estado del webhook debe mostrarse como **"Connected"** o con un check verde
- [ ] 8.3.2 — En la sección "Test" o "Recent deliveries" probar enviar un mensaje de prueba al número del club
- [ ] 8.3.3 — Verificar logs en Supabase: `supabase functions logs whatsapp-webhook --tail`

### 8.4 — Smoke Test E2E

- [ ] 8.4.1 — **Test 1: Login**
  - [ ] 8.4.1.1 — Abrir la URL de producción
  - [ ] 8.4.1.2 — Login con admin
  - [ ] 8.4.1.3 — Verificar dashboard cargó
- [ ] 8.4.2 — **Test 2: Crear cliente**
  - [ ] 8.4.2.1 — Ir a Clientes → Nuevo
  - [ ] 8.4.2.2 — Llenar: nombre, whatsapp (tu número personal de prueba), día 15, monto $500
  - [ ] 8.4.2.3 — Guardar
  - [ ] 8.4.2.4 — Verificar que aparece en la lista
- [ ] 8.4.3 — **Test 3: Webhook entrante**
  - [ ] 8.4.3.1 — Desde tu WhatsApp, enviar una imagen (cualquier foto) al número del club
  - [ ] 8.4.3.2 — Esperar 5-10 segundos
  - [ ] 8.4.3.3 — Verificar en `/comprobantes` que aparece el pendiente con thumbnail
- [ ] 8.4.4 — **Test 4: Validar comprobante**
  - [ ] 8.4.4.1 — Click "Validar" en el comprobante
  - [ ] 8.4.4.2 — Asignar periodo: mes actual
  - [ ] 8.4.4.3 — Confirmar
  - [ ] 8.4.4.4 — Verificar en tu WhatsApp que llegó el mensaje "✅ Tu pago ha sido validado..."
- [ ] 8.4.5 — **Test 5: Recordatorio manual**
  - [ ] 8.4.5.1 — Crear otro cliente con día de pago = hoy
  - [ ] 8.4.5.2 — Esperar 1 minuto o forzar el cron manualmente
  - [ ] 8.4.5.3 — Verificar que llegó el mensaje "Hoy es tu fecha de pago..."
  - [ ] 8.4.5.4 — Verificar en `/mensajes` que se logueó
- [ ] 8.4.6 — **Test 6: RLS**
  - [ ] 8.4.6.1 — Abrir DevTools → Application → LocalStorage
  - [ ] 8.4.6.2 — Intentar hacer una query directa a Supabase con `anon` key → debe fallar
- [ ] 8.4.7 — **Test 7: Número desconocido**
  - [ ] 8.4.7.1 — Enviar un mensaje desde un número NO registrado
  - [ ] 8.4.7.2 — Verificar en `/desconocidos` que aparece

### 8.5 — Configurar Monitoreo Básico

- [ ] 8.5.1 — En Supabase Dashboard → Logs, verificar que no hay errores recurrentes
- [ ] 8.5.2 — Configurar alertas en Vercel (si plan Pro) o vigilar logs manualmente
- [ ] 8.5.3 — Documentar procedimiento de rollback: redeploy de Vercel + `supabase functions deploy` con versión anterior

### 8.6 — Documentación de Operación

- [ ] 8.6.1 — Crear `docs/OPERATIONS.md` con:
  - [ ] 8.6.1.1 — Cómo agregar un cliente nuevo
  - [ ] 8.6.1.2 — Cómo validar un comprobante
  - [ ] 8.6.1.3 — Cómo cambiar info de pago
  - [ ] 8.6.1.4 — Cómo editar una plantilla
  - [ ] 8.6.1.5 — Procedimiento ante cliente moroso
  - [ ] 8.6.1.6 — Cómo ver el log de mensajes
  - [ ] 8.6.1.7 — Contacto de soporte técnico
- [ ] 8.6.2 — Compartir credenciales con el admin del club por canal seguro

### Criterios de Salida Fase 8
- [ ] App en producción y accesible
- [ ] Webhook de Meta configurado y verificado
- [ ] Smoke tests E2E pasan
- [ ] Admin sabe usar el dashboard

---

## ✨ FASE 9 — Pulido Opcional

> **Tiempo: 30+ min (cada item es independiente)**

- [ ] 9.1 — **Loading states** con skeletons de shadcn en todas las páginas
- [ ] 9.2 — **Toasts de éxito/error** consistentes en todas las acciones
- [ ] 9.3 — **Confirmaciones de borrado** (Dialog con "¿Estás seguro?")
- [ ] 9.4 — **Modo oscuro** con toggle (paleta adaptada)
- [ ] 9.5 — **Exportar reporte mensual a CSV**
- [ ] 9.6 — **Gráficas adicionales** en reportes (evolución mensual, distribución de morosidad)
- [ ] 9.7 — **Búsqueda global** en el topbar (clientes, mensajes, etc.)
- [ ] 9.8 — **Notificaciones en el navegador** cuando hay comprobantes nuevos (Web Push API)
- [ ] 9.9 — **Auditoría**: tabla `audit_log` que registra cada acción del admin
- [ ] 9.10 — **Multi-admin**: invitar a más personas con Supabase Auth
- [ ] 9.11 — **Plantillas de Meta pre-aprobadas** para cobranza (utility template) si los `text` directos son rechazados
- [ ] 9.12 — **Tests automatizados** (Vitest + Playwright)
- [ ] 9.13 — **CI/CD** con GitHub Actions (lint + typecheck + test en cada PR)
- [ ] 9.14 — **Internacionalización** (i18n) por si se quiere usar en otro equipo
- [ ] 9.15 — **PWA** para instalar como app nativa en el celular del admin

---

## 🧪 Smoke Tests Finales

Antes de marcar el proyecto como entregado, ejecutar todos estos tests:

- [ ] T.1 — Login con credenciales correctas → entra a dashboard
- [ ] T.2 — Login con credenciales incorrectas → error claro
- [ ] T.3 — Logout desde sidebar → regresa a /login
- [ ] T.4 — Intentar acceder a `/dashboard` sin sesión → redirect a `/login`
- [ ] T.5 — Crear cliente con datos válidos → aparece en lista
- [ ] T.6 — Crear cliente con WhatsApp inválido → validación Zod bloquea
- [ ] T.7 — Crear cliente con día_pago distinto a 15/30 → validación bloquea
- [ ] T.8 — Editar cliente → cambios persisten
- [ ] T.9 — Soft-delete cliente → desaparece de la lista principal
- [ ] T.10 — "Marcar como pagado" sin comprobante → se crea el pago
- [ ] T.11 — Verificar que cliente con pago no recibe más recordatorios del mes
- [ ] T.12 — Enviar imagen al número de WhatsApp → aparece en /comprobantes
- [ ] T.13 — Enviar PDF al número de WhatsApp → aparece en /comprobantes
- [ ] T.14 — Validar comprobante → cliente recibe WhatsApp de "pago validado"
- [ ] T.15 — Validar comprobante → archivo se borra de Storage
- [ ] T.16 — Rechazar comprobante con motivo → cliente recibe WhatsApp
- [ ] T.17 — Enviar mensaje desde número desconocido → aparece en /desconocidos
- [ ] T.18 — "Dar de alta" desde desconocidos → redirige a /clientes/nuevo con whatsapp prellenado
- [ ] T.19 — Crear cliente con día de pago = hoy → en máximo 15min recibe "Hoy es tu fecha de pago"
- [ ] T.20 — Cron se ejecuta solo al día siguiente sin intervención
- [ ] T.21 — Dashboard muestra KPIs correctos del mes
- [ ] T.22 — Reportes muestran datos del mes seleccionado
- [ ] T.23 — Editar plantilla en /configuracion → cambio aplica a siguiente mensaje
- [ ] T.24 — Editar info de pago → aparece en mensajes `pago_hoy` y `atraso_*`
- [ ] T.25 — App funciona en móvil (probada en DevTools responsive)
- [ ] T.26 — App funciona en tablet
- [ ] T.27 — App funciona en desktop
- [ ] T.28 — Verificar que service_role key NO está en el bundle del frontend (`grep -r "service_role" .next`)
- [ ] T.29 — Verificar que no hay secrets en el repo (`git log -p | grep -i "token\|secret\|key"`)
- [ ] T.30 — Lighthouse score > 90 en Performance y Accessibility

---

## 📋 Checklist de Entrega

### Documentación
- [ ] `README.md` actualizado con instrucciones reales
- [ ] `plan.md` refleja lo implementado
- [ ] `docs/OPERATIONS.md` (o sección en README) con guía para el admin
- [ ] `docs/TROUBLESHOOTING.md` con problemas comunes y soluciones
- [ ] `CHANGELOG.md` con la versión inicial

### Código
- [ ] Todas las tareas de Fase 0-8 completadas
- [ ] `pnpm lint` sin errores
- [ ] `pnpm typecheck` sin errores
- [ ] `pnpm build` exitoso
- [ ] Código commiteado en Git con mensajes descriptivos
- [ ] Repo en GitHub (privado) o GitLab

### Infraestructura
- [ ] Supabase proyecto activo y pagado (si aplica)
- [ ] Vercel deploy en producción
- [ ] Meta app activa con webhook verificado
- [ ] pg_cron programado y verificado

### Credenciales y Acceso
- [ ] Admin user creado en Supabase Auth
- [ ] Passwords en gestor seguro
- [ ] Tokens de Meta documentados
- [ ] Variables de entorno configuradas en Vercel

### Entrega al Cliente
- [ ] Demo en vivo al admin del club
- [ ] Capacitación básica (30 min)
- [ ] URL de producción enviada por canal seguro
- [ ] Credenciales de login entregadas
- [ ] Contacto de soporte definido

---

## 📊 Resumen de Tiempos

| Fase | Tiempo |
|---|---|
| P — Prerrequisitos | 30–60 min |
| 0 — Preparación | 10 min |
| 1 — Bootstrap | 20 min |
| 2 — DB | 25 min |
| 3 — Edge Functions | 35 min |
| 4 — Auth + Layout | 25 min |
| 5 — Clientes CRUD | 35 min |
| 6 — Dashboard + Reportes | 25 min |
| 7 — Comprobantes + resto | 40 min |
| 8 — Deploy + Meta + Tests | 25 min |
| **Total core (0-8)** | **~4 horas** |
| 9 — Pulido | +30 min opcional |

---

## 🎯 Próximo Paso

Sal del modo plan cuando quieras y empezaremos con la **Fase 1: Bootstrap del Frontend** (a menos que quieras ejecutar las Fases P y 0 primero si aún no tienes las credenciales de Meta).
