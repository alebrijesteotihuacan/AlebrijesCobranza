import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

export interface AuditEntry {
  userId?: string | null;
  userEmail?: string | null;
  action: string;            // e.g. 'cliente.create'
  resource: string;          // e.g. 'clientes'
  resourceId?: string;
  details?: Record<string, unknown>;
}

/**
 * Writes an entry to audit_log. Should be called from server actions
 * after a successful operation. Errors are logged but not thrown
 * (we don't want auditing to fail the main operation).
 */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    let ip: string | null = null;
    let userAgent: string | null = null;
    try {
      const h = await headers();
      const forwarded = h.get("x-forwarded-for");
      ip = forwarded?.split(",")[0]?.trim() ?? null;
      userAgent = h.get("user-agent") ?? null;
    } catch {
      // not in a request context (e.g. cron) — skip
    }
    const { error } = await supabase.rpc("write_audit_log", {
      p_user_id: entry.userId ?? null,
      p_user_email: entry.userEmail ?? null,
      p_action: entry.action,
      p_resource: entry.resource,
      p_resource_id: entry.resourceId ?? null,
      p_details: entry.details ?? {},
    });
    if (error) {
      // Fallback: try direct insert (in case RPC isn't available yet)
      const { error: insertError } = await supabase.from("audit_log").insert({
        user_id: entry.userId ?? null,
        user_email: entry.userEmail ?? null,
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resourceId ?? null,
        details: entry.details ?? {},
        ip,
        user_agent: userAgent,
      });
      if (insertError) {
        console.error("audit fallback insert error", insertError, error);
      }
    }
  } catch (e) {
    console.error("audit error (non-fatal)", e);
  }
}
