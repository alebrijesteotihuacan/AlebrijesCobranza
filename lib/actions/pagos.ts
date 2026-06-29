"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/queries/clientes";
import { pagoSchema } from "@/lib/validations";

export interface PagoActionResult {
  ok: boolean;
  error?: string;
}

export async function registrarPagoAction(input: unknown): Promise<PagoActionResult> {
  const parsed = pagoSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `${issue.path.join(".")}: ${issue.message}` };
  }
  const admin = getAdminClient();
  const { cliente_id, ...rest } = input as { cliente_id: string } & Record<string, unknown>;
  const { error } = await admin
    .from("pagos")
    .insert({ cliente_id, ...parsed.data });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ya existe un pago para este cliente en ese periodo." };
    }
    console.error("registrarPagoAction error", error);
    return { ok: false, error: "Error al registrar el pago." };
  }
  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${cliente_id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deletePagoAction(id: string): Promise<PagoActionResult> {
  const admin = getAdminClient();
  // Capture cliente_id first for revalidation
  const { data: pago } = await admin.from("pagos").select("cliente_id").eq("id", id).single();
  const { error } = await admin.from("pagos").delete().eq("id", id);
  if (error) {
    console.error("deletePagoAction error", error);
    return { ok: false, error: "Error al eliminar el pago." };
  }
  if (pago?.cliente_id) {
    revalidatePath(`/dashboard/clientes/${pago.cliente_id}`);
  }
  revalidatePath("/dashboard/clientes");
  revalidatePath("/dashboard");
  return { ok: true };
}
