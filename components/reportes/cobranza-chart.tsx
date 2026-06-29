"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface DiaPago {
  diaPago: 15 | 30;
  clientes: number;
  pagaron: number;
  pendiente: number;
  cobrado: number;
  esperado: number;
}

interface Props {
  data: DiaPago[];
}

const COLORS = {
  cobrado: "#16A34A",    // alebrijes-success
  pendiente: "#D63A1A",  // alebrijes-red
  primary: "#F47920",    // alebrijes-orange
};

interface Row {
  label: string;
  Cobrado: number;
  Pendiente: number;
}

export function CobranzaChart({ data }: Props) {
  const chartData: Row[] = data.map((d) => ({
    label: `Día ${d.diaPago}`,
    Cobrado: d.cobrado,
    Pendiente: d.pendiente,
  }));

  return (
    <div className="w-full h-72 sm:h-80" aria-label="Gráfica de cobranza por día de pago">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#71717A", fontSize: 12 }}
            axisLine={{ stroke: "#D4D4D8" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#71717A", fontSize: 12 }}
            axisLine={{ stroke: "#D4D4D8" }}
            tickLine={false}
            tickFormatter={(v: number) => `$${v.toLocaleString("es-MX")}`}
          />
          <Tooltip
            contentStyle={{
              background: "#FFFFFF",
              border: "1px solid #E4E4E7",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value, name) => {
              const n = typeof value === "number" ? value : Number(value ?? 0);
              return [
                `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                String(name),
              ];
            }}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
          <Bar
            dataKey="Cobrado"
            stackId="a"
            fill={COLORS.cobrado}
            name="Cobrado"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="Pendiente"
            stackId="a"
            fill={COLORS.pendiente}
            name="Pendiente"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
