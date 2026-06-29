import { redirect } from "next/navigation";
import { Settings, Wallet, MessageSquare, User as UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getInfoPago } from "@/lib/queries/configuracion";
import { getAdminClient } from "@/lib/queries/clientes";
import { InfoPagoForm } from "@/components/configuracion/info-pago-form";
import { PlantillasEditor, type Plantilla } from "@/components/configuracion/plantillas-editor";
import { AccountInfo } from "@/components/configuracion/account-info";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Configuración · Alebrijes Cobranza",
};

export default async function ConfiguracionPage() {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load data in parallel
  const [infoPago, plantillasRes] = await Promise.all([
    getInfoPago(),
    getAdminClient()
      .from("plantillas")
      .select("id, offset_dias, plantilla, activo, updated_at")
      .order("offset_dias", { ascending: true }),
  ]);
  const plantillas: Plantilla[] = (plantillasRes.data ?? []) as Plantilla[];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl sm:text-4xl text-alebrijes-black tracking-wide">
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ajustes generales de la aplicación
        </p>
      </div>

      {/* Section 1: Info de pago */}
      <InfoPagoForm initialValue={infoPago} />

      {/* Section 2: Plantillas */}
      <PlantillasEditor plantillas={plantillas} />

      {/* Section 3: Account */}
      <Link href="/dashboard/admin" className="block">
        <Button
          render={<Link href="/dashboard/admin" />}
          variant="outline"
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Gestionar administradores
          </span>
          <span className="text-xs text-muted-foreground">Invitar / desactivar</span>
        </Button>
      </Link>

      <AccountInfo
        email={user.email ?? null}
        nombre={(user.user_metadata?.nombre as string | undefined) ?? null}
        createdAt={user.created_at}
      />
    </div>
  );
}
