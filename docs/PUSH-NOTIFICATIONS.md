# Push Notifications (9.8) — Setup Guide

> Web Push requiere claves VAPID. Este doc explica cómo generarlas y configurarlas.

## 1. Generar claves VAPID

### Opción A — OpenSSL (sin instalar nada)

```bash
# Genera un par de claves EC (NIST P-256)
openssl ecparam -name prime256v1 -genkey -noout -out vapid_private.pem
openssl ec -in vapid_private.pem -outform DER -out vapid_private.der
openssl pkcs8 -in vapid_private.pem -topk8 -nocrypt -outform DER -out vapid_private_pkcs8.der

# Extrae la clave pública
openssl ec -in vapid_private.pem -pubout -outform DER -out vapid_public_raw.der

# Codifica en base64 URL-safe
PUBLIC_KEY=$(openssl ec -in vapid_private.pem -pubout -outform DER 2>/dev/null | openssl asn1parse -inform DER | tail -1 | cut -d: -f4 | xxd -r -p | base64 | tr -d '=' | tr '/+' '_-')
echo "VAPID_PUBLIC_KEY=$PUBLIC_KEY"
```

### Opción B — web-push CLI (recomendado)

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Output:
```
Public Key:  BAd...long-string...
Private Key: Kp...long-string...
```

## 2. Configurar en Vercel

1. Ir a [vercel.com](https://vercel.com) → tu proyecto → Settings → Environment Variables
2. Agregar:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = (la pública)
3. NO commitear la clave privada (sería un secret leak)
4. Hacer redeploy

## 3. (Opcional) Configurar en Supabase para push del backend

Si querés que la Edge Function `whatsapp-webhook` envíe push a los admins cuando llega un comprobante:

1. En Supabase Dashboard → Settings → Edge Functions → Secrets:
   - `VAPID_PUBLIC_KEY` = (la pública)
   - `VAPID_PRIVATE_KEY` = (la privada)
   - `VAPID_SUBJECT` = `mailto:admin@alebrijes.com`

2. En el webhook, después de crear el comprobante, llamar a la Edge Function `enviar-push` con los datos del comprobante

## 4. Activar en el navegador

1. Abrir la app en Chrome/Edge/Firefox
2. Click en el ícono de campana 🔔 en el topbar
3. Aceptar el permiso del navegador
4. ¡Listo! Recibirás notificaciones nativas cuando el backend envíe pushes

## 5. Verificar suscripción

En Supabase Studio → `push_subscriptions`:
```sql
select user_id, endpoint, created_at from push_subscriptions;
```

## 6. Probar el push (manual con curl)

```bash
curl -X POST https://wcsqafedvjjwtntepmhf.supabase.co/functions/v1/enviar-push \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "body": "Hola desde Alebrijes"}'
```

(Requiere implementar la Edge Function `enviar-push` que use la librería `web-push`.)

## Troubleshooting

| Problema | Solución |
|---|---|
| Botón no aparece | Tu navegador no soporta Web Push (Safari iOS < 16.4) |
| Permiso denegado | Ve a configuración del sitio y cambia permisos |
| No llega la push | Verifica que `NEXT_PUBLIC_VAPID_PUBLIC_KEY` esté bien configurada |
| Error "Bad VAPID key" | Las claves deben ser base64 URL-safe sin padding `=` |
