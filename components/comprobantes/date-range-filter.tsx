"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  function updateParam(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.push(`/dashboard/comprobantes?${params.toString()}`);
    });
  }

  function clear() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    startTransition(() => {
      router.push(`/dashboard/comprobantes?${params.toString()}`);
    });
  }

  const hasFilter = !!from || !!to;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-zinc-200 bg-zinc-50/50">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="w-3.5 h-3.5" />
        <span className="font-medium">Rango:</span>
      </div>
      <div className="flex items-center gap-2 flex-1">
        <Input
          type="date"
          value={from}
          onChange={(e) => updateParam("from", e.target.value)}
          max={to || undefined}
          className="h-8 text-xs flex-1 sm:max-w-[160px]"
          aria-label="Fecha desde"
        />
        <span className="text-xs text-muted-foreground">→</span>
        <Input
          type="date"
          value={to}
          onChange={(e) => updateParam("to", e.target.value)}
          min={from || undefined}
          className="h-8 text-xs flex-1 sm:max-w-[160px]"
          aria-label="Fecha hasta"
        />
        {hasFilter && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clear}
            className="h-8 px-2"
          >
            <X className="w-3.5 h-3.5" />
            <span className="sr-only">Limpiar</span>
          </Button>
        )}
      </div>
    </div>
  );
}
