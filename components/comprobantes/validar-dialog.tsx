"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2, MessageCircle, Save } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validarComprobanteAction } from "@/lib/actions/comprobantes";
import { formatMXN, formatPeriodoLabel } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comprobanteId: string;
  clienteNombre: string;
  clienteMonto: number;
  periodos: string[];
  defaultPeriodo: string;
}

interface FormValues {
  periodo: string;
  notas: string;
}

export function ValidarDialog({
  open,
  onOpenChange,
  comprobanteId,
  clienteNombre,
  clienteMonto,
  periodos,
  defaultPeriodo,
}: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(
      require("@/lib/validations").pagoSchema.pick({ periodo: true }),
    ) as never,
    defaultValues: { periodo: defaultPeriodo, notas: "" },
  });

  const periodo = watch("periodo");

  function onSubmit(values: FormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await validarComprobanteAction({
        comprobanteId,
        periodo: values.periodo,
        notas: values.notas || undefined,
      });
      if (result.ok) {
        toast.success(`Pago de ${clienteNombre} validado ✓`);
        if (result.error) {
          toast.warning(result.error, { duration: 6000 });
        }
        onOpenChange(false);
        router.refresh();
      } else {
        setServerError(result.error ?? "Error");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-alebrijes-success">
            <CheckCircle2 className="w-5 h-5" /> Validar comprobante
          </DialogTitle>
          <DialogDescription>
            Confirma el pago de <strong>{clienteNombre}</strong> por{" "}
            <strong>{formatMXN(clienteMonto)}</strong>. Se registrará un pago y se
            enviará un WhatsApp de confirmación.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Periodo *</Label>
            <Select
              value={periodo}
              onValueChange={(v) => setValue("periodo", v ?? defaultPeriodo, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodos.map((p) => (
                  <SelectItem key={p} value={p}>
                    {formatPeriodoLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.periodo && (
              <p className="text-sm text-alebrijes-red">{errors.periodo.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Input
              id="notas"
              placeholder="Ej. Pago completo del mes"
              {...register("notas")}
            />
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <MessageCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              Se enviará un WhatsApp al cliente confirmando que su pago fue validado.
            </AlertDescription>
          </Alert>

          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-alebrijes-success hover:bg-alebrijes-success/90 text-white"
            >
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Confirmar validación
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
