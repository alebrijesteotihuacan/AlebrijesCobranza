"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/queries/clientes";
import { createClient as createAdminSB } from "@supabase/supabase-js";
import { getCurrentPeriodo } from "@/lib/queries/comprobantes";

export interface AccionResult {
  ok: boolean;
  error?: string;
  messageId?: string;
}

interface ValidarInput {
  comprobanteId: string;
  periodo: string;
  notas?: string;
}

interface RechazarInput {
  comprobanteId: string;
  motivo: string;
}

function getServiceRoleClient() {
  return createAdminSB(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function invokeSendMessage(
  clienteId: string,
  plantillaId: string,
  variables: Record<string, string | number> = {},
  periodo?: string,
  offsetDias?: number,
): Promise<{ ok: boolean; error?: string; message_id?: string }> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/enviar-mensaje`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ cliente_id: clienteId, plantilla_id: plantillaId, variables, periodo, offset_dias: offsetDias }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; message_id?: string };
    return { ok: !!json.ok, error: json.error, message_id: json.message_id };
  } catch (e) {
    console.error("invokeSendMessage error", e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Validate a comprobante:
 *  1. Create a pago for the selected periodo
 *  2. Update the comprobante to estado='validado' with validado_at, validado_por, periodo_asignado
 *  3. Delete the file from Storage (ephemeral retention)
 *  4. Send the "pago_validado" WhatsApp message
 *  5. Revalidate paths
 */
export async function validarComprobanteAction(input: ValidarInput): Promise<AccionResult> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.periodo)) {
    return { ok: false, error: "Periodo inválido (debe ser YYYY-MM)" };
  }
  const admin = getServiceRoleClient();

  // 1) Load comprobante + cliente
  const { data: comp, error: cErr } = await admin
    .from("comprobantes_recibidos")
    .select("id, cliente_id, storage_path, estado")
    .eq("id", input.comprobanteId)
    .maybeSingle();
  if (cErr || !comp) {
    return { ok: false, error: "Comprobante no encontrado" };
  }
  if (comp.estado !== "pendiente") {
    return { ok: false, error: `El comprobante ya fue ${comp.estado}` };
  }
  if (!comp.cliente_id) {
    return { ok: false, error: "El comprobante no tiene cliente asociado (¿número desconocido?)" };
  }

  const { data: cliente, error: clErr } = await admin
    .from("clientes")
    .select("id, nombre, monto")
    .eq("id", comp.cliente_id)
    .maybeSingle();
  if (clErr || !cliente) {
    return { ok: false, error: "Cliente no encontrado" };
  }

  // 2) Insert pago (or update if exists)
  const { error: pagoErr } = await admin
    .from("pagos")
    .upsert(
      {
        cliente_id: cliente.id,
        periodo: input.periodo,
        monto: cliente.monto,
        metodo: "comprobante_whatsapp",
        notas: input.notas || null,
      },
      { onConflict: "cliente_id,periodo" },
    );
  if (pagoErr) {
    console.error("validarComprobante pago error", pagoErr);
    return { ok: false, error: "Error al registrar el pago" };
  }

  // 3) Update comprobante
  const { error: updErr } = await admin
    .from("comprobantes_recibidos")
    .update({
      estado: "validado",
      periodo_asignado: input.periodo,
      notas_admin: input.notas || null,
      validado_at: new Date().toISOString(),
      validado_por: null,
    })
    .eq("id", input.comprobanteId);
  if (updErr) {
    console.error("validarComprobante update error", updErr);
    return { ok: false, error: "Error al marcar el comprobante" };
  }

  // 4) Delete the file (ephemeral retention policy)
  if (comp.storage_path) {
    await admin.storage.from("comprobantes").remove([comp.storage_path]).catch((e) => {
      console.warn("Storage delete (non-fatal)", e);
    });
  }

  // 5) Send WhatsApp confirmation
  const sendResult = await invokeSendMessage(
    cliente.id,
    "pago_validado",
    {},
    input.periodo,
    999,
  );

  revalidatePath("/dashboard/comprobantes");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reportes");
  revalidatePath(`/dashboard/clientes/${cliente.id}`);

  if (!sendResult.ok) {
    return {
      ok: true,
      messageId: sendResult.message_id,
      error: `Comprobante validado, pero no se pudo enviar WhatsApp: ${sendResult.error}`,
    };
  }
  return { ok: true, messageId: sendResult.message_id };
}

/**
 * Reject a comprobante:
 *  1. Update estado='rechazado' with motivo
 *  2. Delete file from Storage
 *  3. Send "pago_rechazado" WhatsApp
 *  4. Revalidate
 */
export async function rechazarComprobanteAction(input: RechazarInput): Promise<AccionResult> {
  if (!input.motivo || input.motivo.trim().length === 0) {
    return { ok: false, error: "Indica el motivo del rechazo" };
  }
  const motivo = input.motivo.trim().slice(0, 500);
  const admin = getServiceRoleClient();

  const { data: comp, error: cErr } = await admin
    .from("comprobantes_recibidos")
    .select("id, cliente_id, storage_path, estado")
    .eq("id", input.comprobanteId)
    .maybeSingle();
  if (cErr || !comp) {
    return { ok: false, error: "Comprobante no encontrado" };
  }
  if (comp.estado !== "pendiente") {
    return { ok: false, error: `El comprobante ya fue ${comp.estado}` };
  }
  if (!comp.cliente_id) {
    return { ok: false, error: "El comprobante no tiene cliente asociado" };
  }

  const { error: updErr } = await admin
    .from("comprobantes_recibidos")
    .update({
      estado: "rechazado",
      notas_admin: motivo,
      validado_at: new Date().toISOString(),
      validado_por: null,
    })
    .eq("id", input.comprobanteId);
  if (updErr) {
    console.error("rechazarComprobante update error", updErr);
    return { ok: false, error: "Error al rechazar el comprobante" };
  }

  if (comp.storage_path) {
    await admin.storage.from("comprobantes").remove([comp.storage_path]).catch(() => {});
  }

  const sendResult = await invokeSendMessage(
    comp.cliente_id,
    "pago_rechazado",
    {},
    undefined,
    998,
  );

  revalidatePath("/dashboard/comprobantes");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/clientes/${comp.cliente_id}`);

  return {
    ok: true,
    error: sendResult.ok
      ? undefined
      : `Comprobante rechazado, pero no se pudo enviar WhatsApp: ${sendResult.error}`,
  };
}
