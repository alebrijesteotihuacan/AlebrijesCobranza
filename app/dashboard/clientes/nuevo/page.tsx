import { ClienteForm } from "@/components/clientes/cliente-form";

export const metadata = {
  title: "Nuevo cliente · Alebrijes Cobranza",
};

export default function NuevoClientePage() {
  return (
    <div>
      <ClienteForm mode="create" />
    </div>
  );
}
