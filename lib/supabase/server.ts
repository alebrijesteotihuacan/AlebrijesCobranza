import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

/**
 * Server-side Supabase client. Reads/writes auth cookies.
 *
 * For pages and layouts (read-only user session is fine), use `await cookies()`.
 * For Server Actions / Route Handlers that mutate auth cookies, use the
 * `setAll` adapter with the request-bound cookies helper.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options as CookieOptions);
            }
          } catch {
            // `set` was called from a Server Component — ignore.
            // Middleware handles refresh.
          }
        },
      },
    },
  );
}
