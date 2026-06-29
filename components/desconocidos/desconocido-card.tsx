"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Trash2,
  Type as TypeIcon,
  UserPlus,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ignorarDesconocidoAction } from "@/lib/actions/desconocidos";
import { formatRelativeTime, formatWhatsApp } from "@/lib/utils";
import type { MensajeDesconocido } from "@/lib/queries/desconocidos";

interface Props {
  mensaje: MensajeDesconocido;
}

function tipoIcon(tipo: string | null) {
  switch (tipo) {
    case "image": return ImageIcon;
    case "document": return FileText;
    case "text": return TypeIcon;
    case "video": return Video;
    case "audio": return MessageSquare;
    default: return MessageSquare;
  }
}

function tipoLabel(tipo: string | null) {
  switch (tipo) {
    case "image": return "Imagen";
    case "document": return "PDF";
    case "text": return "Texto";
    case "video": return "Video";
    case "audio": return "Audio";
    default: return "Mensaje";
  }
}

export function DesconocidoCard({ mensaje: m }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const Icon = tipoIcon(m.tipo);
  const altaUrl = `/dashboard/clientes/nuevo?whatsapp=${encodeURIComponent(m.whatsapp_from)}`;

  function handleIgnorar() {
    startTransition(async () => {
      const result = await ignorarDesconocidoAction(m.id);
      if (result.ok) {
        toast.success("Marcado como ignorado");
        setConfirmOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Error");
      }
    });
  }

  return (
    <>
      <Card>
        <CardContent className="p-4 sm:p-5 space-y-3">
          {/* Top row: tipo + Icon + WhatsApp */}
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-lg p-2.5 bg-alebrijes-warning/10 text-alebrijes-warning">
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-sm font-medium">
                  {formatWhatsApp(m.whatsapp_from)}
                </p>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded bg-zinc-100">
                  {tipoLabel(m.tipo)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                {formatRelativeTime(m.recibido_at)}
              </p>
            </div>
          </div>

          {/* Texto del mensaje */}
          {m.texto ? (
            <blockquote className="text-sm border-l-2 border-zinc-200 pl-3 italic text-zinc-700 line-clamp-3">
              "{m.texto}"
            </blockquote>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              (sin contenido de texto — solo archivo adjunto)
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              size="sm"
              render={<Link href={altaUrl} />}
              className="bg-alebrijes-orange hover:bg-alebrijes-orange-dark text-white"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" /> Dar de alta como cliente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={pending}
              className="text-zinc-600"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Marcar como ignorado
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Marcar como ignorado?</DialogTitle>
            <DialogDescription>
              Se eliminará el mensaje de <strong>{formatWhatsApp(m.whatsapp_from)}</strong>.
              Si este número te escribe de nuevo, volverá a aparecer aquí.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleIgnorar}
              disabled={pending}
              className="bg-zinc-700 hover:bg-zinc-800 text-white"
            >
              {pending ? "Eliminando..." : "Sí, ignorar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
