import Link from "next/link";

interface TopicLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function TopicLayout({ title, description, children }: TopicLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Link
          href="/sky-quest"
          className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          ← Back
        </Link>

        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight font-[family-name:var(--font-space-grotesk)]">{title}</h1>
          <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>

        {children}
      </main>
    </div>
  );
}
