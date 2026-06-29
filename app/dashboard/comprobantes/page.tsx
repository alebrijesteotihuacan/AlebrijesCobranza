import Link from "next/link";
import { Inbox, CheckCircle2, XCircle, Clock, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComprobanteCard } from "@/components/comprobantes/comprobante-card";
import {
  getComprobantesByEstado,
  getComprobantesKpis,
  getComprobantesPeriodoOptions,
  type ComprobanteEstado,
} from "@/lib/queries/comprobantes";
import { getCurrentPeriodo } from "@/lib/queries/comprobantes";
import { formatPeriodoLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ estado?: ComprobanteEstado | "todos" }>;
}

export default async function ComprobantesPage({ searchParams }: PageProps) {
  const { estado = "pendiente" } = await searchParams;

  const [kpis, comprobantes, periodos] = await Promise.all([
    getComprobantesKpis(),
    getComprobantesByEstado(estado, 100),
    getComprobantesPeriodoOptions(),
  ]);
  const defaultPeriodo = getCurrentPeriodo();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl sm:text-4xl text-alebrijes-black tracking-wide">
          Comprobantes
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bandeja de validación de pagos recibidos por WhatsApp
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <KpiMini label="Pendientes" value={kpis.pendientes} icon={Clock} tone="warning" href="/dashboard/comprobantes?estado=pendiente" active={estado === "pendiente"} />
        <KpiMini label="Validados" value={kpis.validados} icon={CheckCircle2} tone="success" href="/dashboard/comprobantes?estado=validado" active={estado === "validado"} />
        <KpiMini label="Rechazados" value={kpis.rechazados} icon={XCircle} tone="danger" href="/dashboard/comprobantes?estado=rechazado" active={estado === "rechazado"} />
      </div>

      {/* Filtros tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        <EstadoTab href="/dashboard/comprobantes" label="Todos" count={kpis.total} active={estado === "todos" || !estado} />
        <EstadoTab href="/dashboard/comprobantes?estado=pendiente" label="Pendientes" count={kpis.pendientes} active={estado === "pendiente"} tone="warning" />
        <EstadoTab href="/dashboard/comprobantes?estado=validado" label="Validados" count={kpis.validados} active={estado === "validado"} tone="success" />
        <EstadoTab href="/dashboard/comprobantes?estado=rechazado" label="Rechazados" count={kpis.rechazados} active={estado === "rechazado"} tone="danger" />
      </div>

      {/* Lista */}
      {comprobantes.length === 0 ? (
        <EmptyState estado={estado} />
      ) : (
        <div className="space-y-3">
          {comprobantes.map((c) => (
            <ComprobanteCard
              key={c.id}
              comprobante={c}
              periodos={periodos}
              defaultPeriodo={defaultPeriodo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KpiMini({
  label,
  value,
  icon: Icon,
  tone,
  href,
  active,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "warning" | "success" | "danger";
  href: string;
  active?: boolean;
}) {
  const toneClass = {
    warning: "border-alebrijes-warning/30 bg-alebrijes-warning/5 text-alebrijes-warning",
    success: "border-alebrijes-success/30 bg-alebrijes-success/5 text-alebrijes-success",
    danger: "border-alebrijes-red/30 bg-alebrijes-red/5 text-alebrijes-red",
  }[tone];
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 p-4 rounded-lg border bg-white transition-colors hover:bg-zinc-50 ${
        active ? "ring-2 ring-alebrijes-orange/20 border-alebrijes-orange/40" : "border-zinc-200"
      }`}
    >
      <div className={`shrink-0 rounded-lg p-2 ${toneClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-heading tracking-tight text-alebrijes-black">{value}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </Link>
  );
}

function EstadoTab({
  href,
  label,
  count,
  active,
  tone,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
  tone?: "warning" | "success" | "danger";
}) {
  const activeColor = tone === "warning"
    ? "border-alebrijes-warning bg-alebrijes-warning text-white"
    : tone === "success"
    ? "border-alebrijes-success bg-alebrijes-success text-white"
    : tone === "danger"
    ? "border-alebrijes-red bg-alebrijes-red text-white"
    : "border-alebrijes-orange bg-alebrijes-orange text-white";
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
        active
          ? activeColor
          : "border-zinc-200 bg-white hover:bg-zinc-50"
      }`}
    >
      {label}
      <span className={`text-xs ${active ? "" : "text-muted-foreground"}`}>
        {count}
      </span>
    </Link>
  );
}

function EmptyState({ estado }: { estado: ComprobanteEstado | "todos" }) {
  const messages: Record<string, { title: string; description: string; icon: typeof Clock }> = {
    pendiente: {
      title: "Sin comprobantes pendientes",
      description: "Todos los comprobantes recibidos han sido revisados.",
      icon: CheckCircle2,
    },
    validado: {
      title: "Aún no hay comprobantes validados",
      description: "Cuando valides un comprobante aparecerá aquí.",
      icon: CheckCircle2,
    },
    rechazado: {
      title: "Sin comprobantes rechazados",
      description: "Cuando rechaces un comprobante aparecerá aquí.",
      icon: XCircle,
    },
    todos: {
      title: "Sin comprobantes",
      description: "Cuando un cliente envíe un comprobante por WhatsApp aparecerá aquí.",
      icon: Inbox,
    },
  };
  const m = messages[estado] ?? messages.todos;
  const Icon = m.icon;
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
          <Icon className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-heading text-xl text-alebrijes-black tracking-wide">
          {m.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          {m.description}
        </p>
      </CardContent>
    </Card>
  );
}
