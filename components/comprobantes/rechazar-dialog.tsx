"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { rechazarComprobanteAction } from "@/lib/actions/comprobantes";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comprobanteId: string;
  clienteNombre: string;
}

export function RechazarDialog({ open, onOpenChange, comprobanteId, clienteNombre }: Props) {
  const router = useRouter();
  const [motivo, setMotivo] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!motivo.trim()) {
      setServerError("Indica el motivo del rechazo");
      return;
    }
    startTransition(async () => {
      const result = await rechazarComprobanteAction({
        comprobanteId,
        motivo,
      });
      if (result.ok) {
        toast.success(`Comprobante de ${clienteNombre} rechazado`);
        if (result.error) {
          toast.warning(result.error, { duration: 6000 });
        }
        onOpenChange(false);
        setMotivo("");
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
          <DialogTitle className="flex items-center gap-2 text-alebrijes-red">
            <XCircle className="w-5 h-5" /> Rechazar comprobante
          </DialogTitle>
          <DialogDescription>
            Indica el motivo del rechazo de <strong>{clienteNombre}</strong>.
            Se le notificará por WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea
              id="motivo"
              rows={4}
              placeholder="Ej. La imagen no es legible / El monto no coincide / Ya no aplica este periodo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={500}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {motivo.length}/500
            </p>
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
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-alebrijes-red hover:bg-alebrijes-red/90 text-white"
            >
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rechazando...
                </>
              ) : (
                "Sí, rechazar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
