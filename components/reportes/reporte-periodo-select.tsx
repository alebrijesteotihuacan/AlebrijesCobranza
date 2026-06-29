"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPeriodoLabel } from "@/lib/utils";

interface Props {
  current: string; // 'YYYY-MM'
}

function buildPeriodoOptions(): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = -12; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    opts.push({ value, label: formatPeriodoLabel(value) });
  }
  return opts;
}

export function ReportePeriodoSelect({ current }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const options = buildPeriodoOptions();

  return (
    <Select
      value={current}
      onValueChange={(v) => {
        startTransition(() => {
          router.push(`/dashboard/reportes?periodo=${v}`);
        });
      }}
    >
      <SelectTrigger className="w-full sm:w-[220px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
