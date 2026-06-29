# Guía de Operación — Alebrijes Cobranza

> **Para**: administrador del Club Alebrijes Oaxaca
> **Aplicación**: https://alebrijes-cobranza.vercel.app
> **Versión**: 1.0
> **Última actualización**: 2026-06-29

Esta guía explica cómo usar el sistema en el día a día. Si tenés dudas, consultá la sección de [Soporte técnico](#-soporte-técnico) al final.

---

## 🔐 Acceso al dashboard

### URL
```
https://alebrijes-cobranza.vercel.app
```

### Credenciales iniciales (te las enviará el admin técnico por canal seguro)
- **Email**: `admin@alebrijes.com`
- **Contraseña**: `[la que te pasaron, cámbiala después de iniciar sesión]`

### Cambio de contraseña
1. Iniciá sesión en el dashboard
2. Hacé click en tu avatar (esquina superior derecha)
3. Click en "Cerrar sesión"
4. Para cambiar la contraseña, andá a [Supabase Dashboard → Authentication](https://supabase.com/dashboard/project/wcsqafedvjjwtntepmhf/auth/users) (solo el admin técnico tiene acceso)

### Estructura del sidebar
- 📊 **Dashboard** — resumen de KPIs del mes
- 👥 **Clientes** — gestión de clientes
- 📩 **Comprobantes** — validación de pagos
- ❓ **Desconocidos** — números no registrados
- 💬 **Mensajes** — log de WhatsApp enviados
- 📈 **Reportes** — análisis mensual
- ⚙️ **Configuración** — info de pago y plantillas

---

## 1. Cómo agregar un cliente nuevo

> **Cuándo**: cada vez que un nuevo jugador o tutor se inscribe en el club.

### Pasos

1. En el sidebar, click en **Clientes** → **+ Nuevo cliente**
2. Completar el formulario:
   - **Nombre completo** del jugador o tutor (mínimo 2 caracteres)
   - **WhatsApp**: número en formato `52XXXXXXXXXX` (52 de México + 10 dígitos, sin + ni espacios)
     - Ejemplo: `5215512345678` (no `+52 55 1234 5678`)
   - **Día de pago**: 15 o 30 (según el ciclo de cobro que le asignaron)
   - **Monto mensual**: en pesos mexicanos, sin símbolo
   - **Categoría** (opcional): ej. "Sub-15", "Varonil", etc.
   - **Notas** (opcional): cualquier dato relevante
3. Click en **Crear cliente**
4. ✅ El sistema crea el cliente y empieza a enviarle recordatorios automáticamente

### Verificar que se creó
- Volvés a la lista de **Clientes** y debe aparecer al final
- El badge debe ser verde ("Activo")

### Errores comunes
- **"WhatsApp no válido"** → le falta el 52 o tiene caracteres no numéricos
- **"Monto requerido"** → dejaste el campo vacío
- **"Día de pago debe ser 15 o 30"** → pusiste otro número

### Desactivar un cliente (sin eliminarlo)
- En la lista, click en los **3 puntos** del cliente → **Desactivar**
- El cliente NO se borra, solo deja de recibir mensajes automáticos
- Para reactivarlo, click en **3 puntos** → **Reactivar**

---

## 2. Cómo validar un comprobante

> **Cuándo**: un cliente envía su comprobante de pago por WhatsApp.

### Flujo automático
1. El cliente envía una **foto o PDF** del comprobante al número de WhatsApp del club
2. El sistema lo recibe y crea un registro en la bandeja "pendiente"
3. Aparece en el sidebar con un badge rojo: **Comprobantes (N)**

### Pasos para validar

1. En el sidebar, click en **Comprobantes**
2. Verás una tarjeta por cada comprobante pendiente con:
   - 📷 Miniatura del comprobante (imagen o PDF)
   - 👤 Nombre y WhatsApp del cliente
   - 📅 Fecha y hora de recepción
   - 💬 Caption (si el cliente escribió algo)
3. Click en la **miniatura** para ver la imagen completa
4. Click en **Validar** (botón verde)
5. En el diálogo:
   - Seleccioná el **periodo** que corresponde (por defecto: mes actual)
   - Opcional: agregá una **nota** interna (ej. "Pago completo del mes")
6. Click en **Confirmar validación**
7. ✅ El sistema:
   - Registra un **pago** en la DB
   - Marca el comprobante como **validado**
   - Envía un **WhatsApp al cliente** confirmando el pago
   - Borra el archivo del comprobante del storage

### Si el comprobante NO es válido

1. Click en **Rechazar** (botón rojo)
2. En el diálogo, escribí el **motivo del rechazo** (mínimo 1 carácter, máx 500)
   - Ejemplos: "La imagen no es legible", "El monto no coincide", "Pago duplicado"
3. Click en **Sí, rechazar**
4. ✅ El sistema:
   - Marca el comprobante como **rechazado**
   - Envía un **WhatsApp al cliente** con el motivo
   - Borra el archivo del comprobante

### Ver histórico (validados/rechazados)
- En la parte superior de **Comprobantes** hay tabs: **Todos / Pendientes / Validados / Rechazados**
- Hacé click en cada tab para ver el histórico
- Opcional: usá el filtro de **rango de fechas** para buscar por periodo

---

## 3. Cómo cambiar la información de pago

> **Cuándo**: cambia el banco, número de cuenta, CLABE, etc.

### Pasos

1. En el sidebar, click en **Configuración**
2. En la sección **"Información de pago"**, editá el textarea
   - Es un texto libre: incluí banco, CLABE, tarjeta, titular, etc.
3. Click en **Guardar**
4. ✅ Este texto se incluirá automáticamente en los mensajes de "Hoy es tu fecha de pago" y en los de atraso

### Formato recomendado
```
Banco Azteca
CLABE: 1271 8001 3747 4787 85
Tarjeta: 5263 5401 6581 7087
Transferencia a nombre de Club Alebrijes Oaxaca
```

### Cuándo NO requiere cambios
- Cambias el monto de un cliente → se hace en su perfil (no afecta info de pago)
- Editas una plantilla → es otra sección

---

## 4. Cómo editar una plantilla de mensaje

> **Cuándo**: querés cambiar el texto de un recordatorio o el mensaje de pago validado.

### Las 8 plantillas (todas editables)

| Plantilla | Cuándo se envía |
|---|---|
| `recordatorio_-3` | 3 días antes del pago |
| `recordatorio_-1` | 1 día antes del pago |
| `pago_hoy` | El día del pago |
| `atraso_1` | 1 día después |
| `atraso_3` | 3 días después |
| `atraso_7` | 7 días después |
| `pago_validado` | Cuando validas un comprobante |
| `pago_rechazado` | Cuando rechazas un comprobante |

### Pasos

1. En el sidebar, click en **Configuración**
2. En la sección **"Plantillas de mensaje"**, click en la plantilla que querés editar
3. Se expande un editor
4. Editá el texto. Podés usar estas variables:
   - `{{nombre}}` — nombre del cliente
   - `{{monto}}` — monto de la mensualidad
   - `{{dia_pago}}` — día del pago (15 o 30)
   - `{{periodo}}` — periodo (YYYY-MM)
   - `{{categoria}}` — categoría del cliente
   - `{{info_pago}}` — la info de pago (sección anterior)
5. Click en **Guardar**
6. Para volver a activar una plantilla, usá el switch **Activa/Inactiva**

### Ejemplo
Si querés cambiar el "atraso_7" a algo más amigable:
- **Antes**: "Llevas 7 días de atraso..."
- **Después**: "¡Hola {{nombre}}! 😊 Notamos que tu pago de {{periodo}} aún está pendiente..."

⚠️ **Importante**: las plantillas usan sintaxis `{{variable}}` con doble llave. Si las escribís mal, el sistema las ignora silenciosamente.

---

## 5. Procedimiento ante cliente moroso

> **Cuándo**: un cliente tiene días de atraso y querés contactarlo manualmente.

### Flujo automático (ya está activo)
- El sistema **ya envía** mensajes automáticos en:
  - **+1 día**: "Tienes 1 día de atraso..."
  - **+3 días**: "Tienes 3 días de atraso..."
  - **+7 días**: "Tienes 7 días de atraso..."
- Si el cliente paga, los mensajes se cortan automáticamente (porque `pagos` ya está registrado para ese periodo)

### Si querés contactarlo manualmente

1. En el sidebar, click en **Clientes**
2. Buscá al cliente (por nombre o WhatsApp)
3. Click en su nombre para abrir su perfil
4. Verás:
   - Datos del cliente
   - **Historial de pagos**
   - **Mensajes enviados** (timeline con cada WhatsApp)
5. En el header del perfil, hay un botón **WhatsApp** (verde) que abre directamente un chat con el número
6. Opcional: usá el botón **"Registrar pago"** si te confirmó por otro medio (efectivo, transferencia manual, etc.)

### Si querés un mensaje personalizado (avanzado)
- El sistema no permite enviar mensajes personalizados desde el dashboard
- Si necesitás esto, contactá al admin técnico para agregarlo

---

## 6. Cómo ver el log de mensajes

> **Cuándo**: querés ver qué mensajes se enviaron, a quién, cuándo, y si fallaron.

### Pasos

1. En el sidebar, click en **Mensajes**
2. Verás una tabla con todos los mensajes enviados:
   - **Cliente** — nombre
   - **Plantilla** — id de la plantilla usada
   - **Periodo** — mes/año
   - **Offset** — días desde el pago (-3, -1, 0, 1, 3, 7, validado, rechazado)
   - **Estado** — Enviado / Fallido
   - **Fecha** — relativa (hace 2h, hace 1d, etc.)

### Filtros disponibles
- **Cliente**: selector con búsqueda
- **Periodo**: ej. "2026-06"
- **Estado**: Todos / Enviados / Fallidos
- **Rango de fechas**: dos datepickers

### Ver detalles de un mensaje fallido
1. Click en el badge rojo "Fallido"
2. Se expande un `<pre>` con el error completo de Meta

### Casos comunes de fallo
| Error | Significado | Solución |
|---|---|---|
| `(#133010) Account not registered` | El número de WhatsApp no está verificado en Meta | Contactar admin técnico (es el caso actual hasta que se verifique el phone) |
| `Invalid OAuth access token` | El `WHATSAPP_TOKEN` expiró | Admin técnico debe regenerarlo en Meta |
| `Rate limit hit` | Demasiados mensajes enviados en poco tiempo | Esperar 1 hora y reintentar |

---

## 7. Soporte técnico

### Contactos

| Rol | Persona | Canal |
|---|---|---|
| **Admin técnico** (deploy, secrets, Meta API) | `[nombre del admin técnico]` | `[email/teléfono/Slack]` |
| **Soporte urgente** (downtime, pérdida de datos) | `[nombre del admin técnico]` | `[mismo canal]` |
| **Meta for Business** (problemas con WhatsApp API) | — | [facebook.com/business/help](https://www.facebook.com/business/help) |
| **Supabase Support** (problemas de DB o Edge Functions) | — | [supabase.com/dashboard/support](https://supabase.com/dashboard/support) |

### Canales seguros para compartir credenciales
**NUNCA** envíes passwords o tokens por:
- ❌ Email
- ❌ WhatsApp
- ❌ SMS
- ❌ Slack/Discord público
- ❌ GitHub Issues/Comments

**SÍ** podés usar:
- ✅ 1Password / Bitwarden (compartir item, no el texto)
- ✅ Google Password Manager (compartir con familia)
- ✅ Llamada telefónica (en voz, no por texto)
- ✅ Meet面对面 (en persona)

### Procedimiento de escalación
1. **Algo no funciona** → revisá esta guía primero
2. **No encontraste la solución** → contactá al admin técnico con:
   - URL del problema
   - Pasos para reproducir
   - Screenshots del error
3. **Admin técnico no responde en 24h** → escalar a soporte de plataforma (Supabase/Vercel/Meta)

### Reportar un bug
1. Anotá: qué esperabas, qué pasó, cuándo pasó
2. Incluí el `id` del comprobante/cliente/mensaje si aplica
3. Mandá al admin técnico
4. Él abrirá un Issue en GitHub con el detalle

---

## 📋 Checklist semanal (admin)

```markdown
- [ ] Bandeja de comprobantes vacía (todos revisados)
- [ ] Bandeja de desconocidos vacía (todos gestionados)
- [ ] 0 mensajes fallidos en la última semana
- [ ] # de clientes activos coincide con # de jugadores del club
- [ ] Info de pago actualizada si hubo cambios bancarios
```

## 📅 Calendario típico

| Día del mes | Acción |
|---|---|
| **1-5** | Revisar pagos del mes anterior, cerrar cobros pendientes |
| **13-17** | Verificar que se enviaron los recordatorios -3 a clientes con día 15 |
| **14-15** | Día de pago: clientes día 15 (muchos mensajes ese día) |
| **16-18** | Gestionar morosos día 15 (atraso +1, +3) |
| **28-30** | Verificar recordatorios -3 a clientes con día 30 |
| **30-31** | Día de pago: clientes día 30 |
| **1 del mes siguiente** | Gestionar morosos día 30 |

## 🔗 Links útiles

- App: https://alebrijes-cobranza.vercel.app
- Supabase Dashboard: https://supabase.com/dashboard/project/wcsqafedvjjwtntepmhf
- Meta for Business: https://business.facebook.com/wa/manage/phone-numbers/
- Documentación técnica completa: `docs/MONITORING.md`, `docs/ROLLBACK.md` (en el repo)
- Repositorio: https://github.com/alebrijesteotihuacan/AlebrijesCobranza
