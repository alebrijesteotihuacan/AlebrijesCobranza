import { Skeleton } from "@/components/ui/skeleton";

export default function MensajesLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-4 w-72 mt-1" />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>

      {/* Filters bar */}
      <Skeleton className="h-40" />

      {/* Table */}
      <Skeleton className="h-96" />
    </div>
  );
}
