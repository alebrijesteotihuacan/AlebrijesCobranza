import { getAdminClient, type Cliente } from "@/lib/queries/clientes";

export interface MensajeEnviadoLog {
  id: string;
  cliente_id: string;
  periodo: string;
  offset_dias: number;
  plantilla_id: string | null;
  whatsapp_message_id: string | null;
  estado: "enviado" | "fallido";
  error: string | null;
  enviado_at: string;
}

export interface MensajeEnviadoWithRelations extends MensajeEnviadoLog {
  cliente: Pick<Cliente, "id" | "nombre" | "whatsapp" | "activo"> | null;
}

export interface MensajesFiltros {
  clienteId?: string;
  periodo?: string;
  estado?: "enviado" | "fallido";
  from?: string;
  to?: string;
}

export async function getMensajesEnviados(
  filtros: MensajesFiltros = {},
  opts: { limit?: number; offset?: number } = {},
): Promise<MensajeEnviadoWithRelations[]> {
  const { limit = 25, offset = 0 } = opts;
  const admin = getAdminClient();
  let q = admin
    .from("mensajes_enviados")
    .select("*")
    .order("enviado_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (filtros.clienteId) q = q.eq("cliente_id", filtros.clienteId);
  if (filtros.periodo) q = q.eq("periodo", filtros.periodo);
  if (filtros.estado) q = q.eq("estado", filtros.estado);
  if (filtros.from) q = q.gte("enviado_at", filtros.from);
  if (filtros.to) q = q.lte("enviado_at", filtros.to);
  const { data, error } = await q;
  if (error) {
    console.error("getMensajesEnviados error", error);
    return [];
  }
  const rows = (data ?? []) as MensajeEnviadoLog[];

  // Hydrate cliente
  const clienteIds = Array.from(new Set(rows.map((r) => r.cliente_id)));
  const { data: clientesData } = clienteIds.length > 0
    ? await admin
        .from("clientes")
        .select("id, nombre, whatsapp, activo")
        .in("id", clienteIds)
    : { data: [] as Array<Pick<Cliente, "id" | "nombre" | "whatsapp" | "activo">> };
  const clienteById = new Map((clientesData ?? []).map((c) => [c.id, c]));

  return rows.map((r) => ({
    ...r,
    cliente: clienteById.get(r.cliente_id) ?? null,
  }));
}

export async function countMensajesEnviados(
  filtros: MensajesFiltros = {},
): Promise<number> {
  const admin = getAdminClient();
  let q = admin
    .from("mensajes_enviados")
    .select("id", { count: "exact", head: true });
  if (filtros.clienteId) q = q.eq("cliente_id", filtros.clienteId);
  if (filtros.periodo) q = q.eq("periodo", filtros.periodo);
  if (filtros.estado) q = q.eq("estado", filtros.estado);
  if (filtros.from) q = q.gte("enviado_at", filtros.from);
  if (filtros.to) q = q.lte("enviado_at", filtros.to);
  const { count, error } = await q;
  if (error) {
    console.error("countMensajesEnviados error", error);
    return 0;
  }
  return count ?? 0;
}

export interface MensajesKpis {
  total: number;
  enviados: number;
  fallidos: number;
  ult24h: number;
}

export async function getMensajesKpis(): Promise<MensajesKpis> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("mensajes_enviados")
    .select("estado, enviado_at");
  if (error || !data) {
    return { total: 0, enviados: 0, fallidos: 0, ult24h: 0 };
  }
  const now = Date.now();
  const d24 = 24 * 60 * 60 * 1000;
  let enviados = 0, fallidos = 0, ult24h = 0;
  for (const r of data) {
    if (r.estado === "enviado") enviados++;
    else if (r.estado === "fallido") fallidos++;
    if (now - new Date(r.enviado_at).getTime() <= d24) ult24h++;
  }
  return { total: data.length, enviados, fallidos, ult24h };
}

export async function getPeriodosFromMensajes(limit = 12): Promise<string[]> {
  const admin = getAdminClient();
  const { data } = await admin
    .from("mensajes_enviados")
    .select("periodo")
    .order("periodo", { ascending: false })
    .limit(200);
  if (!data) return [];
  const set = new Set<string>();
  for (const r of data) set.add(r.periodo);
  return Array.from(set).slice(0, limit);
}
