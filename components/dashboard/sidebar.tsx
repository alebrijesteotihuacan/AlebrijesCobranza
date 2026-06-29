"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useBadges } from "@/components/dashboard/badge-context";
import {
  LayoutDashboard,
  Users,
  Inbox,
  MessagesSquare,
  MessageCircleWarning,
  BarChart3,
  Settings,
  X,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: keyof ReturnType<typeof useBadges>["counts"];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",            label: "Dashboard",      icon: LayoutDashboard },
  { href: "/dashboard/clientes",   label: "Clientes",       icon: Users },
  { href: "/dashboard/comprobantes", label: "Comprobantes", icon: Inbox,         badge: "comprobantes" },
  { href: "/dashboard/desconocidos", label: "Desconocidos",  icon: MessageCircleWarning, badge: "desconocidos" },
  { href: "/dashboard/mensajes",   label: "Mensajes",       icon: MessagesSquare },
  { href: "/dashboard/reportes",   label: "Reportes",       icon: BarChart3 },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { counts } = useBadges();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-alebrijes-black text-white",
          "flex flex-col transition-transform lg:transition-none",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <div className="relative w-10 h-10 shrink-0">
              <Image
                src="/assets/alebrijes-escudo.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <div className="leading-tight">
              <div className="font-heading text-lg tracking-wider text-alebrijes-orange">
                ALEBRIJES
              </div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                Cobranza
              </div>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1 text-zinc-400 hover:text-white"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const badgeValue = item.badge ? counts[item.badge] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-alebrijes-orange text-white"
                    : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {badgeValue > 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full",
                      active
                        ? "bg-white text-alebrijes-orange"
                        : "bg-alebrijes-orange text-white",
                    )}
                  >
                    {badgeValue > 99 ? "99+" : badgeValue}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 text-xs text-zinc-500">
          v1.0 · {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
}
