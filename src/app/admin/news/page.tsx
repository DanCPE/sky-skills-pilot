"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { NewsItem } from "@/types/news";

interface NewsResponse {
  items: NewsItem[];
}

interface NewsFormState {
  id: string | null;
  title: string;
  date: string;
  summary: string;
  isPublished: boolean;
  sortOrder: number;
}

const emptyForm: NewsFormState = {
  id: null,
  title: "",
  date: "",
  summary: "",
  isPublished: true,
  sortOrder: 100,
};

function formFromItem(item: NewsItem): NewsFormState {
  return {
    id: item.id,
    title: item.title,
    date: item.date,
    summary: item.summary,
    isPublished: item.isPublished,
    sortOrder: item.sortOrder,
  };
}

export default function AdminNewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [form, setForm] = useState<NewsFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isEditing = Boolean(form.id);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/news", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Failed to load news items.");
      }

      const data = (await response.json()) as NewsResponse;
      setItems(data.items);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load news items.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.title.localeCompare(b.title);
      }),
    [items],
  );

  const updateForm = <Key extends keyof NewsFormState>(
    key: Key,
    value: NewsFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setError(null);
    setNotice(null);
  };

  const saveItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const payload = {
        id: form.id,
        title: form.title,
        date: form.date,
        summary: form.summary,
        isPublished: form.isPublished,
        sortOrder: form.sortOrder,
      };

      const response = await fetch("/api/admin/news", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        item?: NewsItem;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to save news item.");
      }

      setNotice(isEditing ? "News item updated." : "News item created.");
      setForm(emptyForm);
      await loadItems();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save news item.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (item: NewsItem) => {
    const confirmed = window.confirm(`Delete "${item.title}"?`);
    if (!confirmed) return;

    setError(null);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/admin/news?id=${encodeURIComponent(item.id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete news item.");
      }

      if (form.id === item.id) {
        setForm(emptyForm);
      }

      setNotice("News item deleted.");
      await loadItems();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete news item.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 pb-12 pt-8 text-zinc-900 dark:bg-transparent dark:text-zinc-100 sm:px-6">
      <main className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[24rem_1fr]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black/40">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-purple dark:text-brand-gold">
              Admin
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
              News
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Manage the news items shown on `/news`.
            </p>
          </div>

          <form onSubmit={saveItem} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Title</span>
              <input
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-brand-purple/30 transition focus:ring dark:border-white/15 dark:bg-black/30"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Date</span>
              <input
                value={form.date}
                onChange={(event) => updateForm("date", event.target.value)}
                placeholder="May 21, 2026"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-brand-purple/30 transition focus:ring dark:border-white/15 dark:bg-black/30"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Summary</span>
              <textarea
                value={form.summary}
                onChange={(event) => updateForm("summary", event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-brand-purple/30 transition focus:ring dark:border-white/15 dark:bg-black/30"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Sort Order</span>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(event) =>
                  updateForm("sortOrder", Number(event.target.value))
                }
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-brand-purple/30 transition focus:ring dark:border-white/15 dark:bg-black/30"
              />
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold dark:border-white/10 dark:bg-white/5">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) =>
                  updateForm("isPublished", event.target.checked)
                }
                className="h-4 w-4 accent-brand-purple"
              />
              Published on public page
            </label>

            {error && (
              <p className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </p>
            )}

            {notice && (
              <p className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/70 dark:bg-green-950/40 dark:text-green-200">
                {notice}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="min-h-11 flex-1 rounded-xl bg-brand-purple px-4 text-sm font-bold text-white shadow-lg shadow-brand-purple/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                {isSaving ? "Saving..." : isEditing ? "Update News Item" : "Create News Item"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-11 rounded-xl border border-zinc-300 px-4 text-sm font-bold transition hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-black/40">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-5 dark:border-white/10">
            <div>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold">
                Managed News
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {items.length} total
              </p>
            </div>
            <button
              onClick={() => void loadItems()}
              disabled={isLoading}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-bold transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:hover:bg-white/5"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-white/10">
            {isLoading && (
              <div className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
                Loading news items...
              </div>
            )}

            {!isLoading &&
              sortedItems.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-4 p-5 md:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold">
                        {item.title}
                      </h3>
                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                          item.isPublished
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-200"
                            : "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-300"
                        }`}
                      >
                        {item.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-purple dark:text-brand-gold">
                      {item.date}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {item.summary || "No summary"}
                    </p>
                    <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                      Sort order: {item.sortOrder}
                    </p>
                  </div>
                  <div className="flex gap-2 md:flex-col">
                    <button
                      onClick={() => {
                        setForm(formFromItem(item));
                        setNotice(null);
                        setError(null);
                      }}
                      className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void deleteItem(item)}
                      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 dark:border-red-900/70 dark:text-red-200 dark:hover:bg-red-950/40"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}

            {!isLoading && sortedItems.length === 0 && (
              <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No news items yet. Create the first one with the form.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
