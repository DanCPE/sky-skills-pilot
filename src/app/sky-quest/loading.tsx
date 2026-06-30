function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

export default function SkyQuestLoading() {
  return (
    <div className="min-h-screen bg-[#fafafa] pb-20 dark:bg-transparent">
      <main className="mx-auto max-w-7xl px-6 pt-12">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-12 w-56 rounded-2xl md:w-72" />
          <Skeleton className="h-4 w-72 md:w-[500px]" />
          <Skeleton className="h-4 w-56 md:w-96" />
        </div>

        {/* Category filter tabs */}
        <div className="mb-12 flex justify-center">
          <div className="flex w-full max-w-8xl gap-1.5 rounded-2xl border border-zinc-200 bg-white p-1.5 dark:border-white/10 dark:bg-black/40">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-9 flex-1 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800/60"
              />
            ))}
          </div>
        </div>

        {/* Topic cards grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950"
            >
              <Skeleton className="h-40 w-full rounded-none rounded-t-2xl" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="mt-3 h-9 w-full" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
