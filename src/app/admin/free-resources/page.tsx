"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { FreeResource } from "@/types/free-resource";

interface ResourcesResponse {
  resources: FreeResource[];
}

interface ResourceFormState {
  id: string | null;
  title: string;
  description: string;
  imageUrl: string;
  downloadUrl: string;
  buttonLabel: string;
  isPublished: boolean;
  sortOrder: number;
}

const emptyForm: ResourceFormState = {
  id: null,
  title: "",
  description: "",
  imageUrl: "",
  downloadUrl: "",
  buttonLabel: "Download Free Resource",
  isPublished: true,
  sortOrder: 100,
};

function formFromResource(resource: FreeResource): ResourceFormState {
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    imageUrl: resource.imageUrl,
    downloadUrl: resource.downloadUrl,
    buttonLabel: resource.buttonLabel,
    isPublished: resource.isPublished,
    sortOrder: resource.sortOrder,
  };
}

export default function AdminFreeResourcesPage() {
  const [resources, setResources] = useState<FreeResource[]>([]);
  const [form, setForm] = useState<ResourceFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isEditing = Boolean(form.id);

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/free-resources", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load resources.");
      }

      const data = (await response.json()) as ResourcesResponse;
      setResources(data.resources);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load resources.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const sortedResources = useMemo(
    () =>
      [...resources].sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.title.localeCompare(b.title);
      }),
    [resources],
  );

  const updateForm = <Key extends keyof ResourceFormState>(
    key: Key,
    value: ResourceFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setError(null);
    setNotice(null);
  };

  const saveResource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const payload = {
        id: form.id,
        title: form.title,
        description: form.description,
        imageUrl: form.imageUrl,
        downloadUrl: form.downloadUrl,
        buttonLabel: form.buttonLabel,
        isPublished: form.isPublished,
        sortOrder: form.sortOrder,
      };

      const response = await fetch("/api/admin/free-resources", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        resource?: FreeResource;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to save resource.");
      }

      setNotice(isEditing ? "Resource updated." : "Resource created.");
      setForm(emptyForm);
      await loadResources();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save resource.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteResource = async (resource: FreeResource) => {
    const confirmed = window.confirm(`Delete "${resource.title}"?`);
    if (!confirmed) return;

    setError(null);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/admin/free-resources?id=${encodeURIComponent(resource.id)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete resource.");
      }

      if (form.id === resource.id) {
        setForm(emptyForm);
      }

      setNotice("Resource deleted.");
      await loadResources();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete resource.",
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
              Free Resources
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Manage the image and download link shown on `/free-resources`.
            </p>
          </div>

          <form onSubmit={saveResource} className="space-y-4">
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
              <span className="mb-1 block text-sm font-semibold">Description</span>
              <textarea
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-brand-purple/30 transition focus:ring dark:border-white/15 dark:bg-black/30"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Image URL</span>
              <input
                value={form.imageUrl}
                onChange={(event) => updateForm("imageUrl", event.target.value)}
                placeholder="/images/dern-jood/mix.png"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-brand-purple/30 transition focus:ring dark:border-white/15 dark:bg-black/30"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Download URL</span>
              <input
                value={form.downloadUrl}
                onChange={(event) => updateForm("downloadUrl", event.target.value)}
                placeholder="/images/dern-jood/circle%20pdf.pdf"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-brand-purple/30 transition focus:ring dark:border-white/15 dark:bg-black/30"
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold">Button Label</span>
                <input
                  value={form.buttonLabel}
                  onChange={(event) => updateForm("buttonLabel", event.target.value)}
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
            </div>

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

            {form.imageUrl && (
              <div
                role="img"
                aria-label="Resource preview"
                className="h-36 rounded-xl border border-zinc-200 bg-zinc-100 bg-cover bg-center dark:border-white/10 dark:bg-white/5"
                style={{ backgroundImage: `url("${form.imageUrl}")` }}
              />
            )}

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
                {isSaving ? "Saving..." : isEditing ? "Update Resource" : "Create Resource"}
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
                Managed Resources
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {resources.length} total
              </p>
            </div>
            <button
              onClick={() => void loadResources()}
              disabled={isLoading}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-bold transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:hover:bg-white/5"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-white/10">
            {isLoading && (
              <div className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
                Loading resources...
              </div>
            )}

            {!isLoading &&
              sortedResources.map((resource) => (
                <article
                  key={resource.id}
                  className="grid gap-4 p-5 md:grid-cols-[12rem_1fr_auto]"
                >
                  <div
                    role="img"
                    aria-label={resource.title}
                    className="h-32 rounded-xl bg-zinc-100 bg-cover bg-center dark:bg-white/5"
                    style={{ backgroundImage: `url("${resource.imageUrl}")` }}
                  />
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold">
                        {resource.title}
                      </h3>
                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                          resource.isPublished
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-200"
                            : "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-300"
                        }`}
                      >
                        {resource.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {resource.description || "No description"}
                    </p>
                    <div className="mt-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <p className="truncate">Image: {resource.imageUrl}</p>
                      <p className="truncate">Download: {resource.downloadUrl}</p>
                      <p>Sort order: {resource.sortOrder}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 md:flex-col">
                    <button
                      onClick={() => {
                        setForm(formFromResource(resource));
                        setNotice(null);
                        setError(null);
                      }}
                      className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void deleteResource(resource)}
                      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 dark:border-red-900/70 dark:text-red-200 dark:hover:bg-red-950/40"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}

            {!isLoading && sortedResources.length === 0 && (
              <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No resources yet. Create the first one with the form.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
