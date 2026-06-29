import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CobranzaChart } from "@/components/reportes/cobranza-chart";
import { ReportePeriodoSelect } from "@/components/reportes/reporte-periodo-select";
import { getReporte, buildCsvFromReporte } from "@/lib/queries/reportes";
import { formatMXN, formatWhatsApp, formatPeriodoLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ periodo?: string }>;
}

export default async function ReportesPage({ searchParams }: PageProps) {
  const { periodo } = await searchParams;
  const data = await getReporte(periodo);

  // Build CSV and a data URL for the download button
  const csv = buildCsvFromReporte(data);
  // Encode safely for data URL (handle UTF-8 and newlines)
  const csvB64 = Buffer.from(csv, "utf-8").toString("base64");
  const csvHref = `data:text/csv;charset=utf-8;base64,${csvB64}`;
  const csvFilename = `reporte-alebrijes-${data.periodo}.csv`;

  // Compute previous / next periodo for nav arrows
  const [yStr, mStr] = data.periodo.split("-");
  let y = Number(yStr);
  let m = Number(mStr);
  const prev = (() => {
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();
  const next = (() => {
    const d = new Date(y, m, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl text-alebrijes-black tracking-wide">
            Reportes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen mensual de cobranza
          </p>
        </div>
        <Button variant="outline" render={<a href={csvHref} download={csvFilename} />}>
          <Download className="w-4 h-4 mr-1" /> Exportar CSV
        </Button>
      </div>

      {/* Period selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                render={<Link href={`/dashboard/reportes?periodo=${prev}`} />}
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <ReportePeriodoSelect current={data.periodo} />
              <Button
                variant="outline"
                size="icon"
                render={<Link href={`/dashboard/reportes?periodo=${next}`} />}
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 text-center sm:text-right">
              <p className="text-lg sm:text-xl font-heading tracking-wide text-alebrijes-black capitalize">
                {formatPeriodoLabel(data.periodo)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Clientes activos"
          value={data.totalClientesActivos}
          hint={`${data.clientesPagaron} pagaron este mes`}
          icon={BarChart3}
          tone="neutral"
        />
        <KpiCard
          label="Cobrado"
          value={formatMXN(data.totalCobrado)}
          hint={`${data.porcentajeCobranza}% de cobranza`}
          icon={BarChart3}
          tone="orange"
          emphasis
        />
        <KpiCard
          label="Esperado"
          value={formatMXN(data.totalEsperado)}
          hint={`${data.totalClientesActivos} clientes × mensualidad`}
          icon={BarChart3}
          tone="info"
        />
        <KpiCard
          label="Pendiente"
          value={formatMXN(data.totalPendiente)}
          hint={`${data.morosos.length} moroso${data.morosos.length === 1 ? "" : "s"}`}
          icon={BarChart3}
          tone="danger"
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cobrado vs Pendiente por día de pago</CardTitle>
          <CardDescription>Distribución de pagos según fecha de corte del mes</CardDescription>
        </CardHeader>
        <CardContent>
          <CobranzaChart data={data.porDiaPago} />
        </CardContent>
      </Card>

      {/* Morosos table */}
      <Card>
        <CardHeader>
          <CardTitle>Morosos ({data.morosos.length})</CardTitle>
          <CardDescription>
            Clientes que no han pagado en este periodo
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {data.morosos.length === 0 ? (
            <div className="px-6 pb-6 text-center text-sm text-alebrijes-success">
              🎉 ¡Sin morosos! Todos los clientes están al día en este periodo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground border-y border-zinc-200">
                    <th className="text-left font-medium px-6 py-2.5">Cliente</th>
                    <th className="text-left font-medium px-3 py-2.5 hidden sm:table-cell">WhatsApp</th>
                    <th className="text-center font-medium px-3 py-2.5">Día</th>
                    <th className="text-right font-medium px-3 py-2.5">Monto</th>
                    <th className="text-right font-medium px-3 py-2.5">Atraso</th>
                    <th className="px-6 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {data.morosos.map((m) => (
                    <tr key={m.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50">
                      <td className="px-6 py-3 font-medium">
                        <Link href={`/dashboard/clientes/${m.id}`} className="hover:text-alebrijes-orange hover:underline">
                          {m.nombre}
                        </Link>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">
                        {formatWhatsApp(m.whatsapp)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Badge variant="secondary" className="font-mono">día {m.dia_pago}</Badge>
                      </td>
                      <td className="px-3 py-3 text-right font-mono">{formatMXN(m.monto)}</td>
                      <td className="px-3 py-3 text-right">
                        <Badge variant="destructive">
                          {m.diasAtraso}d
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          render={
                            <Link href={`/dashboard/clientes/${m.id}`} />
                          }
                        >
                          Ver
                        </Button>
                      </td>
                    </tr>
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
