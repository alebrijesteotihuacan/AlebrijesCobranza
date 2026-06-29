# 🏀 Alebrijes Cobranza

App de cobranza mensual por WhatsApp para **Alebrijes Oaxaca — Fuerzas Básicas Teotihuacán**.

> Dashboard web simple + Supabase + Meta WhatsApp Cloud API.
> El sistema envía recordatorios automáticos y permite validar comprobantes de pago manualmente.

---

## ✨ Funcionalidades

- 📋 **CRUD de clientes** con nombre, WhatsApp, día de pago (15/30) y monto
- ⏰ **Recordatorios automáticos** vía WhatsApp en -3, -1, 0, +1, +3 y +7 días
- 📩 **Recepción de comprobantes** de pago vía WhatsApp (imagen/PDF)
- ✅ **Validación manual** de comprobantes desde el dashboard
- 💬 **Confirmación automática** al cliente cuando su pago es validado
- 📊 **Reportes** mensuales: cobrado, morosos, por vencer
- 🔐 **Login** con email/password (Supabase Auth)
- 📱 **Responsive** mobile-first

---

## 🛠️ Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui |
| Backend | Supabase (Postgres + Auth + Edge Functions + pg_cron + Storage) |
| Mensajería | Meta WhatsApp Cloud API |
| Deploy | Vercel + Supabase Cloud |

---

## 📂 Estructura

```
.
├── app/                          # Next.js App Router
│   ├── (auth)/login/
│   └── (app)/dashboard/...
├── components/                   # UI components
│   ├── ui/                       # shadcn primitives
│   ├── dashboard/
│   ├── clientes/
│   ├── comprobantes/
│   └── mensajes/
├── lib/                          # utils, supabase clients, validations
├── public/assets/                # logos Alebrijes
├── supabase/
│   ├── functions/                # Edge Functions
│   │   ├── whatsapp-webhook/
│   │   ├── enviar-mensaje/
│   │   └── enviar-recordatorios/
│   └── migrations/               # SQL migrations
├── plan.md                       # 📋 Plan completo del proyecto
└── README.md                     # ← este archivo
```

---

## 🚀 Quick Start (desarrollo local)

### 1. Requisitos previos
- Node.js 20+ y pnpm/npm
- Cuenta de Supabase
- Cuenta de Meta for Developers con WhatsApp Business API configurada
- Vercel CLI (opcional, para deploy)

### 2. Clonar e instalar
```bash
git clone <repo>
cd AlebrijesCobranza
pnpm install
```

### 3. Variables de entorno
Copiar `.env.example` a `.env.local` y completar:

```bash
# Frontend (público)
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
NEXT_PUBLIC_APP_NAME="Alebrijes Cobranza"
NEXT_PUBLIC_PAYMENT_INFO="Banco X · Cuenta 1234 · CLABE 567"

# Edge Functions (secretos) — NO commitear
# Se configuran con: supabase secrets set KEY=VALUE
# WHATSAPP_TOKEN=...
# WHATSAPP_PHONE_NUMBER_ID=...
# WHATSAPP_APP_SECRET=...
# WHATSAPP_WEBHOOK_VERIFY_TOKEN=...
# SUPABASE_SERVICE_ROLE_KEY=...
```

### 4. Base de datos
```bash
# Aplicar migraciones
supabase db push

# O ejecutar manualmente el SQL de supabase/migrations/
```

### 5. Edge Functions
```bash
# Deploy
supabase functions deploy whatsapp-webhook
supabase functions deploy enviar-mensaje
supabase functions deploy enviar-recordatorios

# Setear secretos
supabase secrets set WHATSAPP_TOKEN=... \
                    WHATSAPP_PHONE_NUMBER_ID=... \
                    WHATSAPP_APP_SECRET=... \
                    WHATSAPP_WEBHOOK_VERIFY_TOKEN=alebrijes_2026 \
                    SUPABASE_SERVICE_ROLE_KEY=...
```

### 6. Configurar webhook en Meta
1. developers.facebook.com → tu app → WhatsApp → Configuration
2. **Webhook URL:** `https://<tu-proyecto>.supabase.co/functions/v1/whatsapp-webhook`
3. **Verify Token:** `alebrijes_2026`
4. **Webhook Fields:** `messages`, `message_template_status_update`
5. App Settings → Basic → copiar **App Secret** → `WHATSAPP_APP_SECRET`

### 7. Crear admin
En Supabase Dashboard → Authentication → Users → Add user (email + password).

### 8. Correr en dev
```bash
pnpm dev
# Abre http://localhost:3000
```

---

## 📋 Plan del Proyecto

Ver [`plan.md`](./plan.md) para el plan completo con:
- Arquitectura detallada
- Modelo de datos (DDL)
- Edge Functions
- Fases de implementación
- Decisiones de diseño

---

## 🎨 Paleta de Colores

| Token | Hex | Uso |
|---|---|---|
| Orange | `#F47920` | Botones primarios, acentos |
| Orange Dark | `#C45A12` | Hover |
| Red | `#D63A1A` | Errores, morosidad |
| Black | `#0A0A0A` | Texto, navbar |
| Success | `#16A34A` | Pagado / Validado |
| Warning | `#EAB308` | Pendiente |

**Tipografía:** Inter (cuerpo) + Bebas Neue (títulos).

---

## 📞 Ciclo de Mensajes

| Offset | Mensaje |
|---|---|
| -3 días | "En 3 días es la fecha de pago..." |
| -1 día | "Mañana es tu fecha de pago..." |
| 0 (día) | "Hoy es tu fecha de pago. Realiza a: ..." |
| +1 día | "Tienes 1 día de atraso..." |
| +3 días | "Tienes 3 días de atraso..." |
| +7 días | "Tienes 7 días de atraso..." |

Todos los días se calculan en `America/Mexico_City` (UTC-6).

---

## 🔐 Seguridad

- **RLS estricto** en todas las tablas (anon sin acceso)
- **Service role key** solo en Edge Functions (nunca en frontend)
- **Webhook firma** validada con `X-Hub-Signature-256`
- **Storage privado** con URLs firmadas temporales
- Comprobantes **borrados** al validar/rechazar; limpieza automática a los 7 días

---

## 📜 Licencia

Privado — uso interno de Alebrijes Oaxaca.
