"use client";

import { useMemo } from "react";
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

interface PagoMensual {
  periodo: string;          // 'YYYY-MM'
  dia15: number;            // monto cobrado
  dia30: number;
  total: number;
  pagosCount: number;
}

const COLORS = {
  dia15: "#F47920",         // alebrijes-orange
  dia30: "#0A0A0A",         // alebrijes-black
  total: "#16A34A",         // alebrijes-success
};

function formatPeriodo(periodo: string): string {
  const [y, m] = periodo.split("-").map(Number);
  if (!y || !m) return periodo;
  const date = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat("es-MX", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

export function MonthlyEvolutionChart({ data }: { data: PagoMensual[] }) {
  const formatted = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        label: formatPeriodo(d.periodo),
      })),
    [data],
  );

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-sm text-muted-foreground">
        <p>Sin datos de pagos aún.</p>
        <p className="text-xs mt-1">El gráfico se mostrará cuando se registren pagos.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80" aria-label="Gráfica de evolución mensual de cobranza">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
              const label =
                name === "dia15"
                  ? "Cobrado día 15"
                  : name === "dia30"
                  ? "Cobrado día 30"
                  : String(name);
              return [formatMoney(n), label];
            }}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => {
              if (value === "dia15") return "Día 15";
              if (value === "dia30") return "Día 30";
              return value;
            }}
          />
          <Bar dataKey="dia15" stackId="cobrado" fill={COLORS.dia15} name="dia15" radius={[0, 0, 0, 0]} />
          <Bar dataKey="dia30" stackId="cobrado" fill={COLORS.dia30} name="dia30" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
