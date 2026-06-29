import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Returns the current authenticated user id from the Supabase session cookie,
 * or null if no user is logged in / session is invalid.
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() { /* no-op for read-only */ },
        },
      },
    );
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch (e) {
    console.error("getCurrentUserId error", e);
    return null;
  }
}
