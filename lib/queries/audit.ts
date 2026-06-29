import { getAdminClient } from "@/lib/queries/clientes";

export interface AuditEntry {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

export async function getAuditLog(opts: { limit?: number; offset?: number } = {}): Promise<{
  entries: AuditEntry[];
  total: number;
}> {
  const { limit = 50, offset = 0 } = opts;
  const admin = getAdminClient();
  const [data, count] = await Promise.all([
    admin
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1),
    admin.from("audit_log").select("id", { count: "exact", head: true }),
  ]);
  return {
    entries: (data.data ?? []) as unknown as AuditEntry[],
    total: count.count ?? 0,
  };
}

export async function getAuditKpis(): Promise<{ last24h: number; total: number }> {
  const admin = getAdminClient();
  const [last24h, total] = await Promise.all([
    admin
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    admin.from("audit_log").select("id", { count: "exact", head: true }),
  ]);
  return {
    last24h: last24h.count ?? 0,
    total: total.count ?? 0,
  };
}
