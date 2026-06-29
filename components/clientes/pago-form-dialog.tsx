"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { pagoSchema, type ClienteFormValues } from "@/lib/validations";
import { registrarPagoAction } from "@/lib/actions/pagos";
import { getCurrentPeriodo, formatPeriodoLabel } from "@/lib/utils";

interface Props {
  clienteId: string;
  clienteNombre: string;
  defaultMonto: number;
}

type PagoFormValues = {
  periodo: string;
  monto: number;
  metodo?: string | null;
  notas?: string | null;
};

export function PagoFormDialog({ clienteId, clienteNombre, defaultMonto }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PagoFormValues>({
    resolver: zodResolver(pagoSchema) as never,
    defaultValues: {
      periodo: getCurrentPeriodo(),
      monto: defaultMonto,
      metodo: "manual",
      notas: "",
    },
  });

  function onSubmit(values: PagoFormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await registrarPagoAction({
        cliente_id: clienteId,
        ...values,
      });
      if (result.ok) {
        toast.success(`Pago de ${clienteNombre} registrado`);
        reset({ periodo: getCurrentPeriodo(), monto: defaultMonto, metodo: "manual", notas: "" });
        setOpen(false);
        router.refresh();
      } else {
        setServerError(result.error ?? "Error");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-alebrijes-orange hover:bg-alebrijes-orange-dark text-white w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-1" /> Registrar pago
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Registra un pago manual para <strong>{clienteNombre}</strong>.
            El cliente dejará de recibir recordatorios de atraso para este periodo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="periodo">Periodo *</Label>
            <Input
              id="periodo"
              placeholder="2026-06"
              maxLength={7}
              {...register("periodo")}
              aria-invalid={!!errors.periodo}
            />
            <p className="text-xs text-muted-foreground">
              Formato YYYY-MM. Default: {formatPeriodoLabel(getCurrentPeriodo())}
            </p>
            {errors.periodo && (
              <p className="text-sm text-alebrijes-red">{errors.periodo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="monto">Monto (MXN) *</Label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              min="0"
              {...register("monto", { valueAsNumber: true })}
              aria-invalid={!!errors.monto}
            />
            {errors.monto && (
              <p className="text-sm text-alebrijes-red">{errors.monto.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodo">Método</Label>
            <Input
              id="metodo"
              placeholder="manual, efectivo, transferencia..."
              {...register("metodo")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Input
              id="notas"
              placeholder="Opcional"
              {...register("notas")}
            />
          </div>

          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-alebrijes-success hover:bg-alebrijes-success/90 text-white"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                "Registrar pago"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
