"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Type as TypeIcon,
  XCircle,
  ExternalLink,
  Eye,
  FileX,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ComprobanteViewer } from "@/components/comprobantes/comprobante-viewer";
import { ValidarDialog } from "@/components/comprobantes/validar-dialog";
import { RechazarDialog } from "@/components/comprobantes/rechazar-dialog";
import {
  formatMXN,
  formatRelativeTime,
  formatWhatsApp,
  formatPeriodoLabel,
} from "@/lib/utils";
import type { ComprobanteWithRelations } from "@/lib/queries/comprobantes";

interface Props {
  comprobante: ComprobanteWithRelations;
  periodos: string[];
  defaultPeriodo: string;
}

function tipoIcon(tipo: string) {
  if (tipo === "image") return ImageIcon;
  if (tipo === "document") return FileText;
  if (tipo === "text") return TypeIcon;
  return MessageSquare;
}

function tipoLabel(tipo: string) {
  if (tipo === "image") return "Imagen";
  if (tipo === "document") return "PDF";
  if (tipo === "text") return "Texto";
  if (tipo === "audio") return "Audio";
  if (tipo === "video") return "Video";
  return tipo;
}

export function ComprobanteCard({ comprobante: c, periodos, defaultPeriodo }: Props) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [validarOpen, setValidarOpen] = useState(false);
  const [rechazarOpen, setRechazarOpen] = useState(false);

  const Icon = tipoIcon(c.tipo);
  const tieneMedia = c.tipo === "image" || c.tipo === "document";
  const isImage = c.tipo === "image";
  const isProcesado = c.estado === "validado" || c.estado === "rechazado";

  return (
    <>
      <Card
        className={`overflow-hidden transition-shadow ${
          isProcesado ? "opacity-90" : "hover:shadow-md"
        } ${c.estado === "rechazado" ? "border-alebrijes-red/30" : ""}`}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail / preview */}
          {c.estado === "pendiente" ? (
            <button
              type="button"
              onClick={() => tieneMedia && c.signedUrl ? setViewerOpen(true) : undefined}
              disabled={!tieneMedia || !c.signedUrl}
              className={`relative sm:w-48 sm:h-48 h-56 sm:shrink-0 bg-zinc-100 flex items-center justify-center overflow-hidden ${
                tieneMedia && c.signedUrl ? "cursor-zoom-in hover:opacity-95" : "cursor-default"
              }`}
              aria-label={tieneMedia ? "Ver comprobante en grande" : "Comprobante sin archivo"}
            >
              {isImage && c.signedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.signedUrl}
                  alt={`Comprobante de ${c.cliente?.nombre ?? c.whatsapp_from}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : c.tipo === "document" && c.signedUrl ? (
                <div className="flex flex-col items-center gap-2 text-zinc-600">
                  <FileText className="w-10 h-10" />
                  <span className="text-xs font-medium">PDF</span>
                </div>
              ) : c.tipo === "text" && c.texto ? (
                <div className="p-4 text-xs text-zinc-700 italic line-clamp-6 max-w-full">
                  "{c.texto}"
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-zinc-400">
                  <Icon className="w-8 h-8" />
                  <span className="text-[10px] uppercase tracking-wider">
                    {tipoLabel(c.tipo)}
                  </span>
                </div>
              )}

              {tieneMedia && c.signedUrl && (
                <span className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-3.5 h-3.5" />
                </span>
              )}
            </button>
          ) : (
            // 7.4.2 — Histórico: sin archivo, solo metadatos
            <div
              className={`relative sm:w-48 sm:h-48 h-32 sm:shrink-0 flex flex-col items-center justify-center gap-2 ${
                c.estado === "validado"
                  ? "bg-alebrijes-success/5"
                  : "bg-alebrijes-red/5"
              }`}
            >
              <FileX className="w-10 h-10 text-zinc-400" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {c.estado === "validado" ? "Archivo validado" : "Archivo rechazado"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                (borrado por política)
              </span>
            </div>
          )}

          {/* Content */}
          <CardContent className="flex-1 p-4 sm:p-5 space-y-3">
            {/* Top row: cliente + estado */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {c.cliente ? (
                  <Link
                    href={`/dashboard/clientes/${c.cliente.id}`}
                    className="font-medium hover:text-alebrijes-orange hover:underline truncate block"
                  >
                    {c.cliente.nombre}
                  </Link>
                ) : (
                  <p className="font-medium text-muted-foreground truncate flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {formatWhatsApp(c.whatsapp_from)} (sin cliente)
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatWhatsApp(c.whatsapp_from)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge variant="secondary" className="text-[10px]">
                  <Icon className="w-3 h-3 mr-1" /> {tipoLabel(c.tipo)}
                </Badge>
                {/* 7.4.2 — Estado badge prominente para histórico */}
                {c.estado === "validado" && (
                  <Badge className="bg-alebrijes-success/15 text-alebrijes-success border-alebrijes-success/30 text-[10px]">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Validado
                  </Badge>
                )}
                {c.estado === "rechazado" && (
                  <Badge className="bg-alebrijes-red/15 text-alebrijes-red border-alebrijes-red/30 text-[10px]">
                    <XCircle className="w-3 h-3 mr-1" /> Rechazado
                  </Badge>
                )}
              </div>
            </div>

            {/* Caption if present and not the main preview */}
            {c.texto && c.tipo !== "text" && (
              <blockquote className="text-sm border-l-2 border-zinc-200 pl-3 italic text-zinc-700 line-clamp-3">
                {c.texto}
              </blockquote>
            )}

            {/* Cliente metadata */}
            {c.cliente && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="font-mono">
                  día {c.cliente.dia_pago}
                </Badge>
                <span className="font-mono">{formatMXN(c.cliente.monto)}</span>
                {c.cliente.activo === false && (
                  <Badge variant="secondary">Inactivo</Badge>
                )}
              </div>
            )}

            {/* 7.4.2 — Motivo del rechazo visible */}
            {c.estado === "rechazado" && c.notas_admin && (
              <div className="rounded-md bg-alebrijes-red/5 border border-alebrijes-red/20 p-2.5 text-xs">
                <p className="font-medium text-alebrijes-red mb-0.5">Motivo del rechazo:</p>
                <p className="text-zinc-700 italic">"{c.notas_admin}"</p>
              </div>
            )}

            {/* 7.4.2 — Periodo asignado (validado) */}
            {c.estado === "validado" && c.periodo_asignado && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Aplicado a:</span>
                <Badge variant="secondary" className="font-mono">
                  {formatPeriodoLabel(c.periodo_asignado)}
                </Badge>
              </div>
            )}

            {/* Footer: time + actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                <span>Recibido {formatRelativeTime(c.recibido_at)}</span>
                {c.validado_at && (
                  <span>
                    {c.estado === "validado" ? "Validado" : "Rechazado"}{" "}
                    {formatRelativeTime(c.validado_at)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {c.estado === "pendiente" && (
                  <>
                    {tieneMedia && c.signedUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        render={
                          <a href={c.signedUrl} target="_blank" rel="noopener noreferrer" />
                        }
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> Abrir
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRechazarOpen(true)}
                      className="text-alebrijes-red border-alebrijes-red/30 hover:bg-alebrijes-red/5"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Rechazar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setValidarOpen(true)}
                      className="bg-alebrijes-success hover:bg-alebrijes-success/90 text-white"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Validar
                    </Button>
                  </>
                )}
                {c.estado !== "pendiente" && c.cliente && (
                  <Button variant="ghost" size="sm" render={<Link href={`/dashboard/clientes/${c.cliente.id}`} />}>
                    Ver cliente
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      <ComprobanteViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        tipo={c.tipo}
        signedUrl={c.signedUrl}
        nombre={c.cliente?.nombre ?? c.whatsapp_from}
      />

      <ValidarDialog
        open={validarOpen}
        onOpenChange={setValidarOpen}
        comprobanteId={c.id}
        clienteNombre={c.cliente?.nombre ?? formatWhatsApp(c.whatsapp_from)}
        clienteMonto={c.cliente?.monto ?? 0}
        periodos={periodos}
        defaultPeriodo={defaultPeriodo}
        previewUrl={c.signedUrl}
        previewTipo={c.tipo === "audio" || c.tipo === "video" ? "text" : c.tipo}
        previewTexto={c.texto}
        caption={c.texto}
      />

      <RechazarDialog
        open={rechazarOpen}
        onOpenChange={setRechazarOpen}
        comprobanteId={c.id}
        clienteNombre={c.cliente?.nombre ?? formatWhatsApp(c.whatsapp_from)}
      />
    </>
  );
}
