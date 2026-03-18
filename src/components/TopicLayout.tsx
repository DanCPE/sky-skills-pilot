import Link from "next/link";

interface TopicLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export default function TopicLayout({ title, description, children, fullWidth }: TopicLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-transparent text-[var(--foreground)]">
      <main className={`${fullWidth ? "w-full py-12 pl-4 pr-6" : "mx-auto max-w-4xl px-6 py-12"}`}>
        <Link
          href="/sky-quest"
          className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-brand-gold/80 dark:hover:text-brand-gold"
        >
          ← BACK TO EXAMS
        </Link>

        <div className="mb-10 text-center flex flex-col items-center">
          <h1 className="text-4xl font-bold tracking-tight font-[family-name:var(--font-space-grotesk)] dark:text-brand-gold uppercase">{title}</h1>
          <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400 max-w-2xl">{description}</p>
        </div>

        {children}
      </main>
    </div>
  );
}
