"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export interface IgnorarResult {
  ok: boolean;
  error?: string;
}

export async function ignorarDesconocidoAction(id: string): Promise<IgnorarResult> {
  const admin = getServiceClient();
  const { error } = await admin
    .from("mensajes_desconocidos")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("ignorarDesconocidoAction error", error);
    return { ok: false, error: "Error al marcar como ignorado" };
  }
  revalidatePath("/dashboard/desconocidos");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function ignorarTodosDesconocidosAction(): Promise<IgnorarResult> {
  const admin = getServiceClient();
  const { error } = await admin
    .from("mensajes_desconocidos")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all
  if (error) {
    console.error("ignorarTodosDesconocidosAction error", error);
    return { ok: false, error: "Error al limpiar todos" };
  }
  revalidatePath("/dashboard/desconocidos");
  revalidatePath("/dashboard");
  return { ok: true };
}
