import { Skeleton } from "@/components/ui/skeleton";

export default function ComprobantesLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-4 w-80 mt-1" />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Date filter (only for validados/rechazados) */}
      <Skeleton className="h-16" />

      {/* List of comprobantes */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}
