"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Topic, TopicCategory } from "@/types";

type AccessTopic = Topic & {
  requiresPaid?: boolean;
};

const categories: { value: TopicCategory | "all"; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "scanning", label: "Scanning" },
  { value: "logical", label: "Logical" },
  { value: "spatial", label: "Spatial Orientation" },
  { value: "approximation", label: "Approximation" },
  { value: "short-term-memory", label: "Short Term Memory" },
  { value: "multitasking", label: "Multitasking" },
];

export default function SkyQuestBrowser({
  topics,
  isPaid,
}: {
  topics: AccessTopic[];
  isPaid: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState<
    TopicCategory | "all"
  >("all");

  const filteredTopics =
    selectedCategory === "all"
      ? [...topics].sort((a, b) =>
          a.isLocked === b.isLocked ? 0 : a.isLocked ? 1 : -1,
        )
      : topics.filter((topic) => topic.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20 text-zinc-900 dark:bg-transparent dark:text-zinc-100">
      <main className="mx-auto max-w-7xl px-6 pt-12">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-yellow-100/80 px-3 py-1 text-[10px] font-bold uppercase text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
            <span>{isPaid ? "★" : "⚡"}</span>
            {isPaid ? "Full Access" : "Basic Access"}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-5xl">
            Sky Quests
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium text-zinc-500 dark:text-zinc-400 md:text-base">
            Sky Quests helps you practice different Sky Skills and aptitude
            areas, one challenge at a time, so you can prepare with confidence
            for pilot assessments.
          </p>
        </div>

        <div className="mb-12 flex justify-center">
          <div className="flex w-full max-w-8xl flex-wrap gap-1.5 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md md:flex-nowrap md:rounded-2xl">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.value;
              return (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`min-w-fit flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-[14px] font-bold transition-all md:rounded-xl ${
                    isSelected
                      ? "bg-violet-700 text-white shadow"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {filteredTopics.length > 0 ? (
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:gap-10 lg:grid-cols-3">
              {filteredTopics.map((topic) => (
                <div
                  key={topic.slug}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md"
                >
                  <div
                    className={`relative flex h-40 w-full items-center justify-center overflow-hidden ${
                      topic.coverBg ?? "bg-zinc-100/80 dark:bg-white/5"
                    }`}
                  >
                    {topic.coverImage ? (
                      <>
                        <Image
                          src={topic.coverImage}
                          alt={topic.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105 dark:hidden"
                        />
                        <Image
                          src={topic.coverImageDark ?? topic.coverImage}
                          alt={topic.title}
                          fill
                          className="hidden object-cover transition-transform duration-500 group-hover:scale-105 dark:block"
                        />
                      </>
                    ) : (
                      <span className="text-6xl opacity-60 mix-blend-multiply grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0 dark:opacity-70 dark:mix-blend-normal">
                        {topic.icon}
                      </span>
                    )}
                    {topic.isLocked ? (
                      <div className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white/40 shadow-sm backdrop-blur-sm dark:border-zinc-600 dark:bg-zinc-800/80">
                        <Image
                          src="/images/icons/SkyQuests/LOCK.png"
                          alt="Locked"
                          fill
                          className="object-contain p-1.5"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="mb-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {topic.title}
                    </h2>
                    <p className="mb-5 flex-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {topic.description}
                    </p>

                    {topic.isLocked ? (
                      <Link
                        href="/subscription"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-xs font-bold text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                      >
                        <span className="relative h-5 w-5 flex-shrink-0 rounded border border-zinc-300 bg-white/80 dark:border-zinc-600 dark:bg-zinc-700/80">
                          <Image
                            src="/images/icons/SkyQuests/LOCK.png"
                            alt="Subscribe"
                            fill
                            className="object-contain p-1"
                          />
                        </span>
                        Upgrade required
                      </Link>
                    ) : (
                      <Link
                        href={`/sky-quest/${topic.slug}`}
                        className="flex w-full items-center justify-center gap-1 rounded-lg bg-brand-purple px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-purple/20 transition-all hover:bg-violet-600 active:scale-[0.98]"
                      >
                        Start Quest <span>→</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
              No quests found for this category.
            </p>
          </div>
        )}
      </main>

      <footer className="mt-20 flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex items-center justify-center gap-4">
          <span className="relative h-6 w-6 cursor-pointer transition-opacity hover:opacity-80">
            <Image
              src="/images/icons/SkyQuests/Like.png"
              alt="Like"
              fill
              className="object-contain"
            />
          </span>
          <span className="relative h-6 w-6 cursor-pointer transition-opacity hover:opacity-80">
            <Image
              src="/images/icons/SkyQuests/Text box.png"
              alt="Comment"
              fill
              className="object-contain"
            />
          </span>
          <span className="relative h-6 w-6 cursor-pointer transition-opacity hover:opacity-80">
            <Image
              src="/images/icons/SkyQuests/camera.png"
              alt="Instagram"
              fill
              className="object-contain opacity-80"
            />
          </span>
        </div>
        <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
          © 2026 SkySkills. All rights reserved. <br />
          <Link href="/privacy" className="hover:text-zinc-600 dark:hover:text-zinc-300">
            Privacy Policy
          </Link>{" "}
          •{" "}
          <Link href="/terms" className="hover:text-zinc-600 dark:hover:text-zinc-300">
            Terms of Service
          </Link>
        </p>
      </footer>
    </div>
  );
}
