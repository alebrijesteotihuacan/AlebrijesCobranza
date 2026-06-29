import { getAdminClient, type Cliente } from "@/lib/queries/clientes";
import { getCurrentPeriodo } from "@/lib/utils";

export type ComprobanteEstado = "pendiente" | "validado" | "rechazado";
export type ComprobanteTipo = "image" | "document" | "text" | "audio" | "video";

export interface Comprobante {
  id: string;
  cliente_id: string | null;
  whatsapp_from: string;
  whatsapp_message_id: string | null;
  tipo: ComprobanteTipo;
  texto: string | null;
  storage_path: string | null;
  mime_type: string | null;
  estado: ComprobanteEstado;
  periodo_asignado: string | null;
  notas_admin: string | null;
  recibido_at: string;
  validado_at: string | null;
  validado_por: string | null;
}

export interface ComprobanteWithRelations extends Comprobante {
  cliente: Pick<Cliente, "id" | "nombre" | "whatsapp" | "dia_pago" | "monto" | "activo"> | null;
  signedUrl: string | null;
  signedUrlExpiresAt: number | null;
}

async function attachSignedUrl(c: Comprobante, expiresIn = 900): Promise<ComprobanteWithRelations> {
  if (!c.storage_path) {
    return { ...c, cliente: null, signedUrl: null, signedUrlExpiresAt: null };
  }
  const admin = getAdminClient();
  const { data, error } = await admin.storage
    .from("comprobantes")
    .createSignedUrl(c.storage_path, expiresIn);
  if (error) {
    console.error("createSignedUrl error", error);
    return { ...c, cliente: null, signedUrl: null, signedUrlExpiresAt: null };
  }
  return {
    ...c,
    cliente: null, // populated separately when cliente_id is known
    signedUrl: data.signedUrl,
    signedUrlExpiresAt: Date.now() + expiresIn * 1000,
  };
}

export async function getComprobantesByEstado(
  estado: ComprobanteEstado | "todos" = "pendiente",
  opts: { limit?: number; from?: string; to?: string } = {},
): Promise<ComprobanteWithRelations[]> {
  const { limit = 100, from, to } = opts;
  const admin = getAdminClient();
  let q = admin
    .from("comprobantes_recibidos")
    .select("*")
    .order("recibido_at", { ascending: false })
    .limit(limit);
  if (estado !== "todos") q = q.eq("estado", estado);
  if (from) q = q.gte("recibido_at", from);
  if (to) q = q.lte("recibido_at", to);
  const { data, error } = await q;
  if (error) {
    console.error("getComprobantesByEstado error", error);
    return [];
  }
  const rows = (data ?? []) as Comprobante[];

  // Hydrate cliente and signed URLs in parallel
  const clienteIds = Array.from(new Set(rows.map((r) => r.cliente_id).filter(Boolean) as string[]));
  const { data: clientesData } = clienteIds.length > 0
    ? await admin
        .from("clientes")
        .select("id, nombre, whatsapp, dia_pago, monto, activo")
        .in("id", clienteIds)
    : { data: [] as Array<Pick<Cliente, "id" | "nombre" | "whatsapp" | "dia_pago" | "monto" | "activo">> };
  const clienteById = new Map((clientesData ?? []).map((c) => [c.id, c]));

  const withExtras: ComprobanteWithRelations[] = await Promise.all(
    rows.map(async (r) => {
      const base = await attachSignedUrl(r);
      return {
        ...base,
        cliente: r.cliente_id ? clienteById.get(r.cliente_id) ?? null : null,
      };
    }),
  );
  return withExtras;
}

export async function getComprobanteById(id: string): Promise<ComprobanteWithRelations | null> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("comprobantes_recibidos")
    .select("*")
    .eq("id", id)
    .maybeSingle<Comprobante>();
  if (error || !data) {
    return null;
  }
  const withUrl = await attachSignedUrl(data);
  if (data.cliente_id) {
    const { data: cliente } = await admin
      .from("clientes")
      .select("id, nombre, whatsapp, dia_pago, monto, activo")
      .eq("id", data.cliente_id)
      .maybeSingle<Pick<Cliente, "id" | "nombre" | "whatsapp" | "dia_pago" | "monto" | "activo">>();
    withUrl.cliente = cliente ?? null;
  }
  return withUrl;
}

export interface ComprobantesKpis {
  pendientes: number;
  validados: number;
  rechazados: number;
  total: number;
}

export async function getComprobantesKpis(): Promise<ComprobantesKpis> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("comprobantes_recibidos")
    .select("estado");
  if (error || !data) {
    return { pendientes: 0, validados: 0, rechazados: 0, total: 0 };
  }
  const counts = { pendientes: 0, validados: 0, rechazados: 0, total: data.length };
  for (const row of data) {
    if (row.estado === "pendiente") counts.pendientes++;
    else if (row.estado === "validado") counts.validados++;
    else if (row.estado === "rechazado") counts.rechazados++;
  }
  return counts;
}

export async function getComprobantesPeriodoOptions(limit = 6): Promise<string[]> {
  const now = new Date();
  const opts: string[] = [];
  for (let i = -3; i < limit; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    opts.push(value);
  }
  return opts;
}

export { getCurrentPeriodo };
