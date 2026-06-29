import Link from "next/link";
import { MessageCircleWarning, Phone, Trash2, UserPlus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DesconocidoCard } from "@/components/desconocidos/desconocido-card";
import {
  getMensajesDesconocidos,
  getDesconocidosKpis,
} from "@/lib/queries/desconocidos";
import { ignorarTodosDesconocidosAction } from "@/lib/actions/desconocidos";

export const dynamic = "force-dynamic";

export default async function DesconocidosPage() {
  const [mensajes, kpis] = await Promise.all([
    getMensajesDesconocidos(100),
    getDesconocidosKpis(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl text-alebrijes-black tracking-wide">
            Números desconocidos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mensajes recibidos de números no registrados como clientes
          </p>
        </div>
        {kpis.total > 0 && (
          <form
            action={async () => {
              "use server";
              await ignorarTodosDesconocidosAction();
            }}
          >
            <Button
              type="submit"
              variant="outline"
              className="text-zinc-600"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Ignorar todos
            </Button>
          </form>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <KpiMini label="Total" value={kpis.total} />
        <KpiMini label="Últimas 24h" value={kpis.ult24h} highlight={kpis.ult24h > 0} />
        <KpiMini label="Últimos 7 días" value={kpis.ult7d} />
      </div>

      {/* Lista */}
      {mensajes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-alebrijes-success">
              <Phone className="w-4 h-4" />
              Sin números desconocidos
            </CardTitle>
            <CardDescription>
              Todos los mensajes recibidos corresponden a clientes registrados.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircleWarning className="w-4 h-4 text-alebrijes-warning" />
            <span>
              {mensajes.length} mensaje{mensajes.length === 1 ? "" : "s"} de números no registrados
            </span>
          </div>
          {mensajes.map((m) => (
            <DesconocidoCard key={m.id} mensaje={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function KpiMini({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? "border-alebrijes-warning/30 bg-alebrijes-warning/5"
          : "border-zinc-200 bg-white"
      }`}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p
        className={`text-2xl font-heading tracking-tight ${
          highlight ? "text-alebrijes-warning" : "text-alebrijes-black"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
