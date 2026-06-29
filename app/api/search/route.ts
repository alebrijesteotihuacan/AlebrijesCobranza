import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/queries/clientes";
import { getCurrentUserId } from "@/lib/queries/admin-utils";

export const dynamic = "force-dynamic";

interface SearchResult {
  type: "cliente" | "comprobante" | "desconocido" | "mensaje";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

const PER_CATEGORY = 5;

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] satisfies SearchResult[] });
  }

  const admin = getAdminClient();
  const escaped = q.replace(/[%_]/g, (c) => `\\${c}`);
  const like = `%${escaped}%`;
  const ilike = (col: string) => admin.rpc("__noop" as never).then?.(() => null) ?? null;
  void ilike;

  // Clientes
  const { data: clientes } = await admin
    .from("clientes")
    .select("id, nombre, whatsapp, dia_pago, monto")
    .or(`nombre.ilike.${like},whatsapp.ilike.${like}`)
    .limit(PER_CATEGORY);

  // Comprobantes (texto del caption o whatsapp_from)
  const { data: comprobantes } = await admin
    .from("comprobantes_recibidos")
    .select("id, whatsapp_from, texto, estado, clientes:cliente_id(nombre)")
    .or(`whatsapp_from.ilike.${like},texto.ilike.${like}`)
    .limit(PER_CATEGORY);

  // Desconocidos
  const { data: desconocidos } = await admin
    .from("mensajes_desconocidos")
    .select("id, whatsapp_from, texto, tipo")
    .or(`whatsapp_from.ilike.${like},texto.ilike.${like}`)
    .limit(PER_CATEGORY);

  const results: SearchResult[] = [];

  for (const c of clientes ?? []) {
    results.push({
      type: "cliente",
      id: c.id,
      title: c.nombre,
      subtitle: `${c.whatsapp} · día ${c.dia_pago} · $${c.monto}`,
      href: `/dashboard/clientes/${c.id}`,
    });
  }

  type CompRow = {
    id: string;
    whatsapp_from: string;
    texto: string | null;
    estado: string;
    clientes: { nombre: string } | null;
  };
  for (const c of (comprobantes ?? []) as unknown as CompRow[]) {
    results.push({
      type: "comprobante",
      id: c.id,
      title: c.clientes?.nombre ?? c.whatsapp_from,
      subtitle: `${c.estado} · ${c.texto?.slice(0, 60) ?? "(sin caption)"}`,
      href: `/dashboard/comprobantes`,
    });
  }

  type DescRow = { id: string; whatsapp_from: string; texto: string | null; tipo: string };
  for (const d of (desconocidos ?? []) as unknown as DescRow[]) {
    results.push({
      type: "desconocido",
      id: d.id,
      title: d.whatsapp_from,
      subtitle: d.texto?.slice(0, 60) ?? `(${d.tipo})`,
      href: `/dashboard/desconocidos`,
    });
  }

  return NextResponse.json({ results });
}
