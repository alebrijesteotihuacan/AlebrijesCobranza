// =============================================================
// Edge Function: whatsapp-webhook
// Receives incoming WhatsApp messages from Meta Cloud API.
// - GET  : webhook verification (returns hub.challenge if token matches)
// - POST : incoming messages; downloads media, stores it, creates comprobante
// =============================================================

// @ts-ignore — Deno-specific import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// @ts-ignore — Deno-specific import
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// ---------- Env ----------
const WHATSAPP_TOKEN       = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_PHONE_ID    = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const WHATSAPP_APP_SECRET  = Deno.env.get("WHATSAPP_APP_SECRET")!;
const WHATSAPP_VERIFY_TOK  = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN")!;
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID || !WHATSAPP_APP_SECRET ||
    !WHATSAPP_VERIFY_TOK || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing required env vars");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------- Helpers ----------
const encoder = new TextEncoder();

async function hmacSha256(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function verifySignature(req: Request, rawBody: string): Promise<boolean> {
  const header = req.headers.get("X-Hub-Signature-256") || "";
  if (!header.startsWith("sha256=")) return false;
  const expected = await hmacSha256(WHATSAPP_APP_SECRET, rawBody);
  return safeEqual(header.slice(7), expected);
}

function extensionFromMime(mime: string | undefined | null): string {
  if (!mime) return "bin";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("video")) return "mp4";
  if (mime.includes("audio/ogg") || mime.includes("ogg")) return "ogg";
  if (mime.includes("audio")) return "m4a";
  return "bin";
}

async function downloadMedia(mediaId: string): Promise<{ blob: Blob; mime: string } | null> {
  try {
    // Step 1: get media URL
    const metaRes = await fetch(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } },
    );
    if (!metaRes.ok) {
      console.error("Media metadata fetch failed", metaRes.status, await metaRes.text());
      return null;
    }
    const meta = await metaRes.json() as { url?: string; mime_type?: string };
    if (!meta.url) return null;

    // Step 2: download binary
    const binRes = await fetch(meta.url, {
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
    });
    if (!binRes.ok) {
      console.error("Media binary fetch failed", binRes.status);
      return null;
    }
    const blob = await binRes.blob();
    return { blob, mime: meta.mime_type || blob.type || "application/octet-stream" };
  } catch (e) {
    console.error("downloadMedia error", e);
    return null;
  }
}

async function uploadToStorage(
  clienteId: string | null,
  messageId: string,
  ext: string,
  blob: Blob,
): Promise<string | null> {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const folder = clienteId ?? "unknown";
  const path = `comprobantes/${folder}/${yyyy}/${mm}/${messageId}.${ext}`;
  const { error } = await supabase.storage
    .from("comprobantes")
    .upload(path, blob, { contentType: blob.type, upsert: false });
  if (error) {
    console.error("Storage upload error", error);
    return null;
  }
  return path;
}

async function findClienteByWhatsapp(whatsapp: string) {
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, whatsapp, dia_pago, monto, activo")
    .eq("whatsapp", whatsapp)
    .eq("activo", true)
    .maybeSingle();
  if (error) {
    console.error("findCliente error", error);
    return null;
  }
  return data;
}

async function insertComprobante(args: {
  clienteId: string | null;
  from: string;
  messageId: string;
  type: string;
  texto: string | null;
  storagePath: string | null;
  mimeType: string | null;
}) {
  const row = {
    cliente_id: args.clienteId,
    whatsapp_from: args.from,
    whatsapp_message_id: args.messageId,
    tipo: args.type,
    texto: args.texto,
    storage_path: args.storagePath,
    mime_type: args.mimeType,
    estado: "pendiente",
  };
  const { error } = await supabase
    .from("comprobantes_recibidos")
    .upsert(row, { onConflict: "whatsapp_message_id", ignoreDuplicates: true });
  if (error) console.error("insert comprobante error", error);
}

async function insertDesconocido(args: {
  from: string;
  messageId: string;
  type: string;
  texto: string | null;
}) {
  const { error } = await supabase
    .from("mensajes_desconocidos")
    .upsert(
      {
        whatsapp_from: args.from,
        whatsapp_message_id: args.messageId,
        tipo: args.type,
        texto: args.texto,
      },
      { onConflict: "whatsapp_message_id", ignoreDuplicates: true },
    );
  if (error) console.error("insert desconocido error", error);
}

async function processMessage(msg: Record<string, unknown>, phoneId: string) {
  const from      = String(msg.from ?? "");
  const messageId = String(msg.id ?? "");
  const type      = String(msg.type ?? "unknown");

  if (!from || !messageId) {
    console.warn("Missing from or id, skipping", msg);
    return;
  }

  // Only process messages for our configured phone number
  if (phoneId && phoneId !== WHATSAPP_PHONE_ID) {
    console.log("Ignoring message from unrelated phone_id", phoneId);
    return;
  }

  let texto: string | null = null;
  let mediaId: string | null = null;
  let mimeType: string | null = null;

  switch (type) {
    case "text": {
      const t = msg.text as { body?: string } | undefined;
      texto = t?.body ?? null;
      break;
    }
    case "image": {
      const im = msg.image as { id?: string; mime_type?: string; caption?: string } | undefined;
      mediaId = im?.id ?? null;
      mimeType = im?.mime_type ?? null;
      texto = im?.caption ?? null;
      break;
    }
    case "document": {
      const d = msg.document as { id?: string; mime_type?: string; caption?: string; filename?: string } | undefined;
      mediaId = d?.id ?? null;
      mimeType = d?.mime_type ?? null;
      texto = d?.caption ?? d?.filename ?? null;
      break;
    }
    case "audio":
    case "video":
    case "sticker": {
      const m = msg[type] as { id?: string; mime_type?: string } | undefined;
      mediaId = m?.id ?? null;
      mimeType = m?.mime_type ?? null;
      break;
    }
    default:
      console.log("Unhandled type", type, msg);
  }

  // Find client
  const cliente = await findClienteByWhatsapp(from);

  // Download and store media if any
  let storagePath: string | null = null;
  if (mediaId) {
    const media = await downloadMedia(mediaId);
    if (media) {
      const ext = extensionFromMime(media.mime || mimeType);
      storagePath = await uploadToStorage(
        cliente?.id ?? null,
        messageId,
        ext,
        media.blob,
      );
      if (!mimeType) mimeType = media.mime;
    }
  }

  if (cliente) {
    await insertComprobante({
      clienteId: cliente.id,
      from,
      messageId,
      type,
      texto,
      storagePath,
      mimeType,
    });
    console.log(`Comprobante queued: cliente=${cliente.id} msg=${messageId} type=${type}`);
  } else {
    await insertDesconocido({ from, messageId, type, texto });
    console.log(`Unknown number: from=${from} type=${type}`);
  }
}

// ---------- HTTP handlers ----------
async function handleGet(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const mode      = url.searchParams.get("hub.mode");
  const token     = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === WHATSAPP_VERIFY_TOK) {
    console.log("Webhook verified");
    return new Response(challenge ?? "", { status: 200 });
  }
  console.warn("Webhook verification failed", { mode, hasToken: !!token });
  return new Response("Forbidden", { status: 403 });
}

async function handlePost(req: Request): Promise<Response> {
  // Read raw body once (needed for signature validation)
  const rawBody = await req.text();
  const isValid = await verifySignature(req, rawBody);
  if (!isValid) {
    console.warn("Invalid signature");
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: { entry?: Array<{ changes?: Array<{ value?: { messages?: unknown[]; metadata?: { phone_number_id?: string } } } }> };
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    console.error("Invalid JSON", e);
    return new Response("Bad Request", { status: 400 });
  }

  // Respond fast (Meta retries if >5s). Process in background.
  // For simplicity we await; messages are usually small.
  const entries = payload.entry ?? [];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      const messages = (value.messages ?? []) as Array<Record<string, unknown>>;
      const phoneId = value.metadata?.phone_number_id ?? "";
      for (const msg of messages) {
        try {
          await processMessage(msg, phoneId);
        } catch (e) {
          console.error("processMessage error", e, msg);
        }
      }
    }
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  const url = new URL(req.url);
  if (req.method === "GET")  return await handleGet(req);
  if (req.method === "POST") return await handlePost(req);
  return new Response("Method Not Allowed", { status: 405 });
});
