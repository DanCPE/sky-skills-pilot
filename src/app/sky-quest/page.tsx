"use client";

import { useState } from "react";
import Link from "next/link";
import { topics } from "@/lib/topics";
import type { TopicCategory } from "@/types";

const categories: { value: TopicCategory | "all"; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "scanning", label: "Scanning" },
  { value: "logical", label: "Logical" },
  { value: "spatial", label: "Spatial" },
  { value: "approximation", label: "Approximation" },
  { value: "short-term-memory", label: "Short-term Memory" },
];

export default function SkyQuestPage() {
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory | "all">("all");

  const filteredTopics =
    selectedCategory === "all"
      ? topics
      : topics.filter((topic) => topic.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Sky Quests
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-zinc-600 dark:text-zinc-400">
            Sky Quests helps you practice different Sky Skills and aptitude areas,
            one challenge at a time, so you can prepare with confidence for pilot
            assessments.
          </p>
        </div>

        {/* Category Filter Sub Navbar */}
        <div className="mb-10">
          <div className="flex flex-wrap gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.value;
              return (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Topic Cards Grid */}
        {filteredTopics.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTopics.map((topic) => (
              <Link
                key={topic.slug}
                href={`/sky-quest/${topic.slug}`}
                className="group flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                {/* Icon */}
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100 text-3xl dark:bg-zinc-800">
                  {topic.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {topic.title}
                  </h2>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {topic.description}
                  </p>
                </div>

                {/* Category Badge */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {topic.category}
                  </span>
                  <span className="text-sm font-medium text-zinc-400 transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-50">
                    Start →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-lg text-zinc-500 dark:text-zinc-400">
              No topics found in this category.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
