// =============================================================
// Edge Function: enviar-recordatorios
// Daily cron job (9:00 AM America/Mexico_City).
// For each active client, calculate the next payment date in Mexico TZ,
// compute the offset, and send a message if the offset is in {-3, -1, 0, 1, 3, 7}.
// Skips if already sent, if already paid, or if a comprobante is validated.
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
const CRON_SECRET       = Deno.env.get("CRON_SECRET") ?? "alebrijes_cron_secret_change_me";
const META_API_VERSION  = "v19.0";
const META_BASE_URL     = `https://graph.facebook.com/${META_API_VERSION}`;
const INFO_PAGO         = Deno.env.get("NEXT_PUBLIC_PAYMENT_INFO")
                       ?? "Banco Azteca · CLABE 1271 8001 3747 4787 85 · Tarjeta 5263 5401 6581 7087";

if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID || !SUPABASE_URL || !SUPABASE_SERVICE) {
  console.error("Missing required env vars");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Offsets at which we send messages
const REMINDER_OFFSETS = [-3, -1, 0, 1, 3, 7] as const;
const OFFSET_TO_PLANTILLA: Record<number, string> = {
  [-3]: "recordatorio_-3",
  [-1]: "recordatorio_-1",
  [0]:  "pago_hoy",
  [1]:  "atraso_1",
  [3]:  "atraso_3",
  [7]:  "atraso_7",
};

// ---------- Date helpers (all in America/Mexico_City) ----------
const MX_TZ = "America/Mexico_City";

interface YMD { y: number; m: number; d: number }

function todayInMexico(): YMD {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MX_TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

function lastDayOfMonth(year: number, month1to12: number): number {
  // month1to12: 1..12
  return new Date(year, month1to12, 0).getDate();
}

function proximaFechaPago(diaPago: number, hoy: YMD): YMD {
  // Try current month first
  const lastCur = lastDayOfMonth(hoy.y, hoy.m);
  const targetCur = Math.min(diaPago, lastCur);
  const candidateTs = new Date(Date.UTC(hoy.y, hoy.m - 1, targetCur)).getTime();
  const hoyTs      = new Date(Date.UTC(hoy.y, hoy.m - 1, hoy.d)).getTime();
  if (candidateTs >= hoyTs) {
    return { y: hoy.y, m: hoy.m, d: targetCur };
  }
  // Else, next month
  const nextM = hoy.m === 12 ? 1 : hoy.m + 1;
  const nextY = hoy.m === 12 ? hoy.y + 1 : hoy.y;
  const lastNext = lastDayOfMonth(nextY, nextM);
  const targetNext = Math.min(diaPago, lastNext);
  return { y: nextY, m: nextM, d: targetNext };
}

function offsetDias(proxima: YMD, hoy: YMD): number {
  const a = Date.UTC(proxima.y, proxima.m - 1, proxima.d);
  const b = Date.UTC(hoy.y, hoy.m - 1, hoy.d);
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

function periodoOf(date: YMD): string {
  return `${date.y}-${String(date.m).padStart(2, "0")}`;
}

function ymdEquals(a: YMD, b: YMD): boolean {
  return a.y === b.y && a.m === b.m && a.d === b.d;
}

// ---------- Render template ----------
function render(template: string, ctx: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const v = ctx[key];
    return v === null || v === undefined ? `{{${key}}}` : String(v);
  });
}

// ---------- Meta API send ----------
async function sendToWhatsApp(to: string, body: string): Promise<{ ok: boolean; message_id?: string; error?: string }> {
  const res = await fetch(`${META_BASE_URL}/${WHATSAPP_PHONE_ID}/messages`, {
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
    const err = (json as { error?: { message?: string } }).error?.message ?? `HTTP ${res.status}`;
    return { ok: false, error: err };
  }
  const mid = (json as { messages?: Array<{ id?: string }> }).messages?.[0]?.id;
  return { ok: true, message_id: mid };
}

// ---------- Skip checks ----------
async function isAlreadySent(clienteId: string, periodo: string, offset: number): Promise<boolean> {
  const { data, error } = await supabase
    .from("mensajes_enviados")
    .select("id")
    .eq("cliente_id", clienteId)
    .eq("periodo", periodo)
    .eq("offset_dias", offset)
    .limit(1);
  if (error) {
    console.error("isAlreadySent error", error);
    return false; // fail-open: try to send anyway
  }
  return (data?.length ?? 0) > 0;
}

async function isAlreadyPaid(clienteId: string, periodo: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("pagos")
    .select("id")
    .eq("cliente_id", clienteId)
    .eq("periodo", periodo)
    .limit(1);
  if (error) {
    console.error("isAlreadyPaid error", error);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

async function isComprobanteValidado(clienteId: string, periodo: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("comprobantes_recibidos")
    .select("id")
    .eq("cliente_id", clienteId)
    .eq("periodo_asignado", periodo)
    .eq("estado", "validado")
    .limit(1);
  if (error) {
    console.error("isComprobanteValidado error", error);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

// ---------- Main per-client ----------
interface Cliente {
  id: string;
  nombre: string;
  whatsapp: string;
  dia_pago: number;
  monto: number;
  categoria: string | null;
  activo: boolean;
}

async function processCliente(
  c: Cliente,
  hoy: YMD,
  plantillasByOffset: Map<number, { id: string; plantilla: string }>,
): Promise<{ action: "sent" | "skipped" | "failed"; offset?: number; error?: string }> {
  const proxima = proximaFechaPago(c.dia_pago, hoy);
  const offset  = offsetDias(proxima, hoy);
  const periodo = periodoOf(proxima);

  if (!REMINDER_OFFSETS.includes(offset as typeof REMINDER_OFFSETS[number])) {
    return { action: "skipped" };
  }

  // Skip checks
  if (await isAlreadySent(c.id, periodo, offset)) {
    console.log(`skip already-sent cliente=${c.id} offset=${offset} periodo=${periodo}`);
    return { action: "skipped" };
  }
  if (await isAlreadyPaid(c.id, periodo)) {
    console.log(`skip paid cliente=${c.id} periodo=${periodo}`);
    return { action: "skipped" };
  }
  if (await isComprobanteValidado(c.id, periodo)) {
    console.log(`skip comprobante-validado cliente=${c.id} periodo=${periodo}`);
    return { action: "skipped" };
  }

  const plantillaRow = plantillasByOffset.get(offset);
  if (!plantillaRow) {
    console.error(`no plantilla for offset ${offset}`);
    return { action: "failed", error: `no plantilla for offset ${offset}` };
  }

  const ctx: Record<string, string | number | null> = {
    nombre: c.nombre,
    whatsapp: c.whatsapp,
    dia_pago: c.dia_pago,
    monto: c.monto,
    categoria: c.categoria,
    periodo,
    info_pago: INFO_PAGO,
  };
  const body = render(plantillaRow.plantilla, ctx);

  const send = await sendToWhatsApp(c.whatsapp, body);

  // Log result
  const { error: logErr } = await supabase
    .from("mensajes_enviados")
    .upsert(
      {
        cliente_id: c.id,
        periodo,
        offset_dias: offset,
        plantilla_id: plantillaRow.id,
        whatsapp_message_id: send.message_id ?? null,
        estado: send.ok ? "enviado" : "fallido",
        error: send.error ?? null,
      },
      { onConflict: "cliente_id,periodo,offset_dias" },
    );
  if (logErr) console.error("log error", logErr);

  if (send.ok) {
    console.log(`sent cliente=${c.id} offset=${offset} periodo=${periodo}`);
    return { action: "sent", offset };
  }
  return { action: "failed", offset, error: send.error };
}

// ---------- HTTP entrypoint ----------
async function handle(req: Request): Promise<Response> {
  // Allow both scheduled calls (with X-Cron-Secret) and manual invocations (for testing)
  if (req.method === "POST" || req.method === "GET") {
    const headerSecret = req.headers.get("X-Cron-Secret");
    const querySecret   = new URL(req.url).searchParams.get("secret");
    const provided      = headerSecret ?? querySecret;
    if (provided !== CRON_SECRET) {
      console.warn("Forbidden: bad cron secret");
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
        status: 403, headers: { "Content-Type": "application/json" },
      });
    }
  } else {
    return new Response("Method Not Allowed", { status: 405 });
  }

  console.log("enviar-recordatorios started at", new Date().toISOString());

  // Load all active clientes
  const { data: clientes, error: cErr } = await supabase
    .from("clientes")
    .select("id, nombre, whatsapp, dia_pago, monto, categoria, activo")
    .eq("activo", true);

  if (cErr) {
    console.error("clientes load error", cErr);
    return new Response(JSON.stringify({ ok: false, error: "Error loading clientes" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  // Load plantillas cache
  const { data: plantillas, error: pErr } = await supabase
    .from("plantillas")
    .select("id, offset_dias, plantilla, activo")
    .eq("activo", true);
  if (pErr) {
    console.error("plantillas load error", pErr);
    return new Response(JSON.stringify({ ok: false, error: "Error loading plantillas" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
  const plantillasByOffset = new Map<number, { id: string; plantilla: string }>();
  for (const p of plantillas ?? []) {
    plantillasByOffset.set(p.offset_dias, { id: p.id, plantilla: p.plantilla });
  }

  const hoy = todayInMexico();
  const result = { ok: true, total: clientes?.length ?? 0, enviados: 0, omitidos: 0, fallidos: 0, detalles: [] as unknown[] };

  for (const c of clientes ?? []) {
    try {
      const r = await processCliente(c as Cliente, hoy, plantillasByOffset);
      if (r.action === "sent")   result.enviados++;
      if (r.action === "skipped") result.omitidos++;
      if (r.action === "failed") { result.fallidos++; result.detalles.push({ cliente: c.nombre, error: r.error }); }
    } catch (e) {
      console.error("processCliente error", e, c.id);
      result.fallidos++;
      result.detalles.push({ cliente: c.nombre, error: String(e) });
    }
  }

  console.log("enviar-recordatorios finished", result);
  return new Response(JSON.stringify(result, null, 2), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => await handle(req));
