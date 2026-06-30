"use client";

import { useSyncExternalStore } from "react";

const storageKey = "sky_fleet_profile_guide_dismissed";
const storageEventName = "sky-fleet-profile-guide-storage";

function subscribeToGuideDismissal(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(storageEventName, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(storageEventName, onStoreChange);
  };
}

function getGuideDismissalSnapshot() {
  return localStorage.getItem(storageKey) === "true";
}

function getServerGuideDismissalSnapshot() {
  return false;
}

export default function FleetProfileGuide({
  profileCount,
  maxProfiles,
}: {
  profileCount: number;
  maxProfiles: number;
}) {
  const isDismissed = useSyncExternalStore(
    subscribeToGuideDismissal,
    getGuideDismissalSnapshot,
    getServerGuideDismissalSnapshot,
  );

  function dismissGuide() {
    localStorage.setItem(storageKey, "true");
    window.dispatchEvent(new Event(storageEventName));
  }

  if (isDismissed) return null;

  return (
    <section className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm dark:border-violet-400/20 dark:bg-zinc-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
            Crew setup
          </p>
          <h2 className="mt-1 text-xl font-bold text-zinc-950 dark:text-white">
            Your fleet owns access. Profiles own progress.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Use one fleet for billing and quiz access. Use pilot profiles to keep
            each learner&apos;s scores, rankings, and dashboard separate.
          </p>
        </div>
        <button
          type="button"
          onClick={dismissGuide}
          className="self-start rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-600 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:text-zinc-300 dark:hover:border-violet-400 dark:hover:text-violet-200"
        >
          Got it
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-violet-50 p-4 dark:bg-violet-500/10">
          <p className="text-sm font-bold text-violet-900 dark:text-violet-100">
            Fleet
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Your signed-in email, subscription package, and available crew slots.
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
          <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
            Pilot profile
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            A separate practice identity with its own scores and dashboard.
          </p>
        </div>
        <div className="rounded-xl bg-zinc-50 p-4 dark:bg-white/5">
          <p className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
            Active pilot
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Scores from quizzes are saved to the profile currently marked active.
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        Current fleet: {profileCount} / {maxProfiles}{" "}
        {maxProfiles === 1 ? "profile" : "profiles"} used.
      </p>
    </section>
  );
}
