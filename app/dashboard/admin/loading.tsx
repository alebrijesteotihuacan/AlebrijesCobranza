import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-80 mt-2" />
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-64" />
    </div>
  );
}
