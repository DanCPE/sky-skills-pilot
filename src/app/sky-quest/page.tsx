"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { topics } from "@/lib/topics";
import type { TopicCategory } from "@/types";

const categories: { value: TopicCategory | "all"; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "scanning", label: "Scanning" },
  { value: "logical", label: "Logical" },
  { value: "spatial", label: "Spatial Orientation" },
  { value: "approximation", label: "Approximation" },
  { value: "short-term-memory", label: "Short Term Memory" },
];

export default function SkyQuestPage() {
  const [selectedCategory, setSelectedCategory] = useState<
    TopicCategory | "all"
  >("all");

  const filteredTopics =
    selectedCategory === "all"
      ? [...topics].sort((a, b) => (a.isLocked === b.isLocked ? 0 : a.isLocked ? 1 : -1))
      : topics.filter((topic) => topic.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-transparent text-zinc-900 dark:text-zinc-100 pb-20">
      <main className="mx-auto max-w-7xl px-6 pt-12">
        {/* Page Header */}
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-yellow-100/80 dark:bg-yellow-900/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-yellow-600 dark:text-yellow-400">
            <span>⚡</span> BASIC ACCESS
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-space-grotesk)]">
            Sky Quests
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm md:text-base text-zinc-500 dark:text-zinc-400 font-medium font-[family-name:var(--font-inter)]">
            Sky Quests helps you practice different Sky Skills and aptitude
            areas, one challenge at a time, so you can prepare with confidence
            for pilot assessments.
          </p>
        </div>

        {/* Category Filter Navbar */}
        <div className="mb-12 flex justify-center">
          <div className="w-full max-w-8xl flex flex-wrap md:flex-nowrap gap-1.5 rounded-xl md:rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-black/40 dark:backdrop-blur-md p-1.5 shadow-sm">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.value;
              return (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`flex-1 min-w-[110px] md:min-w-0 rounded-lg md:rounded-xl px-4 py-2 text-[14px] font-bold font-[family-name:var(--font-space-grotesk)] transition-all ${
                    isSelected
                      ? "bg-violet-700 text-white shadow"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
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
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:gap-10 lg:grid-cols-3">
              {filteredTopics.map((topic) => (
                <div
                  key={topic.slug}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-black/40 dark:backdrop-blur-md transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Top Image/Icon Placeholder area */}
                  <div className="relative flex h-40 w-full items-center justify-center bg-zinc-100/80 dark:bg-white/5 overflow-hidden">
                    {topic.coverImage ? (
                      <>
                        <Image
                          src={topic.coverImage}
                          alt={topic.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500 dark:hidden"
                        />
                        <Image
                          src={topic.coverImageDark ?? topic.coverImage}
                          alt={topic.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500 hidden dark:block"
                        />
                      </>
                    ) : (
                      <span className="text-6xl filter grayscale opacity-60 dark:opacity-70 mix-blend-multiply dark:mix-blend-normal group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                        {topic.icon}
                      </span>
                    )}
                    {topic.isLocked && (
                      <div className="absolute top-4 left-4 z-10 w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white/40 dark:bg-zinc-800/80 flex items-center justify-center shadow-sm backdrop-blur-sm">
                        <Image
                          src="/images/icons/SkyQuests/LOCK.png"
                          alt="Locked"
                          fill
                          className="object-contain p-1.5"
                        />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="mb-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-space-grotesk)]">
                      {topic.title}
                    </h2>
                    <p className="mb-5 flex-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 font-[family-name:var(--font-inter)]">
                      {topic.description}
                    </p>

                    {/* Actions */}
                    {topic.isLocked ? (
                      <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300">
                        <span className="relative w-5 h-5 rounded border border-zinc-300 dark:border-zinc-600 bg-white/80 dark:bg-zinc-700/80 flex-shrink-0">
                          <Image
                            src="/images/icons/SkyQuests/LOCK.png"
                            alt="Subscribe"
                            fill
                            className="object-contain p-1"
                          />
                        </span>
                        Coming Soon
                      </button>
                    ) : (
                      <Link
                        href={`/sky-quest/${topic.slug}`}
                        className="flex w-full items-center justify-center gap-1 rounded-lg bg-brand-purple px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-violet-600 shadow-lg shadow-brand-purple/20 active:scale-[0.98]"
                      >
                        Start Trial <span>→</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500 font-[family-name:var(--font-space-grotesk)]">
              No quests found for this category.
            </p>
          </div>
        )}

        {/* Bottom Banner */}
        <div className="mt-20">
          <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-zinc-100 dark:border-white/10 bg-white dark:bg-black/40 dark:backdrop-blur-md p-8 text-center shadow-2xl shadow-zinc-200/50">
            <div className="mb-4 relative w-16 h-16 mx-auto">
              <Image
                src="/images/icons/SkyQuests/sun.png"
                alt="Unlock Skills"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
            <h3 className="mb-8 text-xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-space-grotesk)]">
              Unlock Your Full Skills
            </h3>
            <button className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-8 py-3 text-sm font-bold text-zinc-900 shadow-md transition-transform hover:scale-105 hover:bg-yellow-300 dark:hover:bg-yellow-500 font-[family-name:var(--font-space-grotesk)]">
              Unlock All Quests
              <span className="relative w-5 h-5 translate-y-[-1px]">
                <Image
                  src="/images/icons/SkyQuests/Takeoff.png"
                  alt="Takeoff"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex gap-4 items-center justify-center">
          <span className="relative w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity">
            <Image
              src="/images/icons/SkyQuests/Like.png"
              alt="Like"
              fill
              className="object-contain"
            />
          </span>
          <span className="relative w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity">
            <Image
              src="/images/icons/SkyQuests/Text box.png"
              alt="Comment"
              fill
              className="object-contain"
            />
          </span>
          <span className="relative w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity">
            <Image
              src="/images/icons/SkyQuests/camera.png"
              alt="Instagram"
              fill
              className="object-contain opacity-80"
            />
          </span>
        </div>
        <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 font-[family-name:var(--font-space-grotesk)]">
          © 2026 SkySkills. All rights reserved. <br />
          <span className="hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer">
            Privacy Policy
          </span>{" "}
          •{" "}
          <span className="hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer">
            Terms of Service
          </span>
        </p>
      </footer>
    </div>
  );
}
