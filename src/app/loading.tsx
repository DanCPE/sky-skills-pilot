function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/10 ${className}`} />;
}

export default function HomeLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Cockpit bg placeholder */}
      <div className="fixed inset-0 bg-zinc-950" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <Skeleton className="mb-6 h-5 w-36 rounded-full bg-yellow-400/10" />
        <Skeleton className="h-14 w-72 sm:w-[480px]" />
        <Skeleton className="mt-4 h-14 w-56 sm:w-96" />
        <Skeleton className="mt-6 h-5 w-64 sm:w-[440px]" />
        <Skeleton className="mt-2 h-5 w-48 sm:w-80" />

        {/* Stats row */}
        <div className="mt-10 flex gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="mt-10 flex gap-3">
          <Skeleton className="h-12 w-36 rounded-xl" />
          <Skeleton className="h-12 w-36 rounded-xl bg-white/5" />
        </div>
      </div>
    </main>
  );
}
