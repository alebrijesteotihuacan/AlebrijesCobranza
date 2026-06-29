"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAdminClient, getClientes, type Cliente } from "@/lib/queries/clientes";
import { clienteSchema } from "@/lib/validations";
import { audit } from "@/lib/audit";

export interface ActionResult {
  ok: boolean;
  error?: string;
  cliente?: Cliente;
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() { /* no-op */ },
        },
      },
    );
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
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
  await audit({
    userId: await getCurrentUserId(),
    action: "cliente.create",
    resource: "clientes",
    resourceId: data.id,
    details: {
      nombre: data.nombre,
      whatsapp: data.whatsapp,
      dia_pago: data.dia_pago,
      monto: data.monto,
    },
  });
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
  await audit({
    userId: await getCurrentUserId(),
    action: "cliente.update",
    resource: "clientes",
    resourceId: id,
    details: { updated_fields: parsed.data },
  });
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
  await audit({
    userId: await getCurrentUserId(),
    action: "cliente.soft_delete",
    resource: "clientes",
    resourceId: id,
  });
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
  await audit({
    userId: await getCurrentUserId(),
    action: "cliente.reactivate",
    resource: "clientes",
    resourceId: id,
  });
  revalidatePath("/dashboard/clientes");
  return { ok: true };
}
