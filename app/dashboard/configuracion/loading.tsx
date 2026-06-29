import { Skeleton } from "@/components/ui/skeleton";

export default function ConfiguracionLoading() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <Skeleton className="h-32" />
      <Skeleton className="h-96" />
      <Skeleton className="h-48" />
      <Skeleton className="h-40" />
    </div>
  );
}
