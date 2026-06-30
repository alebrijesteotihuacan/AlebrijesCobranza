// =============================================================
// Edge Function: enviar-mensaje
// Generic WhatsApp message sender.
// Body: { cliente_id: string, plantilla_id: string, variables?: Record<string,string|number> }
// Renders plantilla from DB, sends via Meta Cloud API, logs to mensajes_enviados.
// =============================================================

// @ts-expect-error — Deno-specific import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// @ts-expect-error — Deno-specific import
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// ---------- Env ----------
const WHATSAPP_TOKEN    = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const META_API_VERSION  = "v19.0";
const META_BASE_URL     = `https://graph.facebook.com/${META_API_VERSION}`;

if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID || !SUPABASE_URL || !SUPABASE_SERVICE) {
  console.error("Missing required env vars");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------- Types ----------
interface Body {
  cliente_id: string;
  plantilla_id: string;
  variables?: Record<string, string | number>;
  periodo?: string; // 'YYYY-MM' (used for logging dedupe)
  offset_dias?: number;
}

interface Plantilla {
  id: string;
  offset_dias: number;
  plantilla: string;
  activo: boolean;
}

interface Cliente {
  id: string;
  nombre: string;
  whatsapp: string;
  dia_pago: number;
  monto: number;
  categoria: string | null;
  notas: string | null;
  activo: boolean;
}

// ---------- Render template ----------
function renderTemplate(
  template: string,
  ctx: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const v = ctx[key];
    if (v === null || v === undefined) return `{{${key}}}`;
    return String(v);
  });
}

// ---------- Get current periodo in America/Mexico_City ----------
function getCurrentPeriodo(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${y}-${m}`;
}

function isValidUuid(s: unknown): s is string {
  return typeof s === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

// ---------- Send via Meta API ----------
async function sendToWhatsApp(to: string, body: string): Promise<{ ok: boolean; message_id?: string; error?: string }> {
  const url = `${META_BASE_URL}/${WHATSAPP_PHONE_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body, preview_url: false },
    }),
  });
  const json = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok) {
    const errMsg = (json as { error?: { message?: string; code?: number } }).error?.message
      ?? `HTTP ${res.status}`;
    return { ok: false, error: errMsg };
  }
  const messageId = (json as { messages?: Array<{ id?: string }> }).messages?.[0]?.id;
  return { ok: true, message_id: messageId };
}

// ---------- Query message status via Meta API ----------
async function getMessageStatus(wamid: string): Promise<{ status: string; raw: unknown }> {
  const url = `${META_BASE_URL}/${wamid}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
    },
  });
  const json = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok) {
    return { status: `error: HTTP ${res.status}`, raw: json };
  }
  // Meta returns conversation + pricing; delivery status is under messaging_status or status field
  const status = (json as { status?: string; messaging_status?: string }).status
    ?? (json as { messages?: Array<{ status?: string }> }).messages?.[0]?.status
    ?? "unknown";
  return { status, raw: json };
}

async function logMensaje(args: {
  clienteId: string;
  periodo: string;
  offsetDias: number;
  plantillaId: string;
  messageId: string | null;
  estado: "enviado" | "fallido";
  error: string | null;
}) {
  const { error } = await supabase
    .from("mensajes_enviados")
    .upsert(
      {
        cliente_id: args.clienteId,
        periodo: args.periodo,
        offset_dias: args.offsetDias,
        plantilla_id: args.plantillaId,
        whatsapp_message_id: args.messageId,
        estado: args.estado,
        error: args.error,
      },
      { onConflict: "cliente_id,periodo,offset_dias" },
    );
  if (error) console.error("logMensaje error", error);
}

// ---------- Main ----------
async function handle(req: Request): Promise<Response> {
  // GET: query message or phone status
  if (req.method === "GET") {
    const url = new URL(req.url);
    const wamid = url.searchParams.get("wamid");
    const phoneStats = url.searchParams.get("phone_stats");

    // Phone number quality rating
    if (phoneStats === "1") {
      const metaUrl = `${META_BASE_URL}/${WHATSAPP_PHONE_ID}?fields=id,display_phone_number,verified_name,quality_rating,account_mode,status,code_verification_status,health_status`;
      const res = await fetch(metaUrl, {
        headers: { "Authorization": `Bearer ${WHATSAPP_TOKEN}` },
      });
      const json = await res.json().catch(() => ({}));
      return jsonResponse({ ok: res.ok, phone: json }, res.status);
    }

    if (!wamid) {
      return jsonResponse({ ok: false, error: "Missing ?wamid= or ?phone_stats=1 parameter" }, 400);
    }
    const result = await getMessageStatus(wamid);
    return jsonResponse({ ok: true, wamid, ...result }, 200);
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON" }, 400);
  }

  if (!isValidUuid(body.cliente_id)) {
    return jsonResponse({ ok: false, error: "cliente_id must be a UUID" }, 400);
  }
  if (!body.plantilla_id || typeof body.plantilla_id !== "string") {
    return jsonResponse({ ok: false, error: "plantilla_id is required" }, 400);
  }

  // 1) Load plantilla
  const { data: plantilla, error: pErr } = await supabase
    .from("plantillas")
    .select("id, offset_dias, plantilla, activo")
    .eq("id", body.plantilla_id)
    .maybeSingle<Plantilla>();

  if (pErr) {
    console.error("plantilla load error", pErr);
    return jsonResponse({ ok: false, error: "Error loading plantilla" }, 500);
  }
  if (!plantilla) {
    return jsonResponse({ ok: false, error: `Plantilla '${body.plantilla_id}' not found` }, 404);
  }
  if (!plantilla.activo) {
    return jsonResponse({ ok: false, error: `Plantilla '${plantilla.id}' is inactive` }, 400);
  }

  // 2) Load cliente
  const { data: cliente, error: cErr } = await supabase
    .from("clientes")
    .select("id, nombre, whatsapp, dia_pago, monto, categoria, notas, activo")
    .eq("id", body.cliente_id)
    .maybeSingle<Cliente>();

  if (cErr) {
    console.error("cliente load error", cErr);
    return jsonResponse({ ok: false, error: "Error loading cliente" }, 500);
  }
  if (!cliente) {
    return jsonResponse({ ok: false, error: `Cliente '${body.cliente_id}' not found` }, 404);
  }
  if (!cliente.activo) {
    return jsonResponse({ ok: false, error: `Cliente '${cliente.nombre}' is inactive` }, 400);
  }

  // 3) Build context for template rendering
  const periodo = body.periodo ?? getCurrentPeriodo();
  const offset = typeof body.offset_dias === "number"
    ? body.offset_dias
    : plantilla.offset_dias;

  const infoPago = Deno.env.get("NEXT_PUBLIC_PAYMENT_INFO") ?? "Banco Azteca · CLABE 1271 8001 3747 4787 85 · Tarjeta 5263 5401 6581 7087";

  const ctx: Record<string, string | number | null> = {
    nombre: cliente.nombre,
    whatsapp: cliente.whatsapp,
    dia_pago: cliente.dia_pago,
    monto: cliente.monto,
    categoria: cliente.categoria,
    periodo,
    info_pago: infoPago,
    ...(body.variables ?? {}),
  };
  const rendered = renderTemplate(plantilla.plantilla, ctx);

  // 4) Send
  const result = await sendToWhatsApp(cliente.whatsapp, rendered);

  // 5) Log
  await logMensaje({
    clienteId: cliente.id,
    periodo,
    offsetDias: offset,
    plantillaId: plantilla.id,
    messageId: result.message_id ?? null,
    estado: result.ok ? "enviado" : "fallido",
    error: result.error ?? null,
  });

  // 6) Return
  return jsonResponse({
    ok: result.ok,
    message_id: result.message_id ?? null,
    error: result.error ?? null,
    rendered_preview: rendered,
    cliente: { id: cliente.id, nombre: cliente.nombre, whatsapp: cliente.whatsapp },
    plantilla: { id: plantilla.id, offset_dias: plantilla.offset_dias },
    periodo,
  }, result.ok ? 200 : 502);
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => await handle(req));
