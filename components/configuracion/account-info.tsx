"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Mail, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";

interface Props {
  email: string | null;
  nombre: string | null;
  createdAt: string | null;
}

export function AccountInfo({ email, nombre, createdAt }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    setError(null);
    startTransition(async () => {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      } catch (e) {
        setError("Error al cerrar sesión");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="w-4 h-4" /> Información de la cuenta
        </CardTitle>
        <CardDescription>
          Datos de tu sesión de administrador
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-md bg-zinc-50 border border-zinc-200">
          <div className="shrink-0 w-10 h-10 rounded-full bg-alebrijes-orange/10 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-alebrijes-orange" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {nombre ?? "Administrador"}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <Mail className="w-3 h-3 shrink-0" />
              {email ?? "—"}
            </p>
          </div>
        </div>

        {createdAt && (
          <p className="text-xs text-muted-foreground">
            Sesión iniciada el {new Date(createdAt).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            variant="outline"
            className="text-alebrijes-red border-alebrijes-red/30 hover:bg-alebrijes-red/5"
            onClick={handleLogout}
            disabled={pending}
          >
            <LogOut className="w-4 h-4 mr-1" /> Cerrar sesión
          </Button>
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t border-zinc-100 mt-2">
          💡 Para cambiar la contraseña, usa{" "}
          <a
            href="https://supabase.com/dashboard/project/wcsqafedvjjwtntepmhf/auth/users"
            target="_blank"
            rel="noopener noreferrer"
            className="text-alebrijes-orange hover:underline"
          >
            Supabase Dashboard → Authentication → Users
          </a>
          .
        </p>
      </CardContent>
    </Card>
  );
}
