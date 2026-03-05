import Link from "next/link";
import { topics } from "@/lib/topics";

export default function SkyQuestPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Sky Quest</h1>
          <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
            Choose a topic to start practising
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/sky-quest/${topic.slug}`}
              className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <span className="text-3xl">{topic.icon}</span>
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {topic.title}
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {topic.description}
                </p>
              </div>
              <span className="mt-auto text-sm font-medium text-zinc-400 transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-50">
                Start →
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
