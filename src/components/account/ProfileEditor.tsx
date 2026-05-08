"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfileEditor({
  initialName,
  initialImageUrl,
}: {
  initialName: string;
  initialImageUrl: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [imageUrl, setImageUrl] = useState(initialImageUrl ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSaved(false);
    setIsSaving(true);

    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        imageUrl: imageUrl.trim() || null,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error || "Failed to update profile.");
      setIsSaving(false);
      return;
    }

    setSaved(true);
    setIsSaving(false);
    router.refresh();
  }

  return (
    <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
      <h2 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)]">
        Edit profile
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        This changes the username and profile picture shown inside SkySkills.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="profile-name"
            className="block text-sm font-bold text-zinc-700 dark:text-zinc-200"
          >
            Username
          </label>
          <input
            id="profile-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            maxLength={80}
            className="mt-2 min-h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-white/10 dark:bg-black/30 dark:text-zinc-100 dark:focus:ring-violet-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="profile-image-url"
            className="block text-sm font-bold text-zinc-700 dark:text-zinc-200"
          >
            Profile picture URL
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              id="profile-image-url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://example.com/profile.jpg"
              className="min-h-10 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-white/10 dark:bg-black/30 dark:text-zinc-100 dark:focus:ring-violet-500/20"
            />
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-violet-700 text-sm font-bold text-white dark:border-white/10">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                name.slice(0, 1).toUpperCase() || "S"
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-800"
          >
            {isSaving ? "Saving..." : "Save profile"}
          </button>
          {saved ? (
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">
              Profile updated.
            </p>
          ) : null}
          {error ? (
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              {error}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
