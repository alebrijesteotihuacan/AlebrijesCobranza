import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type KpiTone = "orange" | "success" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASSES: Record<KpiTone, { ring: string; iconBg: string; iconColor: string; valueColor: string }> = {
  orange:  { ring: "ring-alebrijes-orange/20",       iconBg: "bg-alebrijes-orange/10",      iconColor: "text-alebrijes-orange",       valueColor: "text-alebrijes-black" },
  success: { ring: "ring-alebrijes-success/20",       iconBg: "bg-alebrijes-success/10",      iconColor: "text-alebrijes-success",       valueColor: "text-alebrijes-black" },
  warning: { ring: "ring-alebrijes-warning/20",       iconBg: "bg-alebrijes-warning/10",      iconColor: "text-alebrijes-warning",       valueColor: "text-alebrijes-black" },
  danger:  { ring: "ring-alebrijes-red/20",           iconBg: "bg-alebrijes-red/10",          iconColor: "text-alebrijes-red",           valueColor: "text-alebrijes-red" },
  info:    { ring: "ring-blue-500/20",                iconBg: "bg-blue-500/10",               iconColor: "text-blue-600",               valueColor: "text-alebrijes-black" },
  neutral: { ring: "ring-zinc-200",                  iconBg: "bg-zinc-100",                  iconColor: "text-zinc-600",               valueColor: "text-alebrijes-black" },
};

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: KpiTone;
  emphasis?: boolean;          // large card
  trend?: { value: string; up?: boolean };
  href?: string;               // if provided, card is clickable
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  emphasis = false,
  trend,
  href,
}: Props) {
  const toneCls = TONE_CLASSES[tone];
  const Wrapper = href ? "a" : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...(wrapperProps as Record<string, string>)}
      className={cn(
        "group relative block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm",
        "ring-1 transition-all duration-200",
        toneCls.ring,
        href && "hover:shadow-md hover:border-zinc-300 hover:-translate-y-0.5",
        emphasis ? "sm:col-span-2 lg:col-span-1" : "",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className={cn(
            "mt-1.5 font-heading tracking-tight",
            emphasis ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl",
            toneCls.valueColor,
          )}>
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-muted-foreground">
              {hint}
            </p>
          )}
          {trend && (
            <p className={cn(
              "mt-1.5 text-xs font-medium",
              trend.up ? "text-alebrijes-success" : "text-alebrijes-red",
            )}>
              {trend.up ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className={cn(
          "shrink-0 rounded-lg p-2.5",
          toneCls.iconBg,
        )}>
          <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", toneCls.iconColor)} />
        </div>
      </div>
    </Wrapper>
  );
}
