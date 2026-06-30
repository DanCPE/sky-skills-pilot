function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

export default function SubscriptionLoading() {
  return (
    <main className="min-h-screen bg-[#f4f6f8] px-5 py-16 dark:bg-black">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 flex flex-col items-center gap-4 text-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-72 sm:w-[480px]" />
        </div>

        {/* Pricing cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950"
            >
              <Skeleton className="mb-4 h-12 w-12 rounded-xl" />
              <Skeleton className="mb-2 h-6 w-28" />
              <Skeleton className="mb-6 h-4 w-full" />
              <Skeleton className="mb-1 h-8 w-20" />
              <Skeleton className="mb-6 h-3 w-16" />
              <div className="mb-6 space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-3 w-full" />
                ))}
              </div>
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
