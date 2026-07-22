import { Skeleton } from "@/components/ui/skeleton";

export default function FormDetailLoading() {
  return (
    <div>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-5 h-9 w-96 max-w-full" />
      <Skeleton className="mt-3 h-4 w-64" />
      <Skeleton className="mt-6 h-16 rounded-card" />
      <div className="mt-8 flex gap-4 border-b border-line pb-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-20" />
        ))}
      </div>
      <div className="mt-6 space-y-5">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-48 rounded-card" />
        ))}
      </div>
    </div>
  );
}
