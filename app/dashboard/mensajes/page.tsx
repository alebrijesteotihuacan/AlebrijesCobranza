import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessagesSquare, CheckCircle2, XCircle, Activity } from "lucide-react";
import { MensajesTable } from "@/components/mensajes/mensajes-table";
import {
  getMensajesEnviados,
  countMensajesEnviados,
  getMensajesKpis,
  getPeriodosFromMensajes,
  type MensajesFiltros,
} from "@/lib/queries/mensajes-enviados";
import { getClientes } from "@/lib/queries/clientes";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{
    cliente?: string;
    periodo?: string;
    estado?: "enviado" | "fallido";
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function MensajesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filtros: MensajesFiltros = {};
  if (sp.cliente) filtros.clienteId = sp.cliente;
  if (sp.periodo) filtros.periodo = sp.periodo;
  if (sp.estado) filtros.estado = sp.estado;
  if (sp.from) filtros.from = sp.from;
  if (sp.to) filtros.to = sp.to;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [kpis, mensajes, total, clientes, periodos] = await Promise.all([
    getMensajesKpis(),
    getMensajesEnviados(filtros, { limit: PAGE_SIZE, offset }),
    countMensajesEnviados(filtros),
    getClientes({ includeInactive: false }),
    getPeriodosFromMensajes(12),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl sm:text-4xl text-alebrijes-black tracking-wide">
          Mensajes enviados
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Log de WhatsApps enviados a clientes
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <KpiMini label="Total" value={kpis.total} icon={MessagesSquare} />
        <KpiMini label="Enviados" value={kpis.enviados} icon={CheckCircle2} tone="success" />
        <KpiMini label="Fallidos" value={kpis.fallidos} icon={XCircle} tone="danger" highlight={kpis.fallidos > 0} />
        <KpiMini label="Últimas 24h" value={kpis.ult24h} icon={Activity} tone="info" />
      </div>

      {/* Table with filters */}
      <MensajesTable
        mensajes={mensajes}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        clientes={clientes.map((c) => ({ id: c.id, nombre: c.nombre, whatsapp: c.whatsapp }))}
        periodos={periodos}
        defaultPeriodo={null}
      />
    </div>
  );
}

function KpiMini({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  highlight = false,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "success" | "danger" | "info";
  highlight?: boolean;
}) {
  const toneClass = {
    neutral: "border-zinc-200 bg-white text-alebrijes-black",
    success: "border-alebrijes-success/30 bg-alebrijes-success/5 text-alebrijes-success",
    danger: "border-alebrijes-red/30 bg-alebrijes-red/5 text-alebrijes-red",
    info: "border-blue-500/30 bg-blue-500/5 text-blue-600",
  }[tone];
  const highlightClass = highlight ? "ring-2 ring-alebrijes-red/20" : "";

  return (
    <div className={`rounded-lg border p-4 ${toneClass} ${highlightClass}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider opacity-70">{label}</p>
        <Icon className="w-4 h-4 opacity-60" />
      </div>
      <p className="text-2xl font-heading tracking-tight mt-1">{value}</p>
    </div>
  );
}
