# Procedimiento de Rollback

> Documento de referencia para 8.5.3 del plan.
> Cubre 3 escenarios: rollback de Vercel, rollback de Edge Functions, y rollback de DB.

## 🚨 Cuándo hacer rollback

- Deploy de Vercel causa errores 5xx generalizados
- Edge Function lanza errores no controlados que afectan a muchos usuarios
- Migración de DB causa pérdida de datos
- Configuración de Meta cambia y rompe el envío de WhatsApp

## 🟢 Escenario 1: Rollback de Vercel (frontend)

> **Cuándo**: la app en producción muestra errores 5xx, la UI está rota, o un cambio reciente rompió algo.

### Opción A: Rollback via Vercel Dashboard (1-click)
1. Ir a https://vercel.com/alebrijesteotihuacanoficial-2469s-projects/alebrijes-cobranza/deployments
2. Encontrar el último deploy marcado como "Ready" (no el actual roto)
3. Click en los 3 puntos → **"Promote to Production"**
4. Vercel instantáneamente redirige el dominio `alebrijes-cobranza.vercel.app` a ese deploy
5. **Tiempo**: < 30 segundos, **downtime**: 0 (atomic swap)

### Opción B: Rollback via CLI
```bash
# Primero autenticarse (si no está logueado)
vercel login

# Rollback (Vercel preguntará a qué deploy volver)
vercel rollback
# Si tienes token en variable de entorno:
# VERCEL_TOKEN=$VERCEL_TOKEN vercel rollback
```
Vercel te preguntará a qué deploy volver. Selecciona el último estable.

### Opción C: Rollback via API (automatizable)
```bash
# Obtener deploys
curl -sS -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v6/deployments?projectId=prj_dI3c17HPPTdYBrqec3dtF3qtqYrA&limit=10" \
  | jq '.deployments[] | {uid, state, created}'

# Rollback al deploy anterior (cambiar DEPLOY_ID)
curl -sS -X POST -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v1/projects/prj_dI3c17HPPTdYBrqec3dtF3qtqYrA/rollback/$DEPLOY_ID"
```

### Verificar que el rollback funcionó
```bash
curl -sS -o /dev/null -w "HTTP %{http_code}\n" https://alebrijes-cobranza.vercel.app/login
```

---

## 🟡 Escenario 2: Rollback de Edge Functions (backend)

> **Cuándo**: una Edge Function deployada tiene un bug crítico que rompe el envío de WhatsApp o el procesamiento del webhook.

> **Limitación**: Supabase CLI **no tiene** un `supabase functions rollback`. Hay que **redeployar la versión anterior** desde Git.

### Procedimiento

1. **Encontrar el commit anterior estable**:
   ```bash
   git log --oneline supabase/functions/<funcion>/
   ```
   Ejemplo:
   ```bash
   git log --oneline supabase/functions/whatsapp-webhook/
   ```
   
2. **Ver el contenido del commit anterior** (opcional, para verificar):
   ```bash
   git show <commit-anterior>:supabase/functions/whatsapp-webhook/index.ts | head -50
   ```

3. **Revertir el archivo localmente**:
   ```bash
   git checkout <commit-anterior> -- supabase/functions/whatsapp-webhook/index.ts
   ```

4. **Redeployar**:
   ```bash
   supabase functions deploy whatsapp-webhook --no-verify-jwt
   ```

5. **Verificar**:
   ```bash
   curl -sS -w "Webhook GET: HTTP %{http_code}\n" \
     "https://wcsqafedvjjwtntepmhf.supabase.co/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=CobranzaAlebrijes2026&hub.challenge=12345"
   ```

6. **Commitear el rollback** (para mantener git en sync):
   ```bash
   git add supabase/functions/
   git commit -m "rollback: revert whatsapp-webhook to <commit-anterior>"
   git push origin main
   ```

### Rollback de TODAS las funciones (si afecta a todas)
```bash
# Revertir todos los archivos de functions
git checkout <commit-anterior> -- supabase/functions/
# Redeployar las 3
supabase functions deploy whatsapp-webhook --no-verify-jwt
supabase functions deploy enviar-mensaje
supabase functions deploy enviar-recordatorios
# Verificar
curl -sS -w "Webhook: HTTP %{http_code}\n" "https://wcsqafedvjjwtntepmhf.supabase.co/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=CobranzaAlebrijes2026&hub.challenge=12345"
```

---

## 🔴 Escenario 3: Rollback de DB (migración)

> **Cuándo**: una migración SQL causó pérdida de datos, alteración de schema incompatible, o un índice faltante.

> **Limitación crítica**: Supabase NO tiene rollback automático de migraciones. Las migraciones son forward-only. **Una mala migración NO se puede deshacer automáticamente**.

### Procedimiento: Crear migración de rollback

1. **Identificar la migración problemática**:
   ```bash
   git log --oneline supabase/migrations/
   ```

2. **NO revertir la migración** (puede romper si los datos ya se modificaron)

3. **Crear una nueva migración** que revierta los cambios manualmente:
   ```bash
   # Crear nueva migración con timestamp
   supabase migration new rollback_<nombre>
   ```

4. **Ejemplo: agregar UNIQUE constraint que se olvidó**:
   ```sql
   -- 20260629140000_rollback_unique_fix.sql
   -- Esta migración NO revierte nada, agrega el constraint faltante
   ALTER TABLE mensajes_desconocidos
     ADD CONSTRAINT mensajes_desconocidos_whatsapp_message_id_key
     UNIQUE (whatsapp_message_id);
   ```

5. **Ejemplo: renombrar columna peligrosa**:
   ```sql
   -- 20260629140000_rollback_column_rename.sql
   ALTER TABLE clientes RENAME COLUMN monto TO monto_legacy;
   ALTER TABLE clientes ADD COLUMN monto numeric(10,2);
   -- Migrar datos: UPDATE clientes SET monto = monto_legacy;
   -- DROP COLUMN monto_legacy (solo después de verificar)
   ```

6. **Aplicar**:
   ```bash
   supabase db push
   ```

### Si necesitas restaurar datos eliminados

1. **Supabase Free** NO tiene Point-in-Time Recovery (PITR)
2. **Plan Pro** (no estamos en él) sí tiene PITR de 7 días
3. **Workaround en plan Free**:
   - Si los datos son críticos, contacta a Supabase Support
   - Si no, reconstruye desde otras fuentes (mensajes de WhatsApp, otros sistemas)

---

## 🟣 Escenario 4: Rollback de secrets de Meta/Supabase

> **Cuándo**: un secret nuevo (WHATSAPP_TOKEN, APP_SECRET, etc.) está mal y rompe el envío.

### Procedimiento

1. **Revertir al secret anterior** (si lo guardaste en un gestor de passwords):
   ```bash
   supabase secrets set \
     WHATSAPP_TOKEN=<anterior> \
     WHATSAPP_APP_SECRET=<anterior>
   ```

2. **Redeploy de las funciones** (para que tomen el nuevo secret):
   ```bash
   supabase functions deploy whatsapp-webhook --no-verify-jwt
   supabase functions deploy enviar-mensaje
   supabase functions deploy enviar-recordatorios
   ```

3. **Test E2E**:
   ```bash
   # Generar firma con el secret anterior (que sí es válido)
   node -e "const crypto = require('crypto'); console.log('sha256=' + crypto.createHmac('sha256', '<APP_SECRET_ANTERIOR>').update('{}').digest('hex'))"
   
   # Test webhook
   curl -sS -w "HTTP %{http_code}\n" -X POST \
     -H "Content-Type: application/json" \
     -H "X-Hub-Signature-256: <signature>" \
     -d '{}' \
     "https://wcsqafedvjjwtntepmhf.supabase.co/functions/v1/whatsapp-webhook"
   ```
   **Esperado**: HTTP 401 (Invalid signature - porque el secret actual es otro). Si retorna 200, el rollback funcionó.

---

## ⏱️ Tiempos de rollback por escenario

| Escenario | Tiempo | Downtime |
|---|---|---|
| Vercel deploy roto | 1-2 min | 0 (atomic swap) |
| Edge Function bug | 3-5 min | 0 (cold start ~1s) |
| Secret de Meta | 3-5 min | 0 (no downtime, solo envíos fallan) |
| Migración SQL peligrosa | 30-60 min | 0 (corrección en nueva migración) |
| Datos eliminados | Sin recovery (plan Free) | - |

## 🛡️ Prevención

- **NUNCA** deployes a `main` sin haber testeado localmente (`pnpm build` + tests manuales)
- **SIEMPRE** usa migraciones additive (add column, add index) en vez de destructive (drop column, drop table)
- **NUNCA** borres datos sin un backup
- **SIEMPRE** guarda los secrets anteriores en un gestor de passwords (1Password, Bitwarden)
- **SIEMPRE** lee los logs de Vercel/Supabase después de un deploy
- **CONFIGURA** UptimeRobot (gratis) en `https://alebrijes-cobranza.vercel.app/` con alertas por email

## 📞 Contactos de emergencia

- Meta for Business Help: https://www.facebook.com/business/help
- Supabase Support: https://supabase.com/dashboard/support
- Vercel Support: https://vercel.com/help
- Repo del proyecto: https://github.com/alebrijesteotihuacan/AlebrijesCobranza
