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
  { value: "short-term-memory", label: "Short Term Memory" },
];

export default function SkyQuestPage() {
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory | "all">("all");

  const filteredTopics =
    selectedCategory === "all"
      ? topics
      : topics.filter((topic) => topic.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 pb-20">
      <main className="mx-auto max-w-5xl px-6 pt-12">
        {/* Page Header */}
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-yellow-100/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-yellow-600">
            <span>⚡</span> BASIC ACCESS
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 font-[family-name:var(--font-space-grotesk)]">
            Sky Quests
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm md:text-base text-zinc-500 font-medium font-[family-name:var(--font-space-grotesk)]">
            Sky Quests helps you practice different Sky Skills and aptitude areas, one challenge at a time, so you can prepare with confidence for pilot assessments.
          </p>
        </div>

        {/* Category Filter Navbar */}
        <div className="mb-12 flex justify-center">
          <div className="w-full flex-wrap flex md:flex-nowrap md:inline-flex rounded-xl md:rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-sm">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.value;
              return (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`flex-1 min-w-[120px] rounded-lg md:rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-violet-700 text-white shadow"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredTopics.map((topic) => (
              <div
                key={topic.slug}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:shadow-xl hover:-translate-y-1"
              >
                {/* Top Image/Icon Placeholder area */}
                <div className="relative flex h-40 w-full items-center justify-center bg-zinc-100/80">
                  {topic.isLocked && (
                    <div className="absolute top-3 left-3 text-yellow-500 text-sm">
                      🔒
                    </div>
                  )}
                  <span className="text-6xl filter grayscale opacity-60 mix-blend-multiply group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                    {topic.icon}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="mb-2 text-sm font-bold text-zinc-900">
                    {topic.title}
                  </h2>
                  <p className="mb-5 flex-1 text-xs leading-relaxed text-zinc-500">
                    {topic.description}
                  </p>

                  {/* Actions */}
                  {topic.isLocked ? (
                    <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-xs font-bold text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700">
                      <span>🔒</span> Subscribe to Unlock
                    </button>
                  ) : (
                    <Link
                      href={`/sky-quest/${topic.slug}`}
                      className="flex w-full items-center justify-center gap-1 rounded-lg bg-violet-700 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-violet-600"
                    >
                      Start Trial <span>→</span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-sm font-medium text-zinc-400">
              No quests found for this category.
            </p>
          </div>
        )}

        {/* Bottom Banner */}
        <div className="mt-20">
          <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-zinc-100 bg-white p-8 text-center shadow-2xl shadow-zinc-200/50">
            <div className="mb-2 text-2xl text-yellow-400">☀️</div>
            <h3 className="mb-1 text-xl font-bold text-zinc-900">Unlock Your Full Skills</h3>
            <div className="mx-auto mb-6 h-px w-20 bg-zinc-200 border-b border-dashed border-zinc-300"></div>
            <button className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-8 py-3 text-sm font-bold text-zinc-900 shadow-md transition-transform hover:scale-105 hover:bg-yellow-300">
              Unlock All Quests <span>✈️</span>
            </button>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="mt-20 flex flex-col items-center justify-center gap-4 text-center">
        <div className="flex gap-4 text-xl text-zinc-400">
          <span className="cursor-pointer hover:text-zinc-600">👍</span>
          <span className="cursor-pointer hover:text-zinc-600">💬</span>
          <span className="cursor-pointer hover:text-zinc-600">📸</span>
        </div>
        <p className="text-[10px] font-medium text-zinc-400">
          © 2026 SkySkills. All rights reserved. <br/>
          <span className="hover:text-zinc-600 cursor-pointer">Privacy Policy</span> • <span className="hover:text-zinc-600 cursor-pointer">Terms of Service</span>
        </p>
      </footer>
    </div>
  );
}
