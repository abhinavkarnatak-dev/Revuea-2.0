import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-9 w-72" />
          <Skeleton className="mt-2.5 h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-20 sm:w-28 rounded-full" />
      </div>
      <div className="mt-8 grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-card" />
        ))}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-card" />
        ))}
      </div>
    </div>
  );
}
