"use client";

import { useEffect, useMemo, useState } from "react";
import type { FreeResource } from "@/types/free-resource";

type HubCategory = "news" | "free-resources" | "patch-notes";

interface FreeResourcesResponse {
  resources: FreeResource[];
}

const categories: { value: HubCategory; label: string }[] = [
  { value: "news", label: "News" },
  { value: "free-resources", label: "Free Resources" },
  { value: "patch-notes", label: "Updates Patch Note" },
];

const newsItems = [
  {
    id: "resources-launch",
    title: "Free resource downloads are now live",
    date: "May 21, 2026",
    summary:
      "SkySkills now has a dedicated resource shelf where printable practice materials can be published and downloaded.",
  },
  {
    id: "dern-jood-paper",
    title: "Dern-Jood paper added",
    date: "May 21, 2026",
    summary:
      "The new Dern-Jood paper gives learners a printable sheet for rhythm-based mental math practice.",
  },
];

const patchNotes = [
  {
    id: "admin-resource-manager",
    version: "Resource Admin",
    date: "May 21, 2026",
    notes: [
      "Added admin-managed free resource entries.",
      "Added image, download link, publish state, and sort order controls.",
      "Combined news, resources, and update notes into one public hub.",
    ],
  },
  {
    id: "dern-jood-updates",
    version: "Dern-Jood",
    date: "May 21, 2026",
    notes: [
      "Added downloadable Dern-Jood paper assets.",
      "Updated Dern-Jood topic cover art.",
    ],
  },
];

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<HubCategory>("news");
  const [resources, setResources] = useState<FreeResource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [resourceError, setResourceError] = useState<string | null>(null);

  useEffect(() => {
    const requestedCategory = new URLSearchParams(window.location.search).get(
      "category",
    );

    if (
      requestedCategory === "news" ||
      requestedCategory === "free-resources" ||
      requestedCategory === "patch-notes"
    ) {
      setSelectedCategory(requestedCategory);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadResources() {
      try {
        const response = await fetch("/api/free-resources", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load free resources.");
        }

        const data = (await response.json()) as FreeResourcesResponse;
        if (!ignore) {
          setResources(data.resources);
        }
      } catch (loadError) {
        if (!ignore) {
          setResourceError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load free resources.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoadingResources(false);
        }
      }
    }

    void loadResources();

    return () => {
      ignore = true;
    };
  }, []);

  const categoryDescription = useMemo(() => {
    if (selectedCategory === "free-resources") {
      return "Download printable papers and practice assets published by the SkySkills team.";
    }

    if (selectedCategory === "patch-notes") {
      return "Track product updates, fixes, and new practice materials in one place.";
    }

    return "Read the latest SkySkills announcements and study resource releases.";
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20 text-zinc-900 dark:bg-transparent dark:text-zinc-100">
      <main className="mx-auto max-w-7xl px-6 pt-12">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-yellow-100/80 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
            SKY NOTES
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-5xl">
            News & Resources
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-[family-name:var(--font-inter)] text-sm font-medium text-zinc-500 dark:text-zinc-400 md:text-base">
            {categoryDescription}
          </p>
        </div>

        <div className="mb-12 flex justify-center">
          <div className="flex w-full max-w-4xl flex-wrap gap-1.5 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md md:flex-nowrap md:rounded-2xl">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.value;

              return (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`min-w-[120px] flex-1 rounded-lg px-4 py-2 font-[family-name:var(--font-space-grotesk)] text-[14px] font-bold transition-all md:min-w-0 md:rounded-xl ${
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

        {selectedCategory === "news" && (
          <section className="mx-auto grid max-w-4xl gap-5">
            {newsItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/40"
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-purple dark:text-brand-gold">
                  {item.date}
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {item.summary}
                </p>
              </article>
            ))}
          </section>
        )}

        {selectedCategory === "free-resources" && (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {isLoadingResources && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-zinc-500 shadow-sm dark:border-white/10 dark:bg-black/40 dark:text-zinc-300">
                Loading free resources...
              </div>
            )}

            {resourceError && (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
                {resourceError}
              </div>
            )}

            {!isLoadingResources &&
              !resourceError &&
              resources.map((resource) => (
                <article
                  key={resource.id}
                  className="flex min-h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-black/40"
                >
                  <div
                    role="img"
                    aria-label={resource.title}
                    className="h-56 bg-zinc-100 bg-cover bg-center dark:bg-white/5"
                    style={{ backgroundImage: `url("${resource.imageUrl}")` }}
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
                      {resource.title}
                    </h2>
                    {resource.description && (
                      <p className="mt-3 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {resource.description}
                      </p>
                    )}
                    <a
                      href={resource.downloadUrl}
                      download
                      className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-purple px-5 text-sm font-bold text-white shadow-lg shadow-brand-purple/20 transition hover:opacity-90"
                    >
                      {resource.buttonLabel}
                    </a>
                  </div>
                </article>
              ))}

            {!isLoadingResources && !resourceError && resources.length === 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-zinc-500 shadow-sm dark:border-white/10 dark:bg-black/40 dark:text-zinc-300">
                No free resources are published yet.
              </div>
            )}
          </section>
        )}

        {selectedCategory === "patch-notes" && (
          <section className="mx-auto grid max-w-4xl gap-5">
            {patchNotes.map((patchNote) => (
              <article
                key={patchNote.id}
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/40"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
                    {patchNote.version}
                  </h2>
                  <span className="rounded-lg bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-white/10 dark:text-brand-gold">
                    {patchNote.date}
                  </span>
                </div>
                <ul className="space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {patchNote.notes.map((note) => (
                    <li key={note} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-purple dark:bg-brand-gold" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
