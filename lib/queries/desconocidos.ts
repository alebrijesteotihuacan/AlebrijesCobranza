import { getAdminClient } from "@/lib/queries/clientes";

export interface MensajeDesconocido {
  id: string;
  whatsapp_from: string;
  texto: string | null;
  tipo: string | null;
  whatsapp_message_id: string | null;
  recibido_at: string;
}

export async function getMensajesDesconocidos(limit = 100): Promise<MensajeDesconocido[]> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("mensajes_desconocidos")
    .select("*")
    .order("recibido_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getMensajesDesconocidos error", error);
    return [];
  }
  return (data ?? []) as MensajeDesconocido[];
}

export interface DesconocidosKpis {
  total: number;
  ult24h: number;
  ult7d: number;
}

export async function getDesconocidosKpis(): Promise<DesconocidosKpis> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("mensajes_desconocidos")
    .select("recibido_at");
  if (error || !data) {
    return { total: 0, ult24h: 0, ult7d: 0 };
  }
  const now = Date.now();
  const d24 = 24 * 60 * 60 * 1000;
  const d7 = 7 * d24;
  let ult24h = 0, ult7d = 0;
  for (const r of data) {
    const t = new Date(r.recibido_at).getTime();
    if (now - t <= d24) ult24h++;
    if (now - t <= d7) ult7d++;
  }
  return { total: data.length, ult24h, ult7d };
}
