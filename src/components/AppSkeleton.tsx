import { Skeleton } from "@/components/ui/skeleton";

export default function AppSkeleton() {
  return (
    <div
      className="min-h-dvh md:grid md:grid-cols-[auto_1fr]"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading your habits…</span>

      <div className="hidden w-60 shrink-0 border-e bg-sidebar p-3 md:block">
        <Skeleton className="h-8 w-40" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
