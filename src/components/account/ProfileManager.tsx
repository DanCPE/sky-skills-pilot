"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AccountProfile } from "@/lib/account/db";
import { notifyAccountChanged } from "@/components/Navbar";

export default function ProfileManager({
  profiles,
  activeProfileId,
  maxProfiles,
}: {
  profiles: AccountProfile[];
  activeProfileId: string;
  maxProfiles: number;
}) {
  const router = useRouter();
  const [callSign, setCallSign] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const canCreate = profiles.length < maxProfiles;

  async function createProfile() {
    setError(null);
    setIsBusy(true);
    const response = await fetch("/api/account/profiles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callSign }),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || "Could not create account.");
      setIsBusy(false);
      return;
    }
    setCallSign("");
    setIsBusy(false);
    notifyAccountChanged();
    router.refresh();
  }

  async function switchProfile(profileId: string) {
    setError(null);
    setIsBusy(true);
    const response = await fetch("/api/account/profiles/switch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profileId }),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || "Could not switch account.");
      setIsBusy(false);
      return;
    }
    const selectedProfile = profiles.find((profile) => profile.id === profileId);
    setIsBusy(false);
    notifyAccountChanged(
      selectedProfile
        ? {
            name: selectedProfile.callSign,
            imageUrl: selectedProfile.imageUrl,
          }
        : undefined,
    );
    router.refresh();
  }

  async function deleteProfile(profileId: string) {
    setError(null);
    setIsBusy(true);
    const response = await fetch(`/api/account/profiles?profileId=${profileId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || "Could not delete account.");
      setIsBusy(false);
      return;
    }
    setIsBusy(false);
    notifyAccountChanged();
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
        Fleet accounts
      </p>
      <h2 className="mt-1 text-xl font-bold">Profiles in this fleet</h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        This package allows {maxProfiles}{" "}
        {maxProfiles === 1 ? "profile" : "profiles"} in this fleet.
      </p>

      <div className="mt-5 space-y-3">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3 dark:border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-violet-700 text-sm font-bold text-white">
                {profile.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  profile.callSign.slice(0, 1).toUpperCase()
                )}
              </div>
              <div>
                <p className="font-bold">{profile.callSign}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {profile.id === activeProfileId ? "Active account" : "Available account"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {profile.id !== activeProfileId ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => switchProfile(profile.id)}
                  className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  Use
                </button>
              ) : null}
              {!profile.isDefault && profile.id !== activeProfileId ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => deleteProfile(profile.id)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-50 dark:border-red-500/30 dark:text-red-300"
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={callSign}
          onChange={(event) => setCallSign(event.target.value)}
          placeholder={canCreate ? "New call sign" : "Fleet profile limit reached"}
          disabled={!canCreate || isBusy}
          className="min-h-10 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/40"
        />
        <button
          type="button"
          disabled={!canCreate || isBusy || callSign.trim().length < 2}
          onClick={createProfile}
          className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-950 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
        >
          Create
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm font-semibold text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}
