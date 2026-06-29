"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Power, PowerOff, Plus, Search, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { softDeleteClienteAction, reactivateClienteAction } from "@/lib/actions/clientes";
import type { Cliente } from "@/lib/queries/clientes";
import { formatMXN, formatWhatsApp } from "@/lib/utils";

interface Props {
  clientes: Cliente[];
  includeInactive?: boolean;
}

const PAGE_SIZE = 20;

export function ClienteTable({ clientes, includeInactive = false }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"deactivate" | "reactivate">("deactivate");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.whatsapp.includes(q) ||
        (c.categoria ?? "").toLowerCase().includes(q),
    );
  }, [clientes, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const targetCliente = clientes.find((c) => c.id === confirmId);

  function openConfirm(id: string, action: "deactivate" | "reactivate") {
    setConfirmId(id);
    setConfirmAction(action);
  }

  function closeConfirm() {
    if (pending) return;
    setConfirmId(null);
  }

  function handleConfirm() {
    if (!confirmId) return;
    const id = confirmId;
    startTransition(async () => {
      const fn = confirmAction === "deactivate" ? softDeleteClienteAction : reactivateClienteAction;
      const result = await fn(id);
      if (result.ok) {
        toast.success(
          confirmAction === "deactivate"
            ? "Cliente desactivado"
            : "Cliente reactivado",
        );
        router.refresh();
        setConfirmId(null);
      } else {
        toast.error(result.error ?? "Error");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre, WhatsApp o categoría..."
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {filtered.length} cliente{filtered.length === 1 ? "" : "s"}
            {includeInactive ? "" : " activos"}
          </div>
          <Button
            render={<Link href="/dashboard/clientes/nuevo" />}
            className="bg-alebrijes-orange hover:bg-alebrijes-orange-dark text-white"
          >
            <Plus className="w-4 h-4 mr-1" /> Nuevo cliente
          </Button>
        </div>
      </div>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead className="text-center">Día</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right w-12">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((c) => (
                  <TableRow key={c.id} className={!c.activo ? "opacity-60" : undefined}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/clientes/${c.id}`}
                        className="hover:text-alebrijes-orange hover:underline"
                      >
                        {c.nombre}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatWhatsApp(c.whatsapp)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono">
                        día {c.dia_pago}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatMXN(c.monto)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.categoria || <span className="italic">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {c.activo ? (
                        <Badge className="bg-alebrijes-success/10 text-alebrijes-success border-alebrijes-success/30">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1.5 rounded-md hover:bg-zinc-100 outline-none">
                          <MoreHorizontal className="w-4 h-4" />
                          <span className="sr-only">Acciones</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            render={<Link href={`/dashboard/clientes/${c.id}`} />}
                          >
                            <Pencil className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {c.activo ? (
                            <DropdownMenuItem
                              onClick={() => openConfirm(c.id, "deactivate")}
                              className="text-alebrijes-red focus:text-alebrijes-red"
                            >
                              <PowerOff className="w-4 h-4 mr-2" /> Desactivar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => openConfirm(c.id, "reactivate")}
                            >
                              <Power className="w-4 h-4 mr-2" /> Reactivar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-sm">
              <div className="text-muted-foreground">
                Página {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm deactivate/reactivate dialog */}
      <Dialog open={!!confirmId} onOpenChange={(o) => !o && closeConfirm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "deactivate" ? "¿Desactivar cliente?" : "¿Reactivar cliente?"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "deactivate" ? (
                <>
                  <strong>{targetCliente?.nombre}</strong> no recibirá más
                  recordatorios automáticos, pero su historial y pagos se conservan.
                  Puedes reactivarlo después.
                </>
              ) : (
                <>
                  <strong>{targetCliente?.nombre}</strong> volverá a recibir
                  recordatorios automáticos en su próxima fecha de pago.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeConfirm} disabled={pending}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={pending}
              className={
                confirmAction === "deactivate"
                  ? "bg-alebrijes-red hover:bg-alebrijes-red/90 text-white"
                  : "bg-alebrijes-success hover:bg-alebrijes-success/90 text-white"
              }
            >
              {pending
                ? "Procesando..."
                : confirmAction === "deactivate"
                ? "Sí, desactivar"
                : "Sí, reactivar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border-2 border-dashed border-zinc-200 bg-white p-12 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-alebrijes-orange/10 flex items-center justify-center mb-4">
        <Users className="w-7 h-7 text-alebrijes-orange" />
      </div>
      <h3 className="font-heading text-xl text-alebrijes-black tracking-wide">
        Aún no hay clientes
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        Agrega tu primer cliente para empezar a enviar recordatorios de pago por WhatsApp.
      </p>
      <Button
        render={<Link href="/dashboard/clientes/nuevo" />}
        className="mt-4 bg-alebrijes-orange hover:bg-alebrijes-orange-dark text-white"
      >
        <Plus className="w-4 h-4 mr-1" /> Nuevo cliente
      </Button>
    </div>
  );
}
