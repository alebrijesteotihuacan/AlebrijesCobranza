"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, X, CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatRelativeTime, formatWhatsApp } from "@/lib/utils";
import type { MensajeEnviadoWithRelations } from "@/lib/queries/mensajes-enviados";
import type { Cliente } from "@/lib/queries/clientes";

interface Props {
  mensajes: MensajeEnviadoWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  clientes: Pick<Cliente, "id" | "nombre" | "whatsapp">[];
  periodos: string[];
  defaultPeriodo: string | null;
}

const OFFSET_LABEL: Record<number, string> = {
  [-3]: "-3d",
  [-1]: "-1d",
  [0]:  "hoy",
  [1]:  "+1d",
  [3]:  "+3d",
  [7]:  "+7d",
  [998]: "rechazado",
  [999]: "validado",
};

function offsetLabel(o: number): string {
  if (OFFSET_LABEL[o]) return OFFSET_LABEL[o];
  if (o > 0) return `+${o}d`;
  if (o < 0) return `${o}d`;
  return String(o);
}

export function MensajesTable({
  mensajes,
  total,
  page,
  pageSize,
  clientes,
  periodos,
  defaultPeriodo,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [clienteSearch, setClienteSearch] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    // Reset page when filters change
    if (Object.keys(updates).some((k) => k !== "page")) {
      params.delete("page");
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(`/dashboard/mensajes${qs ? `?${qs}` : ""}`);
    });
  }

  function clearFilters() {
    startTransition(() => {
      router.push("/dashboard/mensajes");
    });
  }

  const filteredClientes = useMemo(() => {
    const q = clienteSearch.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.whatsapp.includes(q),
    );
  }, [clientes, clienteSearch]);

  const hasFilters =
    !!searchParams.get("cliente") ||
    !!searchParams.get("periodo") ||
    !!searchParams.get("estado") ||
    !!searchParams.get("from") ||
    !!searchParams.get("to");

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Cliente */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cliente</label>
              <Select
                value={searchParams.get("cliente") ?? "todos"}
                onValueChange={(v) => updateParams({ cliente: v === "todos" ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <div className="p-2 sticky top-0 bg-popover border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Buscar cliente..."
                        value={clienteSearch}
                        onChange={(e) => setClienteSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="h-8 pl-7 text-xs"
                      />
                    </div>
                  </div>
                  <SelectItem value="todos">Todos los clientes</SelectItem>
                  {filteredClientes.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</div>
                  ) : (
                    filteredClientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} · {formatWhatsApp(c.whatsapp)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Periodo */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Periodo</label>
              <Select
                value={searchParams.get("periodo") ?? "todos"}
                onValueChange={(v) => updateParams({ periodo: v === "todos" ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los periodos</SelectItem>
                  {(defaultPeriodo && !periodos.includes(defaultPeriodo)) && (
                    <SelectItem value={defaultPeriodo}>{defaultPeriodo} (actual)</SelectItem>
                  )}
                  {periodos.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Estado</label>
              <Select
                value={searchParams.get("estado") ?? "todos"}
                onValueChange={(v) => updateParams({ estado: v === "todos" ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="enviado">Enviados</SelectItem>
                  <SelectItem value="fallido">Fallidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rango de fechas */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Rango</label>
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={searchParams.get("from") ?? ""}
                  onChange={(e) => updateParams({ from: e.target.value || null })}
                  max={searchParams.get("to") || undefined}
                  className="h-8 text-xs flex-1"
                />
                <span className="text-xs text-muted-foreground">→</span>
                <Input
                  type="date"
                  value={searchParams.get("to") ?? ""}
                  onChange={(e) => updateParams({ to: e.target.value || null })}
                  min={searchParams.get("from") || undefined}
                  className="h-8 text-xs flex-1"
                />
              </div>
            </div>
          </div>

          {hasFilters && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-3.5 h-3.5 mr-1" /> Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      {mensajes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            {hasFilters ? "Sin resultados con los filtros aplicados." : "Aún no se han enviado mensajes."}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-zinc-200 bg-zinc-50/50">
                  <th className="text-left font-medium px-3 py-2.5">Cliente</th>
                  <th className="text-left font-medium px-3 py-2.5">Plantilla</th>
                  <th className="text-left font-medium px-3 py-2.5 hidden md:table-cell">Periodo</th>
                  <th className="text-center font-medium px-3 py-2.5">Offset</th>
                  <th className="text-center font-medium px-3 py-2.5">Estado</th>
                  <th className="text-right font-medium px-3 py-2.5">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {mensajes.map((m) => (
                  <MensajeRow key={m.id} mensaje={m} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-sm">
              <div className="text-muted-foreground">
                {total} mensaje{total === 1 ? "" : "s"} · página {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateParams({ page: String(Math.max(1, page - 1)) })}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateParams({ page: String(Math.min(totalPages, page + 1)) })}
                  disabled={page === totalPages}
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MensajeRow({ mensaje: m }: { mensaje: MensajeEnviadoWithRelations }) {
  const [open, setOpen] = useState(false);
  return (
    <tr className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50">
      <td className="px-3 py-2.5">
        {m.cliente ? (
          <span className="font-medium truncate block max-w-[180px]">
            {m.cliente.nombre}
          </span>
        ) : (
          <span className="text-muted-foreground italic text-xs">cliente eliminado</span>
        )}
        {m.cliente && (
          <span className="text-[10px] text-muted-foreground font-mono">
            {formatWhatsApp(m.cliente.whatsapp)}
          </span>
        )}
      </td>
      <td className="px-3 py-2.5 font-mono text-xs">
        {m.plantilla_id || "—"}
      </td>
      <td className="px-3 py-2.5 hidden md:table-cell font-mono text-xs">
        {m.periodo}
      </td>
      <td className="px-3 py-2.5 text-center">
        <Badge variant="outline" className="font-mono text-[10px]">
          {offsetLabel(m.offset_dias)}
        </Badge>
      </td>
      <td className="px-3 py-2.5 text-center">
        {m.estado === "enviado" ? (
          <Badge className="bg-alebrijes-success/15 text-alebrijes-success border-alebrijes-success/30">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Enviado
          </Badge>
        ) : (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger
              render={
                <button
                  type="button"
                  className="inline-flex items-center text-xs font-medium text-alebrijes-red gap-0.5 hover:underline"
                >
                  <XCircle className="w-3 h-3" /> Fallido
                  <ChevronDown className="w-3 h-3" />
                </button>
              }
            />
            <CollapsibleContent>
              <pre className="text-[10px] text-alebrijes-red bg-alebrijes-red/5 border border-alebrijes-red/20 rounded p-2 mt-1 max-w-[300px] overflow-x-auto">
                {m.error || "Sin detalle del error"}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}
      </td>
      <td className="px-3 py-2.5 text-right text-xs text-muted-foreground">
        {formatRelativeTime(m.enviado_at)}
      </td>
    </tr>
  );
}
