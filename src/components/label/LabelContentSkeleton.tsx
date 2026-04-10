import { Skeleton } from "@/components/ui/skeleton";

export default function LabelContentSkeleton() {
  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-6">
      <Skeleton className="h-8 w-48 bg-white/[0.06]" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 bg-white/[0.06] rounded-xl" />
        <Skeleton className="h-32 bg-white/[0.06] rounded-xl" />
        <Skeleton className="h-32 bg-white/[0.06] rounded-xl" />
      </div>
      <Skeleton className="h-64 bg-white/[0.06] rounded-xl" />
    </div>
  );
}
