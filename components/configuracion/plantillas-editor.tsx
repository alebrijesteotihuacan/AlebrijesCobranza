"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Loader2, MessageSquare, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { updatePlantillaAction } from "@/lib/actions/configuracion";

export interface Plantilla {
  id: string;
  offset_dias: number;
  plantilla: string;
  activo: boolean;
  updated_at: string;
}

const OFFSET_LABEL: Record<number, string> = {
  [-3]: "Recordatorio · 3 días antes",
  [-1]: "Recordatorio · 1 día antes",
  [0]:  "Día de pago",
  [1]:  "Atraso · 1 día",
  [3]:  "Atraso · 3 días",
  [7]:  "Atraso · 7 días",
  [998]: "Pago rechazado",
  [999]: "Pago validado",
};

const VARIABLES = [
  { name: "nombre",     desc: "Nombre del cliente" },
  { name: "monto",      desc: "Monto de la mensualidad" },
  { name: "dia_pago",   desc: "Día de pago (15 o 30)" },
  { name: "periodo",    desc: "Periodo del pago (YYYY-MM)" },
  { name: "categoria",  desc: "Categoría del cliente" },
  { name: "info_pago",  desc: "Información bancaria (config arriba)" },
];

function offsetLabel(o: number) {
  return OFFSET_LABEL[o] ?? `Offset ${o}`;
}

export function PlantillasEditor({ plantillas: initial }: { plantillas: Plantilla[] }) {
  const [plantillas, setPlantillas] = useState(initial);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  function toggleOpen(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Plantillas de mensaje
        </CardTitle>
        <CardDescription>
          Personaliza los textos de los WhatsApp automáticos.
          Usa <code className="text-xs bg-zinc-100 px-1 rounded">{"{{variable}}"}</code> para insertar datos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {plantillas.map((p) => (
          <PlantillaItem
            key={p.id}
            plantilla={p}
            isOpen={openIds.has(p.id)}
            onToggle={() => toggleOpen(p.id)}
            onUpdate={(updated) => {
              setPlantillas((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
            }}
          />
        ))}

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-alebrijes-black select-none">
            Ver variables disponibles
          </summary>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-3 rounded-md bg-zinc-50 border border-zinc-200">
            {VARIABLES.map((v) => (
              <div key={v.name} className="flex items-baseline gap-1.5">
                <code className="text-[10px] bg-alebrijes-orange/10 text-alebrijes-orange px-1 rounded font-mono">
                  {`{{${v.name}}}`}
                </code>
                <span className="text-muted-foreground">{v.desc}</span>
              </div>
            ))}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

function PlantillaItem({
  plantilla: initial,
  isOpen,
  onToggle,
  onUpdate,
}: {
  plantilla: Plantilla;
  isOpen: boolean;
  onToggle: () => void;
  onUpdate: (p: Plantilla) => void;
}) {
  const [plantilla, setPlantilla] = useState(initial.plantilla);
  const [activo, setActivo] = useState(initial.activo);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = plantilla !== initial.plantilla || activo !== initial.activo;

  function onSave() {
    setServerError(null);
    startTransition(async () => {
      const result = await updatePlantillaAction(initial.id, { plantilla, activo });
      if (result.ok) {
        toast.success(`Plantilla "${initial.id}" guardada`);
        onUpdate({ ...initial, plantilla, activo, updated_at: new Date().toISOString() });
      } else {
        setServerError(result.error ?? "Error");
        toast.error(result.error ?? "Error");
      }
    });
  }

  function handleReset() {
    setPlantilla(initial.plantilla);
    setActivo(initial.activo);
    setServerError(null);
  }

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="rounded-lg border border-zinc-200 bg-white">
        <CollapsibleTrigger
          render={
            <button
              type="button"
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-zinc-50/50 rounded-lg"
            >
              <div className="shrink-0 rounded-md p-1.5 bg-alebrijes-orange/10 text-alebrijes-orange">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{offsetLabel(initial.offset_dias)}</p>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {initial.id}
                  </Badge>
                  {!activo && (
                    <Badge variant="secondary" className="text-[10px]">Inactiva</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {plantilla.slice(0, 80)}{plantilla.length > 80 ? "..." : ""}
                </p>
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          }
        />
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 space-y-3 border-t border-zinc-100">
            <div className="space-y-1.5">
              <Label htmlFor={`p-${initial.id}`} className="text-xs">Plantilla</Label>
              <Textarea
                id={`p-${initial.id}`}
                value={plantilla}
                onChange={(e) => setPlantilla(e.target.value)}
                rows={5}
                maxLength={2000}
                disabled={pending}
                className="font-sans text-sm"
              />
              <p className="text-xs text-muted-foreground text-right">
                {plantilla.length}/2000
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <Switch
                  id={`a-${initial.id}`}
                  checked={activo}
                  onCheckedChange={setActivo}
                  disabled={pending}
                />
                <Label htmlFor={`a-${initial.id}`} className="text-sm cursor-pointer">
                  {activo ? "Activa" : "Inactiva"}
                </Label>
              </div>
            </div>

            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {dirty && (
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={pending}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={onSave}
                  disabled={pending}
                  className="bg-alebrijes-orange hover:bg-alebrijes-orange-dark text-white"
                >
                  {pending ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-3.5 w-3.5" /> Guardar
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
