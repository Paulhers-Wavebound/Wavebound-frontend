import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for health sub-pages.
 * Shows a header bar, stat cards, and a content area placeholder.
 */
export default function HealthLoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Title */}
      <Skeleton className="h-6 w-36 bg-white/[0.06] rounded-md" />

      {/* Stat cards row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[100, 120, 90, 80].map((w, i) => (
          <Skeleton
            key={i}
            className="rounded-[10px] bg-white/[0.06]"
            style={{ width: w, height: 56 }}
          />
        ))}
      </div>

      {/* Content area */}
      <Skeleton className="h-[320px] w-full bg-white/[0.06] rounded-xl" />
    </div>
  );
}
