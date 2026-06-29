"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Save,
  Type as TypeIcon,
} from "lucide-react";
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
import { pagoSchema } from "@/lib/validations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comprobanteId: string;
  clienteNombre: string;
  clienteMonto: number;
  periodos: string[];
  defaultPeriodo: string;
  // Preview data
  previewUrl?: string | null;
  previewTipo?: "image" | "document" | "text";
  previewTexto?: string | null;
  caption?: string | null;
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
  previewUrl = null,
  previewTipo = "text",
  previewTexto = null,
  caption = null,
}: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(pagoSchema.pick({ periodo: true })) as never,
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

        {/* 7.2.2.1 — Preview del comprobante */}
        <ComprobantePreview
          tipo={previewTipo}
          url={previewUrl}
          texto={previewTexto}
          caption={caption}
        />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 7.2.2.2 — Selector de periodo (default: mes actual) */}
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

          {/* 7.2.2.3 — Notas opcionales */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Input
              id="notas"
              placeholder="Ej. Pago completo del mes"
              {...register("notas")}
              maxLength={500}
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

          {/* 7.2.2.4 — Botones Cancelar / Validar */}
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

/** 7.2.2.1 — Mini preview of the comprobante inside the dialog */
function ComprobantePreview({
  tipo,
  url,
  texto,
  caption,
}: {
  tipo: "image" | "document" | "text";
  url: string | null | undefined;
  texto: string | null | undefined;
  caption: string | null | undefined;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 overflow-hidden">
      <div className="flex items-stretch">
        {/* Thumbnail */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-zinc-100 flex items-center justify-center">
          {tipo === "image" && url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Comprobante" className="absolute inset-0 w-full h-full object-cover" />
          ) : tipo === "document" ? (
            <div className="flex flex-col items-center gap-1 text-zinc-600">
              <FileText className="w-6 h-6" />
              <span className="text-[10px] font-medium">PDF</span>
            </div>
          ) : tipo === "text" ? (
            <div className="p-2 text-[10px] text-zinc-700 italic line-clamp-5 text-center">
              {texto ? `"${texto.slice(0, 60)}${texto.length > 60 ? "..." : ""}"` : "(sin texto)"}
            </div>
          ) : (
            <TypeIcon className="w-6 h-6 text-zinc-400" />
          )}
        </div>
        {/* Text content */}
        <div className="flex-1 p-3 min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {tipo === "image" ? "Imagen" : tipo === "document" ? "PDF" : "Texto"}
          </p>
          {caption && (
            <p className="text-sm mt-1 line-clamp-2 italic text-zinc-700">"{caption}"</p>
          )}
          {tipo === "text" && texto && !caption && (
            <p className="text-sm mt-1 line-clamp-3 italic text-zinc-700">"{texto}"</p>
          )}
          {url && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 mt-1 text-xs"
              render={
                <a href={url} target="_blank" rel="noopener noreferrer" />
              }
            >
              <ExternalLink className="w-3 h-3 mr-1" /> Ver completo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
