import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { listAdmins } from "@/lib/queries/admin";
import { getCurrentUserId } from "@/lib/queries/admin-utils";
import { AdminList } from "@/components/admin/admin-list";
import { InviteAdminForm } from "@/components/admin/invite-admin-form";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const currentUserId = (await getCurrentUserId()) ?? user.id;
  const admins = await listAdmins(currentUserId);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Button
          render={<Link href="/dashboard/configuracion" />}
          variant="ghost"
          size="sm"
          className="mb-3 -ml-2 text-muted-foreground"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Configuración
        </Button>
        <h1 className="font-heading text-3xl sm:text-4xl text-alebrijes-black tracking-wide flex items-center gap-2">
          <Shield className="w-7 h-7" /> Administradores
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestioná quién tiene acceso al dashboard
        </p>
      </div>

      <InviteAdminForm />

      <AdminList admins={admins} />
    </div>
  );
}
