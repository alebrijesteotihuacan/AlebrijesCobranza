"use client";

import { useState } from "react";
import { Calendar, ChevronDown, ChevronUp, MessagesSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatRelativeTime, formatPeriodoLabel } from "@/lib/utils";
import type { MensajeEnviado } from "@/lib/queries/pagos";
import { cn } from "@/lib/utils";

interface Props {
  mensajes: MensajeEnviado[];
}

const OFFSET_LABEL: Record<number, string> = {
  [-3]: "Recordatorio -3 días",
  [-1]: "Recordatorio -1 día",
  [0]:  "Día de pago",
  [1]:  "Atraso 1 día",
  [3]:  "Atraso 3 días",
  [7]:  "Atraso 7 días",
  [998]: "Pago rechazado",
  [999]: "Pago validado",
};

function offsetLabel(offset: number): string {
  return OFFSET_LABEL[offset] ?? `Offset ${offset}`;
}

export function MensajesTimeline({ mensajes }: Props) {
  const [open, setOpen] = useState(true);
  const [showError, setShowError] = useState<string | null>(null);

  if (mensajes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessagesSquare className="w-4 h-4" /> Mensajes enviados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-sm text-muted-foreground">
            Aún no se han enviado mensajes a este cliente.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessagesSquare className="w-4 h-4" /> Mensajes enviados
              </CardTitle>
              <CardDescription>
                {mensajes.length} mensaje{mensajes.length === 1 ? "" : "s"} en el historial
              </CardDescription>
            </div>
            {open ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <ol className="relative border-l-2 border-zinc-200 pl-4 space-y-3 ml-2">
              {mensajes.map((m) => (
                <li key={m.id} className="relative">
                  <span
                    className={cn(
                      "absolute -left-[1.4rem] top-1.5 w-3 h-3 rounded-full border-2 border-white",
                      m.estado === "enviado"
                        ? "bg-alebrijes-success"
                        : "bg-alebrijes-red",
                    )}
                    aria-hidden
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {offsetLabel(m.offset_dias)}
                    </span>
                    <Badge
                      variant={m.estado === "enviado" ? "default" : "destructive"}
                      className={m.estado === "enviado" ? "bg-alebrijes-success/15 text-alebrijes-success border-alebrijes-success/30" : ""}
                    >
                      {m.estado}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      · {formatPeriodoLabel(m.periodo)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                    <Calendar className="w-3 h-3" />
                    {formatRelativeTime(m.enviado_at)}
                    {m.plantilla_id && (
                      <span className="font-mono">· {m.plantilla_id}</span>
                    )}
                  </div>
                  {m.estado === "fallido" && m.error && (
                    <button
                      type="button"
                      onClick={() => setShowError(showError === m.id ? null : m.id)}
                      className="text-xs text-alebrijes-red underline mt-1"
                    >
                      {showError === m.id ? "Ocultar error" : "Ver error"}
                    </button>
                  )}
                  {m.estado === "fallido" && m.error && showError === m.id && (
                    <pre className="text-xs bg-alebrijes-red/5 text-alebrijes-red p-2 rounded mt-1 overflow-x-auto">
                      {m.error}
                    </pre>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
