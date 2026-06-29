import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const mxnFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMXN(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  return mxnFormatter.format(n);
}

/**
 * Formats a WhatsApp number for display: 5215512345678 -> +52 55 1234 5678
 * Assumes Mexican format (52 + 10 digits).
 */
export function formatWhatsApp(wa: string | null | undefined): string {
  if (!wa) return "—";
  const digits = wa.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("52")) {
    return `+52 ${digits.slice(2, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  return wa;
}

/**
 * Returns the current periodo (YYYY-MM) in America/Mexico_City timezone.
 */
export function getCurrentPeriodo(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${y}-${m}`;
}

/**
 * Returns a human-readable month label in Spanish for the given YYYY-MM periodo.
 */
export function formatPeriodoLabel(periodo: string): string {
  const [y, m] = periodo.split("-").map(Number);
  if (!y || !m) return periodo;
  const date = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Returns "Hace 2h", "Hace 1d", etc. for a given ISO date.
 */
export function formatRelativeTime(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const now = Date.now();
  const diff = Math.max(0, now - date.getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `Hace ${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `Hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Hace ${hr}h`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `Hace ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Hace ${months}m`;
  return `Hace ${Math.floor(months / 12)}a`;
}
