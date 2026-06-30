function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

export default function PaymentLoading() {
  return (
    <main className="min-h-screen bg-[#f4f6f8] px-5 py-16 dark:bg-black">
      <div className="mx-auto max-w-xl">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="mb-8 h-4 w-72" />

        {/* Package summary */}
        <div className="mb-6 animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>

        {/* Payment form */}
        <div className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <Skeleton className="mb-4 h-5 w-36" />
          <Skeleton className="mb-4 h-10 w-full rounded-xl" />
          <Skeleton className="mb-4 h-10 w-full rounded-xl" />
          <Skeleton className="mb-6 h-40 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </main>
  );
}
