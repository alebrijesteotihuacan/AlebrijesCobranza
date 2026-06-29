# Monitoring y Observabilidad

> Documento de referencia para 8.5.1 y 8.5.2 del plan.
> Plan: Hobby (Vercel Free + Supabase Free) — sin alertas built-in, se requiere monitoreo manual.

## 📊 Estado actual de servicios

| Servicio | Plan | Estado | URL |
|---|---|---|---|
| Vercel | Hobby | ✅ Activo | https://alebrijes-cobranza.vercel.app |
| Supabase | Free | ✅ Activo | https://wcsqafedvjjwtntepmhf.supabase.co |
| Edge Functions | - | ✅ 3/3 ACTIVE | `enviar-mensaje`, `enviar-recordatorios`, `whatsapp-webhook` |

## 🔍 Health checks (ejecutar diariamente)

### 1. Verificar que la app responde

```bash
# Health check básico
curl -sS -o /dev/null -w "HTTP %{http_code} | time=%{time_total}s\n" https://alebrijes-cobranza.vercel.app/
curl -sS -o /dev/null -w "HTTP %{http_code} | time=%{time_total}s\n" https://alebrijes-cobranza.vercel.app/login
```

**Esperado**: HTTP 307 (raíz redirige a /login) y HTTP 200 (login page).

### 2. Verificar que las Edge Functions responden

```bash
# Webhook con verify token
curl -sS -o /dev/null -w "Webhook GET: HTTP %{http_code} | time=%{time_total}s\n" \
  "https://wcsqafedvjjwtntepmhf.supabase.co/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=CobranzaAlebrijes2026&hub.challenge=99999"
```

**Esperado**: HTTP 200 con body `99999`.

### 3. Verificar estado de las 3 funciones (API)

```bash
curl -sS -H "Authorization: Bearer $SUPABASE_TOKEN" \
  "https://api.supabase.com/v1/projects/wcsqafedvjjwtntepmhf/functions" \
  | jq '.[] | {name: .slug, version: .version, status: .status}'
```

**Esperado**: 3 funciones con `status: ACTIVE`.

### 4. Métricas operacionales (SQL directo)

```sql
-- Mensajes con error en las últimas 24h
SELECT count(*) AS pagos_fallidos_24h
FROM mensajes_enviados
WHERE estado = 'fallido' AND enviado_at > now() - interval '24 hours';

-- Comprobantes pendientes de revisión
SELECT count(*) AS comprobantes_pendientes
FROM comprobantes_recibidos
WHERE estado = 'pendiente';

-- Mensajes de números desconocidos en los últimos 7 días
SELECT count(*) AS desconocidos_7d
FROM mensajes_desconocidos
WHERE recibido_at > now() - interval '7 days';

-- Clientes activos vs inactivos
SELECT
  count(*) FILTER (WHERE activo) AS activos,
  count(*) FILTER (WHERE NOT activo) AS inactivos
FROM clientes;
```

**Esperado** (en estado normal):
- `pagos_fallidos_24h`: 0 (o solo los esperados por phone no verificado)
- `comprobantes_pendientes`: 0 (después de revisar)
- `desconocidos_7d`: 0
- `activos` = total de clientes válidos

### 5. Vercel: estado del proyecto

```bash
curl -sS -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v10/projects/prj_dI3c17HPPTdYBrqec3dtF3qtqYrA" \
  | jq '{id, name, live}'
```

**Esperado**: `"live": true`.

## 📋 Checklist diario (5 min)

```markdown
- [ ] App responde (curl / y /login)
- [ ] Webhook responde (curl con verify token)
- [ ] 3 Edge Functions ACTIVE
- [ ] Cero pagos fallidos en 24h (excluyendo phone no verificado)
- [ ] Cero comprobantes pendientes sin revisar
- [ ] No hay mensajes de números desconocidos sin revisar
```

## ⚠️ Monitoreo de errores recurrentes

### Logs de Supabase Edge Functions
- URL: https://supabase.com/dashboard/project/wcsqafedvjjwtntepmhf/logs/edge-functions
- Revisar semanalmente errores `console.error` que aparezcan repetidamente
- Errores comunes a vigilar:
  - `(#133010) Account not registered` → esperado hasta verificar el phone de WhatsApp
  - `Invalid signature` → alguien está mandando POSTs sin firma HMAC válida
  - `JSON.parse` errors → Meta envió payload malformado
  - Errores de RLS (no deberían ocurrir porque usamos service_role)

### Logs de Vercel
- URL: https://vercel.com/alebrijesteotihuacanoficial-2469s-projects/alebrijes-cobranza/logs
- Plan Hobby: solo logs de Functions y Edge Middleware
- No hay logs de Next.js runtime en plan Free
- Vigilar errores 5xx (> 5 en 10 min = problema)

## 📢 Configuración de alertas (manual)

> **Limitación**: el plan Hobby de Vercel NO tiene alertas built-in. Hay que hacerlo manual.

### Alertas recomendadas

1. **Pingdom / UptimeRobot** (gratis):
   - Monitorear `https://alebrijes-cobranza.vercel.app/`
   - Alerta por email si baja 5xx
   - Configurar: check cada 5 min

2. **Google Sheets + Apps Script** (DIY):
   - Cron que consulta la API de Vercel cada hora
   - Envía email si hay deploys fallidos

3. **Suscribirse a GitHub notifications**:
   - En el repo `alebrijesteotihuacan/AlebrijesCobranza`
   - Settings → Notifications → marcar "Push" para pushes a main

### Notificaciones manuales (cuando algo falla)

1. Verificar inmediatamente:
   - Supabase Dashboard → Logs
   - Vercel Dashboard → Logs
   - `git log -1` (último commit puede ser el culpable)
2. Si es bug de código: revertir con `git revert <commit>` y push
3. Si es bug de Meta (phone no verificado, API rate limit): ver [ROLLBACK.md](ROLLBACK.md)

## 📈 Métricas a monitorear mensualmente

| Métrica | Valor saludable | Acción si no saludable |
|---|---|---|
| Tasa de pagos exitosos | > 90% | Revisar logs de Meta, ver si phone verificado |
| Comprobantes procesados en <24h | > 95% | Al admin: revisar bandeja |
| Tasa de números desconocidos | < 5% | Considerar agregar clientes automáticamente |
| Latencia webhook (POST → 200) | < 2s | Revisar performance de Supabase |

## 🔗 Links útiles

- App: https://alebrijes-cobranza.vercel.app
- Dashboard Supabase: https://supabase.com/dashboard/project/wcsqafedvjjwtntepmhf
- Dashboard Vercel: https://vercel.com/alebrijesteotihuacanoficial-2469s-projects/alebrijes-cobranza
- Logs Edge Functions: https://supabase.com/dashboard/project/wcsqafedvjjwtntepmhf/logs/edge-functions
- GitHub: https://github.com/alebrijesteotihuacan/AlebrijesCobranza

## 📝 Última revisión

- **Fecha**: 2026-06-29
- **Estado**: ✅ Todo OK
- **Funciones ACTIVE**: 3/3
- **Deploys READY**: 5
- **Errores recurrentes**: Ninguno
