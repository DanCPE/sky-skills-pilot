"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const searchParams = useSearchParams();
  const sectionRef = useRef<HTMLElement | null>(null);
  const slotsRef = useRef<HTMLDivElement | null>(null);
  const [callSign, setCallSign] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const canCreate = profiles.length < maxProfiles;
  const remainingProfiles = Math.max(0, maxProfiles - profiles.length);
  const tourStep = searchParams.get("tour");
  const isFleetTourActive = tourStep === "fleet";
  const isSlotsTourActive = tourStep === "slots";

  useEffect(() => {
    if (!isFleetTourActive && !isSlotsTourActive) return;

    window.requestAnimationFrame(() => {
      const target = isSlotsTourActive ? slotsRef.current : sectionRef.current;
      target?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [isFleetTourActive, isSlotsTourActive]);

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

  function closeFleetTour() {
    router.replace("/account", { scroll: false });
  }

  function showSlotsTour() {
    router.replace("/account?tour=slots", { scroll: false });
  }

  function showDashboardTour() {
    router.push("/dashboard?tour=profiles");
  }

  return (
    <section
      ref={sectionRef}
      className={`relative rounded-2xl border bg-white p-5 shadow-sm transition dark:bg-zinc-950 ${
        isFleetTourActive
          ? "border-violet-300 shadow-[0_0_0_4px_rgba(139,92,246,0.12),0_22px_60px_rgba(76,29,149,0.18)] dark:border-violet-400/40"
          : "border-zinc-200 dark:border-white/10"
      }`}
    >
      {isFleetTourActive ? (
        <div className="absolute -top-4 right-4 z-10 w-72 rounded-2xl border border-violet-200 bg-white p-4 text-sm shadow-[0_18px_45px_rgba(76,29,149,0.18)] dark:border-violet-400/20 dark:bg-zinc-950 dark:shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
          <button
            type="button"
            onClick={closeFleetTour}
            aria-label="Close tutorial"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-100"
          >
            <span aria-hidden="true">x</span>
          </button>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
            Fleet setup
          </p>
          <p className="mt-2 font-bold text-zinc-950 dark:text-zinc-50">
            This is where pilots are managed.
          </p>
          <p className="mt-2 leading-6 text-zinc-600 dark:text-zinc-300">
            Add pilot profiles, switch the active pilot before practicing, and
            check how many profile slots your package includes.
          </p>
          <button
            type="button"
            onClick={showSlotsTour}
            className="mt-4 rounded-xl bg-violet-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-600"
          >
            Next
          </button>
        </div>
      ) : null}
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
        Fleet accounts
      </p>
      <h2 className="mt-1 text-xl font-bold">Profiles in this fleet</h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Switch the active pilot before practicing. Scores, rankings, and
        dashboard progress are saved to that profile only.
      </p>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-zinc-50 p-3 dark:bg-white/5">
          <p className="font-bold text-zinc-950 dark:text-zinc-100">
            Fleet slots
          </p>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            {profiles.length} / {maxProfiles}{" "}
            {maxProfiles === 1 ? "profile" : "profiles"} used.
          </p>
        </div>
        <div
          ref={slotsRef}
          className={`relative rounded-xl bg-zinc-50 p-3 transition dark:bg-white/5 ${
            isSlotsTourActive
              ? "shadow-[0_0_0_4px_rgba(139,92,246,0.16),0_18px_45px_rgba(76,29,149,0.16)]"
              : ""
          }`}
        >
          {isSlotsTourActive ? (
            <div className="absolute right-0 top-full z-10 mt-3 w-72 rounded-2xl border border-violet-200 bg-white p-4 text-sm shadow-[0_18px_45px_rgba(76,29,149,0.18)] dark:border-violet-400/20 dark:bg-zinc-950 dark:shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
              <button
                type="button"
                onClick={closeFleetTour}
                aria-label="Close tutorial"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-100"
              >
                <span aria-hidden="true">x</span>
              </button>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                Available slots
              </p>
              <p className="mt-2 font-bold text-zinc-950 dark:text-zinc-50">
                Your package controls how many pilots fit in this fleet.
              </p>
              <p className="mt-2 leading-6 text-zinc-600 dark:text-zinc-300">
                Each slot can hold a separate pilot profile. Upgrade to add more
                profiles when this fleet is full.
              </p>
              <button
                type="button"
                onClick={showDashboardTour}
                className="mt-4 rounded-xl bg-violet-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-600"
              >
                Next
              </button>
            </div>
          ) : null}
          <p className="font-bold text-zinc-950 dark:text-zinc-100">
            Available slots
          </p>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            {remainingProfiles === 0
              ? "Upgrade your package to add more pilots."
              : `${remainingProfiles} ${
                  remainingProfiles === 1 ? "profile" : "profiles"
                } remaining.`}
          </p>
        </div>
      </div>

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
                  {profile.id === activeProfileId
                    ? "Active pilot - new quiz scores save here"
                    : "Available pilot profile"}
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
          placeholder={
            canCreate ? "New pilot call sign" : "Fleet profile limit reached"
          }
          disabled={!canCreate || isBusy}
          className="min-h-10 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-semibold outline-none dark:border-white/10 dark:bg-black/40"
        />
        <button
          type="button"
          disabled={!canCreate || isBusy || callSign.trim().length < 2}
          onClick={createProfile}
          className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-white dark:text-zinc-950 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
        >
          Add pilot
        </button>
      </div>

      {!canCreate ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Your current package has no open profile slots. Choose a larger
          package to add more pilots to this fleet.
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm font-semibold text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}
