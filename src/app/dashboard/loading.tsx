function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#f4f6f8] px-5 py-10 text-zinc-950 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <Skeleton className="h-10 w-72 sm:w-96" />
          <Skeleton className="h-4 w-64 sm:w-[480px]" />
          <Skeleton className="h-4 w-48 sm:w-80" />
        </div>

        {/* Profile section */}
        <div className="mb-8 flex animate-pulse flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex flex-col gap-2">
              <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-6 w-40 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
          <div className="h-9 w-36 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>

        {/* Main grid: radar + ranking/priority */}
        <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,0.95fr)]">
          <Skeleton className="h-[480px]" />
          <div className="space-y-5">
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
          </div>
        </section>

        {/* Category benchmarking */}
        <section className="mt-8">
          <Skeleton className="mb-5 h-8 w-52" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        </section>

        {/* Global ranking */}
        <section className="mt-8">
          <Skeleton className="mb-5 h-8 w-44" />
          <Skeleton className="h-72" />
        </section>

        {/* History */}
        <section className="mt-8">
          <Skeleton className="h-80" />
        </section>

        {/* Recent scores */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-9 w-24" />
          </div>
          <Skeleton className="h-48" />
        </section>
      </div>
    </main>
  );
}
