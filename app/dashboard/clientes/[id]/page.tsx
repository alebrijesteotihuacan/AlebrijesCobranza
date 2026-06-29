import { notFound } from "next/navigation";
import { getClienteById } from "@/lib/queries/clientes";
import { getPagosByCliente, getMensajesByCliente } from "@/lib/queries/pagos";
import { ClienteForm } from "@/components/clientes/cliente-form";
import { HistorialPagos } from "@/components/clientes/historial-pagos";
import { MensajesTimeline } from "@/components/clientes/mensajes-timeline";
import { QuickActions } from "@/components/clientes/quick-actions";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarClientePage({ params }: PageProps) {
  const { id } = await params;
  const cliente = await getClienteById(id);
  if (!cliente) notFound();

  const [pagos, mensajes] = await Promise.all([
    getPagosByCliente(id, 50),
    getMensajesByCliente(id, 50),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Status banner */}
      {!cliente.activo && (
        <div className="rounded-md bg-zinc-100 border border-zinc-200 p-3 text-sm flex items-center gap-2">
          <Badge variant="secondary">Inactivo</Badge>
          <span className="text-muted-foreground">
            Este cliente está desactivado. No recibe recordatorios automáticos.
          </span>
        </div>
      )}

      {/* Quick actions bar */}
      <QuickActions cliente={cliente} />

      {/* Edit form */}
      <ClienteForm mode="edit" cliente={cliente} />

      {/* Side info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HistorialPagos
          clienteId={cliente.id}
          clienteNombre={cliente.nombre}
          pagos={pagos}
          defaultMonto={cliente.monto}
        />
        <MensajesTimeline mensajes={mensajes} />
      </div>
    </div>
  );
}
