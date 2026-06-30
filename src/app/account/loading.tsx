function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

export default function AccountLoading() {
  return (
    <main className="min-h-screen bg-[#f4f6f8] px-5 py-10 text-zinc-950 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto max-w-5xl">
        {/* Profile header */}
        <div className="mb-8 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex flex-col gap-2">
              <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-8 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <div className="h-9 w-32 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-9 w-32 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>

        {/* Main grid: left column + sidebar */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            {/* Profile editor */}
            <Skeleton className="h-48" />
            {/* Fleet / profile manager */}
            <Skeleton className="h-72" />
            {/* Subscription */}
            <Skeleton className="h-64" />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    </main>
  );
}
