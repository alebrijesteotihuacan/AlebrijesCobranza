"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { clienteSchema, type ClienteFormValues } from "@/lib/validations";
import { createClienteAction, updateClienteAction } from "@/lib/actions/clientes";
import type { Cliente } from "@/lib/queries/clientes";

interface Props {
  mode: "create" | "edit";
  cliente?: Cliente;
}

export function ClienteForm({ mode, cliente }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const defaultValues: ClienteFormValues = {
    nombre: cliente?.nombre ?? "",
    whatsapp: cliente?.whatsapp ?? "",
    dia_pago: (cliente?.dia_pago ?? 15) as 15 | 30,
    monto: cliente?.monto ?? 0,
    categoria: cliente?.categoria ?? null,
    notas: cliente?.notas ?? null,
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema) as never,
    defaultValues,
    mode: "onBlur",
  });

  const diaPago = watch("dia_pago");

  function onSubmit(values: ClienteFormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = mode === "create"
        ? await createClienteAction(values)
        : await updateClienteAction(cliente!.id, values);

      if (result.ok) {
        toast.success(mode === "create" ? "Cliente creado" : "Cliente actualizado");
        router.push("/dashboard/clientes");
        router.refresh();
      } else {
        setServerError(result.error ?? "Error desconocido");
        toast.error(result.error ?? "Error");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          render={<Link href="/dashboard/clientes" />}
          aria-label="Volver"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-heading text-3xl text-alebrijes-black tracking-wide">
            {mode === "create" ? "Nuevo cliente" : "Editar cliente"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "create"
              ? "Registra un jugador o tutor para enviarle recordatorios de pago"
              : "Modifica los datos del cliente"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos básicos</CardTitle>
          <CardDescription>Información del cliente que recibirá los recordatorios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo *</Label>
            <Input
              id="nombre"
              placeholder="Ej. Juan Pérez Hernández"
              {...register("nombre")}
              aria-invalid={!!errors.nombre}
            />
            {errors.nombre && (
              <p className="text-sm text-alebrijes-red">{errors.nombre.message}</p>
            )}
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp *</Label>
            <Input
              id="whatsapp"
              placeholder="5215512345678"
              maxLength={12}
              {...register("whatsapp")}
              aria-invalid={!!errors.whatsapp}
            />
            <p className="text-xs text-muted-foreground">
              52 (lada México) + 10 dígitos. Sin espacios ni signo +.
            </p>
            {errors.whatsapp && (
              <p className="text-sm text-alebrijes-red">{errors.whatsapp.message}</p>
            )}
          </div>

          {/* Día de pago + Monto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Día de pago *</Label>
              <div className="grid grid-cols-2 gap-2">
                {[15, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setValue("dia_pago", d as 15 | 30, { shouldValidate: true })}
                    className={`h-12 rounded-md border-2 font-medium transition-colors ${
                      diaPago === d
                        ? "border-alebrijes-orange bg-alebrijes-orange/5 text-alebrijes-black"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    Día {d}
                  </button>
                ))}
              </div>
              {errors.dia_pago && (
                <p className="text-sm text-alebrijes-red">{errors.dia_pago.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto">Monto mensual (MXN) *</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0"
                placeholder="500.00"
                {...register("monto", { valueAsNumber: true })}
                aria-invalid={!!errors.monto}
              />
              {errors.monto && (
                <p className="text-sm text-alebrijes-red">{errors.monto.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos opcionales</CardTitle>
          <CardDescription>Para mejor organización y seguimiento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría</Label>
            <Input
              id="categoria"
              placeholder="Ej. Sub-15, Sub-17, Varonil"
              {...register("categoria")}
            />
            {errors.categoria && (
              <p className="text-sm text-alebrijes-red">{errors.categoria.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              rows={3}
              placeholder="Notas adicionales sobre el cliente..."
              {...register("notas")}
            />
            {errors.notas && (
              <p className="text-sm text-alebrijes-red">{errors.notas.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          render={<Link href="/dashboard/clientes" />}
          disabled={pending || isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-alebrijes-orange hover:bg-alebrijes-orange-dark text-white"
          disabled={pending || isSubmitting}
        >
          {pending || isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />{" "}
              {mode === "create" ? "Crear cliente" : "Guardar cambios"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
