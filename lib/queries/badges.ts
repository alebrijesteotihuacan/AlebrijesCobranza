import { createClient } from "@/lib/supabase/server";

export interface BadgeCounts {
  comprobantes: number;
  desconocidos: number;
}

/**
 * Server-side query for sidebar badge counts.
 * Uses the service-role key because the user is authenticated as anon
 * and the tables have RLS that denies all to anon.
 */
export async function getBadgeCounts(): Promise<BadgeCounts> {
  const supabase = await createClient();
  // Use the service role key to bypass RLS
  const { createClient: createAdmin } = await import("@supabase/supabase-js");
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const [comprobantesRes, desconocidosRes] = await Promise.all([
    admin.from("comprobantes_recibidos").select("id", { count: "exact", head: true })
      .eq("estado", "pendiente"),
    admin.from("mensajes_desconocidos").select("id", { count: "exact", head: true }),
  ]);

  return {
    comprobantes: comprobantesRes.count ?? 0,
    desconocidos: desconocidosRes.count ?? 0,
  };
}
