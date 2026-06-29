"use client";

import { useState } from "react";
import { MoreHorizontal, Plus, Receipt, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMXN, formatPeriodoLabel, formatRelativeTime } from "@/lib/utils";
import type { Pago } from "@/lib/queries/pagos";
import { PagoFormDialog } from "@/components/clientes/pago-form-dialog";
import { deletePagoAction } from "@/lib/actions/pagos";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  clienteId: string;
  clienteNombre: string;
  pagos: Pago[];
  defaultMonto: number;
}

export function HistorialPagos({ clienteId, clienteNombre, pagos, defaultMonto }: Props) {
  const router = useRouter();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const total = pagos.reduce((sum, p) => sum + Number(p.monto), 0);
  const targetPago = pagos.find((p) => p.id === confirmId);

  async function handleDelete() {
    if (!confirmId) return;
    setPending(true);
    const result = await deletePagoAction(confirmId);
    setPending(false);
    if (result.ok) {
      toast.success("Pago eliminado");
      setConfirmId(null);
      router.refresh();
    } else {
      toast.error(result.error ?? "Error");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Historial de pagos
          </CardTitle>
          <CardDescription>
            {pagos.length} pago{pagos.length === 1 ? "" : "s"} · Total: {formatMXN(total)}
          </CardDescription>
        </div>
        <PagoFormDialog
          clienteId={clienteId}
          clienteNombre={clienteNombre}
          defaultMonto={defaultMonto}
        />
      </CardHeader>
      <CardContent>
        {pagos.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Aún no hay pagos registrados para este cliente.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {pagos.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium capitalize">
                      {formatPeriodoLabel(p.periodo)}
                    </span>
                    <Badge variant="secondary" className="font-mono">
                      {formatMXN(p.monto)}
                    </Badge>
                    {p.metodo && (
                      <Badge variant="outline" className="text-xs">
                        {p.metodo}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatRelativeTime(p.fecha_pago)}
                    {p.notas && ` · ${p.notas}`}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1.5 rounded-md hover:bg-zinc-100 outline-none">
                    <MoreHorizontal className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setConfirmId(p.id)}
                      className="text-alebrijes-red focus:text-alebrijes-red"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {/* Confirm delete */}
      <Dialog open={!!confirmId} onOpenChange={(o) => !o && !pending && setConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar pago?</DialogTitle>
            <DialogDescription>
              Se eliminará el pago de {formatMXN(targetPago?.monto ?? 0)}{" "}
              correspondiente a{" "}
              <strong className="capitalize">
                {targetPago && formatPeriodoLabel(targetPago.periodo)}
              </strong>
              . Esta acción reactivará los recordatorios automáticos del cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmId(null)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={pending}
              className="bg-alebrijes-red hover:bg-alebrijes-red/90 text-white"
            >
              {pending ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
