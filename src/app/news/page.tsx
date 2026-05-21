export default function NewsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight font-[family-name:var(--font-space-grotesk)]">News</h1>
          <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
            Coming soon
          </p>
          <div className="mt-8 flex justify-center">
            <div className="text-6xl">📰</div>
          </div>
        </div>
      </main>
    </div>
  );
}
