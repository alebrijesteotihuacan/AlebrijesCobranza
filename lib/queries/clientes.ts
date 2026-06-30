import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for server-side reads/writes.
 * Bypasses RLS — never expose this to the browser.
 */
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_URL. " +
      "Agregar la key en .env.local (local) y Vercel Environment Variables (producción). " +
      "Ver docs/OPERATIONS.md o tareas.md → Sección 'Migración 3ra cuenta de Meta'.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface Cliente {
  id: string;
  nombre: string;
  whatsapp: string;
  dia_pago: 15 | 30;
  monto: number;
  categoria: string | null;
  activo: boolean;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export async function getClientes(opts: { includeInactive?: boolean } = {}): Promise<Cliente[]> {
  const admin = getAdminClient();
  let q = admin.from("clientes").select("*").order("created_at", { ascending: false });
  if (!opts.includeInactive) q = q.eq("activo", true);
  const { data, error } = await q;
  if (error) {
    console.error("getClientes error", error);
    return [];
  }
  return (data ?? []) as Cliente[];
}

export async function getClienteById(id: string): Promise<Cliente | null> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("clientes")
    .select("*")
    .eq("id", id)
    .maybeSingle<Cliente>();
  if (error) {
    console.error("getClienteById error", error);
    return null;
  }
  return data;
}
