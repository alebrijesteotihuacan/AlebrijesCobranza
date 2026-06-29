import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-zinc-50 px-4 py-12">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40">
            <Image
              src="/assets/alebrijes-escudo.png"
              alt="Club Alebrijes Oaxaca"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl text-alebrijes-black tracking-wider">
            ALEBRIJES
          </h1>
          <p className="text-sm text-muted-foreground">
            Sistema de Cobranza — Fuerzas Básicas Teotihuacán
          </p>
        </div>

        <Suspense fallback={<Card className="w-full"><CardContent className="h-64" /></Card>}>
          <LoginForm />
        </Suspense>

        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} Club Alebrijes Oaxaca
        </p>
      </div>
    </main>
  );
}
