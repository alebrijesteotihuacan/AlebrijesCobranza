"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { LogOut, Menu, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "@/components/dashboard/sidebar";
import { createClient } from "@/lib/supabase/client";

function getCurrentMonthLabel(): string {
  return new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function Topbar({ user }: { user: User }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile sidebar drawer */}
      <div className="lg:hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-zinc-100"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs text-muted-foreground hidden sm:block">
              Período actual
            </div>
            <div className="font-heading text-lg tracking-wide text-alebrijes-black capitalize">
              {getCurrentMonthLabel()}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <ThemeToggle />
          <DropdownMenuTrigger className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-md hover:bg-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-alebrijes-orange">
            <div className="relative w-8 h-8 rounded-full bg-alebrijes-orange/10 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-alebrijes-orange" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium leading-tight">
                {user.user_metadata?.nombre ?? user.email}
              </div>
              <div className="text-xs text-muted-foreground leading-tight">
                {user.email}
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              <UserIcon className="w-4 h-4 mr-2" />
              {user.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-alebrijes-red focus:text-alebrijes-red"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
    </>
  );
}
