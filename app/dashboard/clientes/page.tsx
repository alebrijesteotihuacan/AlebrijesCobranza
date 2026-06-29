import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getClientes } from "@/lib/queries/clientes";
import { ClienteTable } from "@/components/clientes/cliente-table";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const [clientes, all] = await Promise.all([
    getClientes({ includeInactive: false }),
    getClientes({ includeInactive: true }),
  ]);
  const inactiveCount = all.length - clientes.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl text-alebrijes-black tracking-wide">
            Clientes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clientes.length} activo{clientes.length === 1 ? "" : "s"}
            {inactiveCount > 0 && ` · ${inactiveCount} inactivo${inactiveCount === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button
          render={<Link href="/dashboard/clientes/nuevo" />}
          className="bg-alebrijes-orange hover:bg-alebrijes-orange-dark text-white"
        >
          <Plus className="w-4 h-4 mr-1" /> Nuevo cliente
        </Button>
      </div>

      {/* Table */}
      <ClienteTable clientes={clientes} />
    </div>
  );
}
