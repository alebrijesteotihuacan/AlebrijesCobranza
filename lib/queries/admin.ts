import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export interface AdminUser {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  user_metadata: Record<string, unknown>;
  is_current: boolean;  // computed by caller
}

export async function listAdmins(currentUserId: string): Promise<AdminUser[]> {
  const admin = getServiceClient();
  // Get the first page (Supabase default page size 50)
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 50 });
  if (error) {
    console.error("listAdmins error", error);
    return [];
  }
  return (data?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? null,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    email_confirmed_at: u.email_confirmed_at ?? null,
    banned_until: (u as { banned_until?: string | null }).banned_until ?? null,
    user_metadata: (u.user_metadata ?? {}) as Record<string, unknown>,
    is_current: u.id === currentUserId,
  }));
}
