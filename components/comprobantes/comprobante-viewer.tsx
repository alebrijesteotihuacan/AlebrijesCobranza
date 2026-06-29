"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: string;
  signedUrl: string | null;
  nombre: string;
}

export function ComprobanteViewer({ open, onOpenChange, tipo, signedUrl, nombre }: Props) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) setLoading(true);
  }, [open, signedUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-4xl w-[95vw] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-zinc-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle>Comprobante</DialogTitle>
              <DialogDescription>{nombre}</DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {signedUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <a href={signedUrl} target="_blank" rel="noopener noreferrer" download />
                  }
                >
                  <Download className="w-4 h-4 mr-1" /> Descargar
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="bg-zinc-100 max-h-[calc(90vh-100px)] overflow-auto">
          {tipo === "image" && signedUrl ? (
            <div className="relative min-h-[300px]">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrl}
                alt={`Comprobante de ${nombre}`}
                className="w-full h-auto block"
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            </div>
          ) : tipo === "document" && signedUrl ? (
            <div className="h-[70vh] bg-white">
              <iframe
                src={signedUrl}
                className="w-full h-full"
                title={`Comprobante PDF de ${nombre}`}
                onLoad={() => setLoading(false)}
              />
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay archivo para mostrar.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
