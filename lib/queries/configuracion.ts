import { getAdminClient } from "@/lib/queries/clientes";

export interface ConfiguracionItem {
  key: string;
  value: string;
  updated_at: string;
}

export async function getConfiguracion(key: string): Promise<string | null> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("configuracion")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) {
    console.error("getConfiguracion error", error);
    return null;
  }
  return (data as { value: string } | null)?.value ?? null;
}

export async function getInfoPago(): Promise<string> {
  return (await getConfiguracion("info_pago")) ??
    "Banco Azteca · CLABE 1271 8001 3747 4787 85 · Tarjeta 5263 5401 6581 7087 · Transferencia a nombre de Club Alebrijes Oaxaca";
}
