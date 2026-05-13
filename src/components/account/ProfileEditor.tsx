"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { notifyAccountChanged } from "@/components/Navbar";

export default function ProfileEditor({
  initialName,
  initialImageUrl,
}: {
  initialName: string;
  initialImageUrl: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(initialImageUrl);
  const [removeImage, setRemoveImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  function clearObjectUrl() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }

  useEffect(() => clearObjectUrl, []);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setError(null);
    setSaved(false);
    setSelectedFile(file);
    if (file) {
      clearObjectUrl();
      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
      setRemoveImage(false);
    } else {
      clearObjectUrl();
      setPreviewUrl(removeImage ? null : initialImageUrl);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSaved(false);
    setIsSaving(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("removeImage", String(removeImage));
    if (selectedFile) {
      formData.set("image", selectedFile);
    }

    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      body: formData,
    });

    const data = (await response.json().catch(() => null)) as {
      error?: string;
      user?: {
        name?: string;
        imageUrl?: string | null;
      };
    } | null;

    if (!response.ok) {
      setError(data?.error || "Failed to update profile.");
      setIsSaving(false);
      return;
    }

    setSaved(true);
    setIsSaving(false);
    setSelectedFile(null);
    notifyAccountChanged({
      name: data?.user?.name || name,
      imageUrl: data?.user?.imageUrl ?? (removeImage ? null : previewUrl),
    });
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
            Profile
          </p>
          <h2 className="mt-1 text-xl font-bold text-zinc-950 dark:text-white">
            Account identity
          </h2>
        </div>
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-violet-700 text-xl font-bold text-white dark:border-white/10">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            name.slice(0, 1).toUpperCase() || "S"
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="profile-name"
            className="block text-sm font-bold text-zinc-700 dark:text-zinc-200"
          >
            Call sign
          </label>
          <input
            id="profile-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSaved(false);
            }}
            minLength={2}
            maxLength={80}
            className="mt-2 min-h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-950 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-white/10 dark:bg-black/40 dark:text-zinc-100 dark:focus:ring-violet-500/20"
          />
        </div>

        <div>
          <label
            htmlFor="profile-image"
            className="block text-sm font-bold text-zinc-700 dark:text-zinc-200"
          >
            Profile picture upload
          </label>
          <input
            id="profile-image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="mt-2 block w-full rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3 text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-700 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white hover:border-violet-300 dark:border-white/10 dark:bg-black/40 dark:text-zinc-300"
          />
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            JPG, PNG, or WebP. Stored in the app database. Max 750 KB.
          </p>
        </div>

        {initialImageUrl || selectedFile ? (
          <label className="flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={removeImage}
              onChange={(event) => {
                setRemoveImage(event.target.checked);
                if (event.target.checked) {
                  clearObjectUrl();
                  setSelectedFile(null);
                  setPreviewUrl(null);
                } else {
                  setPreviewUrl(initialImageUrl);
                }
                setSaved(false);
              }}
              className="h-4 w-4 rounded border-zinc-300 text-violet-700 focus:ring-violet-500"
            />
            Remove current profile picture
          </label>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-800"
          >
            {isSaving ? "Saving..." : "Save profile"}
          </button>
          {saved ? (
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
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
