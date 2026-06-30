"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateInfoPagoAction } from "@/lib/actions/configuracion";

interface Props {
  initialValue: string;
}

export function InfoPagoForm({ initialValue }: Props) {
  const [value, setValue] = useState(initialValue);
  const [originalValue, setOriginalValue] = useState(initialValue);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = value.trim() !== originalValue.trim();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    startTransition(async () => {
      const result = await updateInfoPagoAction(value);
      if (result.ok) {
        toast.success("Información de pago actualizada");
        setOriginalValue(value);
      } else {
        setServerError(result.error ?? "Error");
        toast.error(result.error ?? "Error");
      }
    });
  }

  function handleReset() {
    setValue(originalValue);
    setServerError(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="w-4 h-4" /> Información de pago
        </CardTitle>
        <CardDescription>
          Este texto se incluye automáticamente en los mensajes de &ldquo;hoy es tu fecha de pago&rdquo; y en los de atraso.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="info_pago">Texto para los mensajes</Label>
            <Textarea
              id="info_pago"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={4}
              maxLength={1000}
              required
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground text-right">
              {value.length}/1000
            </p>
          </div>

          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            {dirty && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={pending}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={pending || !dirty}
              className="bg-alebrijes-orange hover:bg-alebrijes-orange-dark text-white"
            >
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Guardar
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
