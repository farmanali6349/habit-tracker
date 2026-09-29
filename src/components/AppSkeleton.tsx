import { Skeleton } from "@/components/ui/skeleton";

export default function AppSkeleton() {
  return (
    <div className="min-h-dvh" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your habits…</span>

      <div className="fixed inset-y-0 start-0 hidden w-16 shrink-0 flex-col border-e bg-sidebar p-2 md:flex">
        <Skeleton className="size-9 rounded-full" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="mx-auto size-8 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="flex min-h-dvh flex-col md:pl-16">
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
    </div>
  );
}
