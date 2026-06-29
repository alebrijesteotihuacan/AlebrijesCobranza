import { Skeleton } from "@/components/ui/skeleton";

export default function ClientesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Search + count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Skeleton className="h-9 flex-1 max-w-md" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Table */}
      <Skeleton className="h-96" />
    </div>
  );
}
