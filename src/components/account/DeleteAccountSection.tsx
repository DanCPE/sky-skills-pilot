"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteAccountSection() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canDelete = confirmation === "DELETE" && !isDeleting;

  async function handleDelete() {
    if (!canDelete) return;

    setError(null);
    setIsDeleting(true);

    const response = await fetch("/api/account/delete", {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error || "Failed to delete account.");
      setIsDeleting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <section className="mt-8 rounded-lg border border-red-200 bg-red-50 p-5 dark:border-red-500/25 dark:bg-red-500/10">
      <h2 className="text-xl font-bold text-red-800 dark:text-red-200 font-[family-name:var(--font-space-grotesk)]">
        Delete account
      </h2>
      <p className="mt-3 text-sm leading-6 text-red-700 dark:text-red-100/80">
        This permanently removes your Google-linked SkySkills account, sessions,
        score history, subscription placeholder, and payment placeholder records.
      </p>

      <label
        htmlFor="delete-account-confirmation"
        className="mt-5 block text-sm font-bold text-red-800 dark:text-red-100"
      >
        Type DELETE to confirm
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          id="delete-account-confirmation"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="min-h-10 flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-200 dark:border-red-500/30 dark:bg-black/30 dark:text-zinc-100 dark:focus:ring-red-500/20"
          autoComplete="off"
        />
        <button
          type="button"
          disabled={!canDelete}
          onClick={handleDelete}
          className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-200 disabled:text-red-500 dark:disabled:bg-red-950 dark:disabled:text-red-400"
        >
          {isDeleting ? "Deleting..." : "Delete account"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm font-semibold text-red-700 dark:text-red-200">
          {error}
        </p>
      ) : null}
    </section>
  );
}
