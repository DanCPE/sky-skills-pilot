"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { BroadcastSettings } from "@/types/broadcast";

interface BroadcastResponse {
  broadcast: BroadcastSettings;
  error?: string;
}

export default function AdminBroadcastPage() {
  const [phrase, setPhrase] = useState("");
  const [lastSavedPhrase, setLastSavedPhrase] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadBroadcast = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/broadcast", { cache: "no-store" });
      const data = (await response.json()) as Partial<BroadcastResponse>;

      if (!response.ok || !data.broadcast) {
        throw new Error(data.error || "Failed to load broadcast phrase.");
      }

      setPhrase(data.broadcast.phrase);
      setLastSavedPhrase(data.broadcast.phrase);
      setUpdatedAt(data.broadcast.updatedAt);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load broadcast phrase.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBroadcast();
  }, [loadBroadcast]);

  const saveBroadcast = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/broadcast", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrase }),
      });
      const data = (await response.json()) as Partial<BroadcastResponse>;

      if (!response.ok || !data.broadcast) {
        throw new Error(data.error || "Failed to save broadcast phrase.");
      }

      setPhrase(data.broadcast.phrase);
      setLastSavedPhrase(data.broadcast.phrase);
      setUpdatedAt(data.broadcast.updatedAt);
      setNotice(data.broadcast.phrase ? "Broadcast phrase updated." : "Broadcast hidden.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save broadcast phrase.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const clearBroadcast = () => {
    setPhrase("");
    setNotice(null);
    setError(null);
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
              Broadcast
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Set the site-wide phrase shown directly under the main navbar.
            </p>
          </div>

          <form onSubmit={saveBroadcast} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Phrase</span>
              <textarea
                value={phrase}
                onChange={(event) => setPhrase(event.target.value)}
                rows={4}
                maxLength={180}
                placeholder="Leave empty to hide the broadcast band."
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-brand-purple/30 transition focus:ring dark:border-white/15 dark:bg-black/30"
              />
            </label>

            <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{phrase.trim().length}/180 characters</span>
              {updatedAt && (
                <span>Updated {new Date(updatedAt).toLocaleString()}</span>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            {notice && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
                {notice}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving || isLoading}
                className="rounded-xl bg-[#4F12A6] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Broadcast"}
              </button>
              <button
                type="button"
                onClick={clearBroadcast}
                disabled={isSaving || isLoading || !phrase}
                className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black/40">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-purple dark:text-brand-gold">
                Preview
              </p>
              <h2 className="mt-1 text-xl font-bold">Broadcast Band</h2>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                The live site hides this band when the saved phrase is empty.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                lastSavedPhrase.trim()
                  ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                  : "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400"
              }`}
            >
              {lastSavedPhrase.trim() ? "Visible" : "Hidden"}
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/5">
            <div className="flex h-16 items-center justify-center border-b border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-500 dark:border-white/10 dark:bg-black/60 dark:text-zinc-400">
              Navbar
            </div>
            {phrase.trim() ? (
              <div className="border-b border-amber-300/45 bg-amber-100/70 px-6 py-2 text-center text-sm font-bold tracking-wide text-amber-950 backdrop-blur dark:border-amber-500/20 dark:bg-amber-400/55 dark:text-zinc-950">
                {phrase.trim()}
              </div>
            ) : (
              <div className="px-6 py-10 text-center text-sm font-semibold text-zinc-400 dark:text-zinc-500">
                No phrase entered. The broadcast band will be hidden.
              </div>
            )}
            <div className="h-36 bg-[#F8FAFC] dark:bg-black/30" />
          </div>
        </section>
      </main>
    </div>
  );
}
