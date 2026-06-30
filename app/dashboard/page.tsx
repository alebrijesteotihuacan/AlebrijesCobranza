import Link from "next/link";
import {
  Banknote,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Inbox,
  Users,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  getDashboardKpis,
  getMorososList,
  getPorVencerList,
} from "@/lib/queries/dashboard";
import { getClientes } from "@/lib/queries/clientes";
import { formatMXN, formatWhatsApp, formatRelativeTime } from "@/lib/utils";
import type { Cliente } from "@/lib/queries/clientes";
import type { KpiSnapshot, MorosoItem, PorVencerItem } from "@/lib/queries/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Defensive: if SUPABASE_SERVICE_ROLE_KEY is missing, queries throw.
  // Show empty dashboard instead of 500 page so the user can see the warning.
  let kpis: KpiSnapshot;
  let morosos: MorosoItem[];
  let porVencer: PorVencerItem[];
  let allClientes: Cliente[] = [];
  let queryError: string | null = null;
  try {
    [kpis, morosos, porVencer, allClientes] = await Promise.all([
      getDashboardKpis(),
      getMorososList(5),
      getPorVencerList(5),
      getClientes({ includeInactive: true }),
    ]);
  } catch (e) {
    console.error("Dashboard query failed:", e);
    queryError = e instanceof Error ? e.message : "Unknown error";
    kpis = {
      periodo: new Date().toISOString().slice(0, 7),
      periodoLabel: new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" }),
      cobrado: 0,
      pagosCount: 0,
      morososCount: 0,
      porVencerCount: 0,
      pendientesCount: 0,
      totalClientesActivos: 0,
    };
    morosos = [];
    porVencer = [];
  }

  const recientes = allClientes.slice(0, 5);
  const cobranzaRatio = kpis.totalClientesActivos > 0
    ? Math.round((kpis.pagosCount / kpis.totalClientesActivos) * 100)
    : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {queryError && (
        <div className="rounded-lg border border-alebrijes-red/30 bg-alebrijes-red/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-alebrijes-red shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-alebrijes-red">No se pudieron cargar los datos</p>
              <p className="text-sm text-zinc-700 mt-1">
                Probablemente falta la variable <code className="font-mono text-xs bg-zinc-100 px-1 py-0.5 rounded">SUPABASE_SERVICE_ROLE_KEY</code> en Vercel o en <code className="font-mono text-xs bg-zinc-100 px-1 py-0.5 rounded">.env.local</code>.
              </p>
              <p className="text-xs text-zinc-600 mt-2 font-mono break-all">{queryError}</p>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl text-alebrijes-black tracking-wide">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            Resumen de <strong className="capitalize text-alebrijes-black">{kpis.periodoLabel}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            render={<Link href="/dashboard/reportes" />}
          >
            Ver reportes completos
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        <KpiCard
          label="Cobrado del mes"
          value={formatMXN(kpis.cobrado)}
          hint={`${kpis.pagosCount} de ${kpis.totalClientesActivos} clientes · ${cobranzaRatio}%`}
          icon={Banknote}
          tone="orange"
          emphasis
          href="/dashboard/reportes"
        />
        <KpiCard
          label="Pagos del mes"
          value={kpis.pagosCount}
          hint={`${kpis.totalClientesActivos} clientes activos`}
          icon={CheckCircle2}
          tone="success"
          href="/dashboard/clientes"
        />
        <KpiCard
          label="Morosos"
          value={kpis.morososCount}
          hint={kpis.morososCount > 0 ? "Requieren seguimiento" : "Al día"}
          icon={AlertTriangle}
          tone="danger"
          href="/dashboard/clientes"
        />
        <KpiCard
          label="Por vencer"
          value={kpis.porVencerCount}
          hint="Próximos 3 días"
          icon={Clock}
          tone="warning"
          href="/dashboard/clientes"
        />
        <KpiCard
          label="Comprobantes"
          value={kpis.pendientesCount}
          hint={kpis.pendientesCount > 0 ? "Por validar" : "Sin pendientes"}
          icon={Inbox}
          tone="info"
          href="/dashboard/comprobantes"
        />
      </div>

      {/* Two-column section: Action lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Morosos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-alebrijes-red">
                <AlertTriangle className="w-4 h-4" />
                Morosos ({kpis.morososCount})
              </CardTitle>
              <CardDescription>Clientes con atraso en este periodo</CardDescription>
            </div>
            {morosos.length > 0 && (
              <Button variant="ghost" size="sm" render={<Link href="/dashboard/clientes" />}>
                Ver todos
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {morosos.length === 0 ? (
              <EmptyList message="¡Sin morosos! Todos los clientes están al día." tone="success" />
            ) : (
              <ul className="space-y-2">
                {morosos.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/dashboard/clientes/${m.id}`}
                      className="flex items-center justify-between gap-3 p-2.5 -mx-2.5 rounded-md hover:bg-zinc-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{m.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          día {m.dia_pago} · {formatMXN(m.monto)}
                        </p>
                      </div>
                      <Badge variant="destructive" className="shrink-0">
                        {m.diasAtraso}d atraso
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Por vencer */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-alebrijes-warning">
                <Clock className="w-4 h-4" />
                Por vencer ({kpis.porVencerCount})
              </CardTitle>
              <CardDescription>Próximos 3 días sin pago</CardDescription>
            </div>
            {porVencer.length > 0 && (
              <Button variant="ghost" size="sm" render={<Link href="/dashboard/clientes" />}>
                Ver todos
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {porVencer.length === 0 ? (
              <EmptyList message="Sin vencimientos próximos en los siguientes 3 días." tone="neutral" />
            ) : (
              <ul className="space-y-2">
                {porVencer.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/clientes/${c.id}`}
                      className="flex items-center justify-between gap-3 p-2.5 -mx-2.5 rounded-md hover:bg-zinc-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{c.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          día {c.dia_pago} · {formatMXN(c.monto)}
                        </p>
                      </div>
                      <Badge className="shrink-0 bg-alebrijes-warning/15 text-alebrijes-warning border-alebrijes-warning/30">
                        en {c.diasParaVencer}d
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clientes recientes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clientes recientes
            </CardTitle>
            <CardDescription>Últimos 5 modificados o agregados</CardDescription>
          </div>
          <Button variant="ghost" size="sm" render={<Link href="/dashboard/clientes" />}>
            Ver todos
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {recientes.length === 0 ? (
            <div className="px-6 pb-6 text-sm text-muted-foreground text-center">
              Aún no hay clientes registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground border-y border-zinc-200">
                    <th className="text-left font-medium px-6 py-2.5">Nombre</th>
                    <th className="text-left font-medium px-3 py-2.5 hidden sm:table-cell">WhatsApp</th>
                    <th className="text-center font-medium px-3 py-2.5">Día</th>
                    <th className="text-right font-medium px-3 py-2.5">Monto</th>
                    <th className="text-right font-medium px-3 py-2.5 hidden md:table-cell">Actualizado</th>
                    <th className="text-right font-medium px-6 py-2.5 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {recientes.map((c) => (
                    <ClienteRow key={c.id} cliente={c} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ClienteRow({ cliente: c }: { cliente: Cliente }) {
  return (
    <tr className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors">
      <td className="px-6 py-3">
        <Link
          href={`/dashboard/clientes/${c.id}`}
          className="font-medium hover:text-alebrijes-orange hover:underline"
        >
          {c.nombre}
        </Link>
        {!c.activo && (
          <Badge variant="secondary" className="ml-2 text-[10px]">Inactivo</Badge>
        )}
      </td>
      <td className="px-3 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">
        {formatWhatsApp(c.whatsapp)}
      </td>
      <td className="px-3 py-3 text-center">
        <Badge variant="secondary" className="font-mono">día {c.dia_pago}</Badge>
      </td>
      <td className="px-3 py-3 text-right font-mono">{formatMXN(c.monto)}</td>
      <td className="px-3 py-3 text-right text-xs text-muted-foreground hidden md:table-cell">
        {formatRelativeTime(c.updated_at)}
      </td>
      <td className="px-6 py-3 text-right">
        <Link
          href={`/dashboard/clientes/${c.id}`}
          className="inline-flex items-center text-muted-foreground hover:text-alebrijes-orange"
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      </td>
    </tr>
  );
}

function EmptyList({ message, tone }: { message: string; tone: "success" | "neutral" }) {
  return (
    <div
      className={
        tone === "success"
          ? "rounded-md bg-alebrijes-success/5 border border-alebrijes-success/20 p-3 text-sm text-alebrijes-success text-center"
          : "text-sm text-muted-foreground text-center py-4"
      }
    >
      {message}
    </div>
  );
}
