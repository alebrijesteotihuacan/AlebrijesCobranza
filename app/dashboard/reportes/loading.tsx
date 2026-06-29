import { Skeleton } from "@/components/ui/skeleton";

export default function ReportesLoading() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Period selector */}
      <Skeleton className="h-20" />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>

      {/* Chart 1 */}
      <Skeleton className="h-96" />

      {/* Chart 2 */}
      <Skeleton className="h-96" />

      {/* Morosos table */}
      <Skeleton className="h-80" />
    </div>
  );
}
