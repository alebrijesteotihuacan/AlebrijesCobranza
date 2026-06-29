"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUserId } from "@/lib/queries/admin-utils";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export interface AdminActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  nombre: z.string().trim().min(2, "Mínimo 2 caracteres").max(100),
});

export async function inviteAdminAction(input: unknown): Promise<AdminActionResult> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { email, nombre } = parsed.data;

  // Prevent self-demotion: verify caller is admin
  const caller = await getCurrentUserId();
  if (!caller) return { ok: false, error: "No autorizado" };

  const admin = getServiceClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(".supabase.co", ".vercel.app") ?? "https://alebrijes-cobranza.vercel.app"}/login`,
    data: { nombre, rol: "admin" },
  });

  if (error) {
    console.error("inviteAdminAction error", error);
    if (error.message.includes("already")) {
      return { ok: false, error: "Este email ya está registrado" };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/configuracion");
  return { ok: true, message: `Invitación enviada a ${email}` };
}

const banSchema = z.object({
  userId: z.string().uuid(),
});

export async function banAdminAction(input: unknown): Promise<AdminActionResult> {
  const parsed = banSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "ID inválido" };

  // Prevent self-ban
  const caller = await getCurrentUserId();
  if (caller === parsed.data.userId) {
    return { ok: false, error: "No podés desactivarte a vos mismo" };
  }
  if (!caller) return { ok: false, error: "No autorizado" };

  const admin = getServiceClient();
  // Ban for 100 years (~forever)
  const foreverDate = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await admin.auth.admin.updateUserById(parsed.data.userId, {
    ban_duration: "100y",
  });
  if (error) {
    console.error("banAdminAction error", error);
    return { ok: false, error: error.message };
  }
  // Unused to avoid TS warning
  void foreverDate;

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/configuracion");
  return { ok: true, message: "Admin desactivado" };
}

export async function unbanAdminAction(input: unknown): Promise<AdminActionResult> {
  const parsed = banSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "ID inválido" };

  const admin = getServiceClient();
  const { error } = await admin.auth.admin.updateUserById(parsed.data.userId, {
    ban_duration: "none",
  });
  if (error) {
    console.error("unbanAdminAction error", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/admin");
  return { ok: true, message: "Admin reactivado" };
}
