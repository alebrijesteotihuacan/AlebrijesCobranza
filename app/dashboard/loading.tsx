import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>

      {/* Two-column lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>

      {/* Recent table */}
      <Skeleton className="h-80" />
    </div>
  );
}
