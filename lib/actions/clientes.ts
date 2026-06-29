"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient, getClientes, type Cliente } from "@/lib/queries/clientes";
import { clienteSchema } from "@/lib/validations";

export interface ActionResult {
  ok: boolean;
  error?: string;
  cliente?: Cliente;
}

export async function listClientesAction(includeInactive = false): Promise<Cliente[]> {
  return await getClientes({ includeInactive });
}

export async function createClienteAction(input: unknown): Promise<ActionResult> {
  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `${issue.path.join(".")}: ${issue.message}` };
  }
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("clientes")
    .insert(parsed.data)
    .select()
    .single<Cliente>();
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ya existe un cliente con ese número de WhatsApp." };
    }
    console.error("createClienteAction error", error);
    return { ok: false, error: "Error al crear el cliente." };
  }
  revalidatePath("/dashboard/clientes");
  revalidatePath("/dashboard");
  return { ok: true, cliente: data };
}

export async function updateClienteAction(id: string, input: unknown): Promise<ActionResult> {
  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `${issue.path.join(".")}: ${issue.message}` };
  }
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("clientes")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single<Cliente>();
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ya existe un cliente con ese número de WhatsApp." };
    }
    console.error("updateClienteAction error", error);
    return { ok: false, error: "Error al actualizar el cliente." };
  }
  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${id}`);
  return { ok: true, cliente: data };
}

export async function softDeleteClienteAction(id: string): Promise<ActionResult> {
  const admin = getAdminClient();
  const { error } = await admin
    .from("clientes")
    .update({ activo: false })
    .eq("id", id);
  if (error) {
    console.error("softDeleteClienteAction error", error);
    return { ok: false, error: "Error al desactivar el cliente." };
  }
  revalidatePath("/dashboard/clientes");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function reactivateClienteAction(id: string): Promise<ActionResult> {
  const admin = getAdminClient();
  const { error } = await admin
    .from("clientes")
    .update({ activo: true })
    .eq("id", id);
  if (error) {
    console.error("reactivateClienteAction error", error);
    return { ok: false, error: "Error al reactivar el cliente." };
  }
  revalidatePath("/dashboard/clientes");
  return { ok: true };
}
