import { getAdminClient, type Cliente } from "@/lib/queries/clientes";

const MX_TZ = "America/Mexico_City";

function lastDayOfMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

function todayInMexico(): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MX_TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

function isValidPeriodo(periodo: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(periodo);
}

export interface ReporteData {
  periodo: string;
  totalClientesActivos: number;
  clientesPagaron: number;
  totalCobrado: number;
  totalEsperado: number;
  totalPendiente: number;
  porcentajeCobranza: number;
  porDiaPago: {
    diaPago: 15 | 30;
    clientes: number;
    pagaron: number;
    pendiente: number;
    cobrado: number;
    esperado: number;
  }[];
  morosos: Array<{
    id: string;
    nombre: string;
    whatsapp: string;
    dia_pago: number;
    monto: number;
    diasAtraso: number;
  }>;
}

/**
 * Returns full report data for a given YYYY-MM periodo.
 * If periodo is invalid, defaults to current month in America/Mexico_City.
 */
export async function getReporte(periodo?: string): Promise<ReporteData> {
  const admin = getAdminClient();
  const { y: cy, m: cm } = todayInMexico();
  const currentPeriodo = `${cy}-${String(cm).padStart(2, "0")}`;
  const selected = periodo && isValidPeriodo(periodo) ? periodo : currentPeriodo;
  const [selY, selM] = selected.split("-").map(Number);

  // Get all active clientes
  const { data: clientes } = await admin
    .from("clientes")
    .select("id, nombre, whatsapp, dia_pago, monto, activo, categoria")
    .eq("activo", true)
    .order("nombre");
  const allClientes = (clientes ?? []) as Cliente[];

  // Get pagos for the selected periodo
  const { data: pagosData } = await admin
    .from("pagos")
    .select("cliente_id, monto, fecha_pago, metodo, notas")
    .eq("periodo", selected);
  const pagos = pagosData ?? [];

  const clienteIdsQuePagaron = new Set(pagos.map((p) => p.cliente_id));
  const totalCobrado = pagos.reduce((s, p) => sumSafe(p.monto) + s, 0);
  const totalEsperado = allClientes.reduce((s, c) => sumSafe(c.monto) + s, 0);
  const totalPendiente = Math.max(0, totalEsperado - totalCobrado);
  const porcentajeCobranza = totalEsperado > 0
    ? Math.round((totalCobrado / totalEsperado) * 100)
    : 0;

  // Group by dia_pago
  const byDiaPago: Record<number, { clientes: number; pagaron: number; cobrado: number; esperado: number }> = { 15: { clientes: 0, pagaron: 0, cobrado: 0, esperado: 0 }, 30: { clientes: 0, pagaron: 0, cobrado: 0, esperado: 0 } };
  for (const c of allClientes) {
    if (c.dia_pago !== 15 && c.dia_pago !== 30) continue;
    byDiaPago[c.dia_pago].clientes++;
    byDiaPago[c.dia_pago].esperado += sumSafe(c.monto);
    if (clienteIdsQuePagaron.has(c.id)) {
      byDiaPago[c.dia_pago].pagaron++;
    }
  }
  for (const p of pagos) {
    const c = allClientes.find((x) => x.id === p.cliente_id);
    if (c && (c.dia_pago === 15 || c.dia_pago === 30)) {
      byDiaPago[c.dia_pago].cobrado += sumSafe(p.monto);
    }
  }
  const porDiaPago: ReporteData["porDiaPago"] = ([15, 30] as const).map((d) => ({
    diaPago: d,
    clientes: byDiaPago[d].clientes,
    pagaron: byDiaPago[d].pagaron,
    pendiente: byDiaPago[d].clientes - byDiaPago[d].pagaron,
    cobrado: byDiaPago[d].cobrado,
    esperado: byDiaPago[d].esperado,
  }));

  // Morosos (clientes without payment for the selected periodo,
  // whose dia_pago has already passed in that month, or for past months
  // any unpaid client is a moroso)
  const { y: ty, m: tm, d: today } = todayInMexico();
  const isCurrentOrFuture =
    selY > ty || (selY === ty && selM >= tm);

  const morosos = allClientes
    .filter((c) => !clienteIdsQuePagaron.has(c.id))
    .map((c) => {
      const lastDay = lastDayOfMonth(selY, selM);
      const diaDelPago = Math.min(c.dia_pago, lastDay);
      // For past months: any unpaid = moroso
      // For current month: unpaid + dia_pago passed = moroso
      // For future months: shouldn't be morosos (the list will be empty)
      const isPast = selY < ty || (selY === ty && selM < tm);
      let diasAtraso = 0;
      if (isPast) {
        // Calculate days from end of selected month
        const lastDayOfSelected = lastDayOfMonth(selY, selM);
        diasAtraso = lastDayOfSelected - diaDelPago + (lastDayOfSelected - diaDelPago > 0 ? 1 : 0);
        // Better: just say how many days since diaDelPago in selected month
        const refDate = new Date(selY, selM - 1, lastDay);
        const payDate = new Date(selY, selM - 1, diaDelPago);
        diasAtraso = Math.max(0, Math.floor((refDate.getTime() - payDate.getTime()) / (1000 * 60 * 60 * 24)));
      } else if (isCurrentOrFuture && today > diaDelPago) {
        diasAtraso = today - diaDelPago;
      }
      return { ...c, diasAtraso };
    })
    .filter((c) => c.diasAtraso > 0)
    .sort((a, b) => b.diasAtraso - a.diasAtraso);

  return {
    periodo: selected,
    totalClientesActivos: allClientes.length,
    clientesPagaron: clienteIdsQuePagaron.size,
    totalCobrado,
    totalEsperado,
    totalPendiente,
    porcentajeCobranza,
    porDiaPago,
    morosos,
  };
}

function sumSafe(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}

export function buildCsvFromReporte(data: ReporteData): string {
  const lines: string[] = [];
  lines.push("# Reporte Alebrijes Cobranza");
  lines.push(`# Periodo,${data.periodo}`);
  lines.push("");
  lines.push("## Resumen");
  lines.push("Metrica,Valor");
  lines.push(`Total clientes activos,${data.totalClientesActivos}`);
  lines.push(`Clientes que pagaron,${data.clientesPagaron}`);
  lines.push(`Total cobrado,${data.totalCobrado.toFixed(2)}`);
  lines.push(`Total esperado,${data.totalEsperado.toFixed(2)}`);
  lines.push(`Total pendiente,${data.totalPendiente.toFixed(2)}`);
  lines.push(`% cobranza,${data.porcentajeCobranza}`);
  lines.push("");
  lines.push("## Por día de pago");
  lines.push("Dia,Clientes,Pagaron,Pendiente,Cobrado,Esperado");
  for (const d of data.porDiaPago) {
    lines.push(
      [
        `Día ${d.diaPago}`,
        d.clientes,
        d.pagaron,
        d.pendiente,
        d.cobrado.toFixed(2),
        d.esperado.toFixed(2),
      ].join(","),
    );
  }
  lines.push("");
  lines.push("## Morosos");
  lines.push("Nombre,WhatsApp,Dia de pago,Monto,Dias de atraso");
  for (const m of data.morosos) {
    lines.push(
      [
        csvEscape(m.nombre),
        m.whatsapp,
        m.dia_pago,
        m.monto.toFixed(2),
        m.diasAtraso,
      ].join(","),
    );
  }
  return lines.join("\n");
}

function csvEscape(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export interface PagoMensual {
  periodo: string;
  dia15: number;
  dia30: number;
  total: number;
  pagosCount: number;
}

/**
 * Returns the last `months` months of payments grouped by dia_pago (15 or 30).
 * Used by MonthlyEvolutionChart.
 */
export async function getMonthlyPayments(months = 6): Promise<PagoMensual[]> {
  const admin = getAdminClient();
  // Compute start of month (months-1) ago
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const startPeriodo = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;

  const { data: pagos, error } = await admin
    .from("pagos")
    .select("cliente_id, periodo, monto, fecha_pago")
    .gte("periodo", startPeriodo)
    .order("periodo", { ascending: true });
  if (error) {
    console.error("getMonthlyPayments error", error);
    return [];
  }

  // Fetch clients to know their dia_pago
  const clienteIds = Array.from(new Set((pagos ?? []).map((p) => p.cliente_id)));
  const { data: clientes } = clienteIds.length > 0
    ? await admin
        .from("clientes")
        .select("id, dia_pago")
        .in("id", clienteIds)
    : { data: [] as Array<{ id: string; dia_pago: number }> };
  const clienteById = new Map((clientes ?? []).map((c) => [c.id, c]));

  // Initialize buckets for the last `months` months (including current)
  const buckets = new Map<string, PagoMensual>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, { periodo: key, dia15: 0, dia30: 0, total: 0, pagosCount: 0 });
  }

  for (const p of pagos ?? []) {
    const b = buckets.get(p.periodo);
    if (!b) continue;
    const monto = sumSafe(p.monto);
    const cliente = clienteById.get(p.cliente_id);
    const dia = cliente?.dia_pago;
    if (dia === 15) b.dia15 += monto;
    else if (dia === 30) b.dia30 += monto;
    b.total += monto;
    b.pagosCount += 1;
  }

  return Array.from(buckets.values());
}
