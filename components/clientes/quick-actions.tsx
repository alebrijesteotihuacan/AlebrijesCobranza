"use client";

import Link from "next/link";
import { MessageCircle, CheckCircle2, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PagoFormDialog } from "@/components/clientes/pago-form-dialog";
import { softDeleteClienteAction, reactivateClienteAction } from "@/lib/actions/clientes";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { Cliente } from "@/lib/queries/clientes";
import { formatWhatsApp } from "@/lib/utils";

interface Props {
  cliente: Cliente;
}

export function QuickActions({ cliente }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleToggleActive() {
    startTransition(async () => {
      const fn = cliente.activo ? softDeleteClienteAction : reactivateClienteAction;
      const result = await fn(cliente.id);
      if (result.ok) {
        toast.success(cliente.activo ? "Cliente desactivado" : "Cliente reactivado");
        router.refresh();
      } else {
        toast.error(result.error ?? "Error");
      }
    });
  }

  const waLink = `https://wa.me/${cliente.whatsapp}`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <div>
        <h2 className="font-heading text-lg text-alebrijes-black tracking-wide">
          Acciones rápidas
        </h2>
        <p className="text-xs text-muted-foreground">
          {formatWhatsApp(cliente.whatsapp)} · día {cliente.dia_pago} · ${cliente.monto} MXN
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {/* Marcar como pagado — acción principal */}
        <PagoFormDialog
          clienteId={cliente.id}
          clienteNombre={cliente.nombre}
          defaultMonto={cliente.monto}
        />

        {/* Abrir chat de WhatsApp */}
        <Button
          variant="outline"
          render={
            <Link href={waLink} target="_blank" rel="noopener noreferrer" />
          }
        >
          <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
        </Button>

        {/* Activar / Desactivar */}
        {cliente.activo ? (
          <Button
            variant="outline"
            onClick={handleToggleActive}
            disabled={pending}
            className="text-alebrijes-red border-alebrijes-red/30 hover:bg-alebrijes-red/5"
          >
            <PowerOff className="w-4 h-4 mr-1" /> Desactivar
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={handleToggleActive}
            disabled={pending}
            className="text-alebrijes-success border-alebrijes-success/30 hover:bg-alebrijes-success/5"
          >
            <Power className="w-4 h-4 mr-1" /> Reactivar
          </Button>
        )}
      </div>
    </div>
  );
}
