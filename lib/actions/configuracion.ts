"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export interface ConfigResult {
  ok: boolean;
  error?: string;
}

const infoPagoSchema = z.string().trim().min(1, "La información de pago no puede estar vacía").max(1000);

export async function updateInfoPagoAction(value: string): Promise<ConfigResult> {
  const parsed = infoPagoSchema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `${issue.path.join(".")}: ${issue.message}` };
  }
  const admin = getServiceClient();
  const { error } = await admin
    .from("configuracion")
    .upsert(
      { key: "info_pago", value: parsed.data, updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  if (error) {
    console.error("updateInfoPagoAction error", error);
    return { ok: false, error: "Error al guardar la información de pago" };
  }
  revalidatePath("/dashboard/configuracion");
  revalidatePath("/dashboard"); // The dashboard KPIs might display it
  return { ok: true };
}

const plantillaSchema = z.object({
  id: z.string().min(1),
  plantilla: z.string().trim().min(1, "La plantilla no puede estar vacía").max(2000),
  activo: z.boolean(),
});

export async function updatePlantillaAction(
  id: string,
  updates: { plantilla?: string; activo?: boolean },
): Promise<ConfigResult> {
  // Validate
  const validated = plantillaSchema.safeParse({ id, ...updates });
  if (!validated.success) {
    const issue = validated.error.issues[0];
    return { ok: false, error: `${issue.path.join(".")}: ${issue.message}` };
  }

  const admin = getServiceClient();
  const { data, error } = await admin
    .from("plantillas")
    .update({
      plantilla: validated.data.plantilla,
      activo: validated.data.activo,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("updatePlantillaAction error", error);
    return { ok: false, error: "Error al guardar la plantilla" };
  }
  if (!data) {
    return { ok: false, error: "Plantilla no encontrada" };
  }
  revalidatePath("/dashboard/configuracion");
  revalidatePath("/dashboard/reportes");
  return { ok: true };
}
