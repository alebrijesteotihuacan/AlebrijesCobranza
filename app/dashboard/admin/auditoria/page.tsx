import { Clock, FileText, ScrollText, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { getAuditKpis, getAuditLog } from "@/lib/queries/audit";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACTION_COLORS: Record<string, string> = {
  "cliente.create": "bg-alebrijes-success/15 text-alebrijes-success border-alebrijes-success/30",
  "cliente.update": "bg-alebrijes-orange/15 text-alebrijes-orange border-alebrijes-orange/30",
  "cliente.soft_delete": "bg-alebrijes-red/15 text-alebrijes-red border-alebrijes-red/30",
  "cliente.reactivate": "bg-alebrijes-success/15 text-alebrijes-success border-alebrijes-success/30",
  "comprobante.validate": "bg-alebrijes-success/15 text-alebrijes-success border-alebrijes-success/30",
  "comprobante.reject": "bg-alebrijes-red/15 text-alebrijes-red border-alebrijes-red/30",
  "config.update_info_pago": "bg-alebrijes-orange/15 text-alebrijes-orange border-alebrijes-orange/30",
  "config.update_plantilla": "bg-alebrijes-orange/15 text-alebrijes-orange border-alebrijes-orange/30",
  "admin.invite": "bg-blue-500/15 text-blue-600 border-blue-500/30",
  "admin.ban": "bg-alebrijes-red/15 text-alebrijes-red border-alebrijes-red/30",
  "admin.unban": "bg-alebrijes-success/15 text-alebrijes-success border-alebrijes-success/30",
};

function actionColor(action: string): string {
  return ACTION_COLORS[action] ?? "bg-zinc-100 text-zinc-700 border-zinc-200";
}

function actionLabel(action: string): string {
  return action.replace(/\./g, " · ");
}

export default async function AuditoriaPage() {
  const [{ entries, total }, kpis] = await Promise.all([
    getAuditLog({ limit: 100 }),
    getAuditKpis(),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-heading text-3xl sm:text-4xl text-alebrijes-black tracking-wide flex items-center gap-2">
          <Shield className="w-7 h-7" /> Auditoría
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Log de acciones del administrador (append-only)
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <KpiCard label="Eventos totales" value={kpis.total} icon={ScrollText} tone="info" />
        <KpiCard label="Últimas 24h" value={kpis.last24h} icon={Clock} tone="neutral" />
        <KpiCard label="Mostrados" value={entries.length} icon={FileText} tone="orange" />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos {entries.length} eventos</CardTitle>
          <CardDescription>
            Mostrando los más recientes primero · Total en sistema: {total}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {entries.length === 0 ? (
            <div className="px-6 pb-6 text-center text-sm text-muted-foreground">
              No hay eventos registrados aún.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground border-y border-zinc-200">
                    <th className="text-left font-medium px-3 py-2.5">Cuándo</th>
                    <th className="text-left font-medium px-3 py-2.5">Quién</th>
                    <th className="text-left font-medium px-3 py-2.5">Acción</th>
                    <th className="text-left font-medium px-3 py-2.5 hidden md:table-cell">Recurso</th>
                    <th className="text-left font-medium px-3 py-2.5 hidden lg:table-cell">Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => {
                    const detailKeys = Object.keys(e.details ?? {});
                    return (
                      <tr key={e.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50">
                        <td className="px-3 py-2.5 whitespace-nowrap text-xs">
                          <div className="font-medium">{formatRelativeTime(e.created_at)}</div>
                          <div className="text-muted-foreground text-[10px]">
                            {new Date(e.created_at).toLocaleString("es-MX", {
                              day: "2-digit", month: "2-digit", year: "2-digit",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs">
                          <div className="font-mono truncate max-w-[200px]">
                            {e.user_email ?? "(sin sesión)"}
                          </div>
                          {e.ip && (
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {e.ip}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className={`text-[10px] ${actionColor(e.action)}`}>
                            {actionLabel(e.action)}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 hidden md:table-cell text-xs">
                          <div>{e.resource}</div>
                          {e.resource_id && (
                            <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[160px]">
                              {e.resource_id}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 hidden lg:table-cell text-xs">
                          {detailKeys.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <pre className="text-[10px] bg-zinc-50 px-2 py-1 rounded max-w-[300px] overflow-x-auto">
                              {JSON.stringify(e.details, null, 0)}
                            </pre>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
