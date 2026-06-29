import { Skeleton } from "@/components/ui/skeleton";

export default function ClienteEditLoading() {
  return (
    <div className="space-y-6 max-w-5xl">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-4 w-80 mt-1" />
      <Skeleton className="h-96" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
