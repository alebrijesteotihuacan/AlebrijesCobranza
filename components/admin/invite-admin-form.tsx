"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { UserPlus, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { inviteAdminAction } from "@/lib/actions/admin";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  nombre: z.string().trim().min(2, "Mínimo 2 caracteres").max(100),
});

type FormValues = z.infer<typeof schema>;

export function InviteAdminForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { email: "", nombre: "" },
  });

  function onSubmit(values: FormValues) {
    setError(null);
    startTransition(async () => {
      const result = await inviteAdminAction(values);
      if (result.ok) {
        toast.success(result.message ?? "Invitación enviada");
        reset({ email: "", nombre: "" });
        router.refresh();
      } else {
        setError(result.error ?? "Error");
        toast.error(result.error ?? "Error");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="w-4 h-4" /> Invitar nuevo administrador
        </CardTitle>
        <CardDescription>
          Le enviaremos un email con un link para que cree su contraseña.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                placeholder="Nombre Apellido"
                {...register("nombre")}
                disabled={pending}
              />
              {errors.nombre && (
                <p className="text-xs text-alebrijes-red">{errors.nombre.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ejemplo.com"
                {...register("email")}
                disabled={pending}
              />
              {errors.email && (
                <p className="text-xs text-alebrijes-red">{errors.email.message}</p>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={pending}
              className="bg-alebrijes-orange hover:bg-alebrijes-orange-dark text-white"
            >
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" /> Enviar invitación
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
