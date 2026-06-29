import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { BadgeCountsProvider } from "@/components/dashboard/badge-context";
import { getBadgeCounts } from "@/lib/queries/badges";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Use service-role for badge counts (RLS denies anon, so direct client
  // can't read comprobantes/mensajes). We use server-side service key.
  let badges = { comprobantes: 0, desconocidos: 0 };
  try {
    badges = await getBadgeCounts();
  } catch (e) {
    console.error("Failed to load badge counts", e);
  }

  return (
    <BadgeCountsProvider initial={badges}>
      <div className="min-h-screen flex bg-zinc-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar user={user} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-auto">
            {children}
          </main>
        </div>
      </div>
    </BadgeCountsProvider>
  );
}
