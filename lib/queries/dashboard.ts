import { getAdminClient } from "@/lib/queries/clientes";
import { getCurrentPeriodo, formatPeriodoLabel } from "@/lib/utils";

const MX_TZ = "America/Mexico_City";

export interface KpiSnapshot {
  periodo: string;            // 'YYYY-MM'
  periodoLabel: string;       // 'Junio 2026'
  cobrado: number;            // sum of pagos for the periodo
  pagosCount: number;         // count of pagos
  morososCount: number;       // active clients whose dia_pago already passed and no pago
  porVencerCount: number;     // active clients whose dia_pago in next 3 days, no pago
  pendientesCount: number;     // comprobantes_recibidos with estado='pendiente'
  totalClientesActivos: number;
}

function todayInMexico(): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MX_TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

function lastDayOfMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

/**
 * Returns the day-of-month (1..31) when the cliente's payment was/will be due
 * for the current periodo.  Clamps to the last day of the month if dia_pago
 * is larger (e.g. dia_pago=30 in Feb → 28/29).
 */
function diaPagoEnMes(diaPago: number, year: number, month1to12: number): number {
  return Math.min(diaPago, lastDayOfMonth(year, month1to12));
}

export async function getDashboardKpis(): Promise<KpiSnapshot> {
  const admin = getAdminClient();
  const periodo = getCurrentPeriodo();
  const periodoLabel = formatPeriodoLabel(periodo);
  const { y, m, d: today } = todayInMexico();

  // Run independent queries in parallel
  const [pagosRes, pendientesRes, allClientesRes] = await Promise.all([
    admin
      .from("pagos")
      .select("monto, cliente_id")
      .eq("periodo", periodo),
    admin
      .from("comprobantes_recibidos")
      .select("id", { count: "exact", head: true })
      .eq("estado", "pendiente"),
    admin
      .from("clientes")
      .select("id, dia_pago, activo")
      .eq("activo", true),
  ]);

  const pagos = pagosRes.data ?? [];
  const cobrado = pagos.reduce((sum, p) => sum + Number(p.monto ?? 0), 0);
  const pagosCount = pagos.length;
  const clientesConPago = new Set(pagos.map((p) => p.cliente_id));
  const pendientesCount = pendientesRes.count ?? 0;

  // Compute morosos and por vencer
  const clientes = (allClientesRes.data ?? []) as Array<{ id: string; dia_pago: number }>;
  let morososCount = 0;
  let porVencerCount = 0;

  for (const c of clientes) {
    if (clientesConPago.has(c.id)) continue; // already paid
    const diaDelPago = diaPagoEnMes(c.dia_pago, y, m);
    if (today > diaDelPago) {
      morososCount++;
    } else if (diaDelPago - today <= 3 && diaDelPago - today >= 0) {
      porVencerCount++;
    }
  }

  return {
    periodo,
    periodoLabel,
    cobrado,
    pagosCount,
    morososCount,
    porVencerCount,
    pendientesCount,
    totalClientesActivos: clientes.length,
  };
}

export interface MorosoItem {
  id: string;
  nombre: string;
  whatsapp: string;
  dia_pago: number;
  monto: number;
  diasAtraso: number;
}

export interface PorVencerItem {
  id: string;
  nombre: string;
  whatsapp: string;
  dia_pago: number;
  monto: number;
  diasParaVencer: number;
}

export async function getMorososList(limit = 10): Promise<MorosoItem[]> {
  const admin = getAdminClient();
  const periodo = getCurrentPeriodo();
  const { y, m, d: today } = todayInMexico();

  const [clientesRes, pagosRes] = await Promise.all([
    admin.from("clientes").select("id, nombre, whatsapp, dia_pago, monto, activo")
      .eq("activo", true),
    admin.from("pagos").select("cliente_id").eq("periodo", periodo),
  ]);
  const clientes = (clientesRes.data ?? []) as Array<{
    id: string; nombre: string; whatsapp: string; dia_pago: number; monto: number;
  }>;
  const conPago = new Set((pagosRes.data ?? []).map((p) => p.cliente_id));

  return clientes
    .filter((c) => !conPago.has(c.id))
    .map((c) => {
      const diaDelPago = diaPagoEnMes(c.dia_pago, y, m);
      return { ...c, diasAtraso: Math.max(0, today - diaDelPago) };
    })
    .filter((c) => c.diasAtraso > 0)
    .sort((a, b) => b.diasAtraso - a.diasAtraso)
    .slice(0, limit);
}

export async function getPorVencerList(limit = 10): Promise<PorVencerItem[]> {
  const admin = getAdminClient();
  const periodo = getCurrentPeriodo();
  const { y, m, d: today } = todayInMexico();

  const [clientesRes, pagosRes] = await Promise.all([
    admin.from("clientes").select("id, nombre, whatsapp, dia_pago, monto, activo")
      .eq("activo", true),
    admin.from("pagos").select("cliente_id").eq("periodo", periodo),
  ]);
  const clientes = (clientesRes.data ?? []) as Array<{
    id: string; nombre: string; whatsapp: string; dia_pago: number; monto: number;
  }>;
  const conPago = new Set((pagosRes.data ?? []).map((p) => p.cliente_id));

  return clientes
    .filter((c) => !conPago.has(c.id))
    .map((c) => {
      const diaDelPago = diaPagoEnMes(c.dia_pago, y, m);
      return { ...c, diasParaVencer: diaDelPago - today };
    })
    .filter((c) => c.diasParaVencer >= 0 && c.diasParaVencer <= 3)
    .sort((a, b) => a.diasParaVencer - b.diasParaVencer)
    .slice(0, limit);
}
