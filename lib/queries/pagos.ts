import { getAdminClient } from "@/lib/queries/clientes";

export interface Pago {
  id: string;
  cliente_id: string;
  periodo: string;
  monto: number;
  fecha_pago: string;
  metodo: string | null;
  notas: string | null;
}

export interface MensajeEnviado {
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

export async function getPagosByCliente(clienteId: string, limit = 50): Promise<Pago[]> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("pagos")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("fecha_pago", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getPagosByCliente error", error);
    return [];
  }
  return (data ?? []) as Pago[];
}

export async function getMensajesByCliente(clienteId: string, limit = 50): Promise<MensajeEnviado[]> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("mensajes_enviados")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("enviado_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getMensajesByCliente error", error);
    return [];
  }
  return (data ?? []) as MensajeEnviado[];
}
