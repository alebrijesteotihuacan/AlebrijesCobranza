"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Power, PowerOff, Shield, UserCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { banAdminAction, unbanAdminAction } from "@/lib/actions/admin";
import { formatRelativeTime } from "@/lib/utils";
import type { AdminUser } from "@/lib/queries/admin";

interface Props {
  admins: AdminUser[];
}

export function AdminList({ admins }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function handleBan(userId: string) {
    setBusyId(userId);
    startTransition(async () => {
      const r = await banAdminAction({ userId });
      if (r.ok) {
        toast.success(r.message);
        router.refresh();
      } else {
        toast.error(r.error ?? "Error");
      }
      setBusyId(null);
    });
  }

  function handleUnban(userId: string) {
    setBusyId(userId);
    startTransition(async () => {
      const r = await unbanAdminAction({ userId });
      if (r.ok) {
        toast.success(r.message);
        router.refresh();
      } else {
        toast.error(r.error ?? "Error");
      }
      setBusyId(null);
    });
  }

  if (admins.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No se encontraron usuarios administradores.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-4 h-4" /> Administradores ({admins.length})
        </CardTitle>
        <CardDescription>
          Lista de usuarios con acceso al dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {admins.map((a) => {
          const isBanned = !!a.banned_until;
          const nombre =
            (a.user_metadata?.nombre as string | undefined) ??
            a.email?.split("@")[0] ??
            "Sin nombre";
          const isBusy = busyId === a.id || pending;

          return (
            <div
              key={a.id}
              className={`flex items-center gap-3 p-3 rounded-md border ${
                isBanned
                  ? "border-alebrijes-red/30 bg-alebrijes-red/5"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <div
                className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                  isBanned
                    ? "bg-alebrijes-red/10 text-alebrijes-red"
                    : "bg-alebrijes-orange/10 text-alebrijes-orange"
                }`}
              >
                {isBanned ? (
                  <PowerOff className="w-4 h-4" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">
                    {nombre}
                    {a.is_current && (
                      <span className="text-xs text-muted-foreground ml-1">(vos)</span>
                    )}
                  </p>
                  {isBanned && (
                    <Badge variant="destructive" className="text-[10px]">
                      Desactivado
                    </Badge>
                  )}
                  {a.email_confirmed_at ? null : (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-alebrijes-warning/20 text-alebrijes-warning"
                    >
                      <Mail className="w-3 h-3 mr-1" /> Sin confirmar
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {a.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.last_sign_in_at
                    ? `Último login: ${formatRelativeTime(a.last_sign_in_at)}`
                    : "Nunca ingresó"}
                </p>
              </div>

              {!a.is_current && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    disabled={isBusy}
                    className="p-1.5 rounded-md hover:bg-zinc-100 outline-none disabled:opacity-50"
                    aria-label="Acciones"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isBanned ? (
                      <DropdownMenuItem onClick={() => handleUnban(a.id)}>
                        <Power className="w-3.5 h-3.5 mr-2" /> Reactivar
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => handleBan(a.id)}
                        className="text-alebrijes-red focus:text-alebrijes-red"
                      >
                        <PowerOff className="w-3.5 h-3.5 mr-2" /> Desactivar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
