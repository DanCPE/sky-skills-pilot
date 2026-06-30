"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useLayoutEffect, useRef, type ReactNode } from "react";

export default function DashboardProfileTour({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionRef = useRef<HTMLElement | null>(null);
  const isTourActive = searchParams.get("tour") === "profiles";

  useLayoutEffect(() => {
    if (!isTourActive) return;

    sectionRef.current?.scrollIntoView({
      behavior: "instant",
      block: "center",
    });
  }, [isTourActive]);

  function closeTour() {
    router.replace("/dashboard", { scroll: false });
  }

  return (
    <section
      ref={sectionRef}
      className={`relative mb-8 flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm transition dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between ${
        isTourActive
          ? "border-violet-300 shadow-[0_0_0_4px_rgba(139,92,246,0.12),0_22px_60px_rgba(76,29,149,0.18)] dark:border-violet-400/40"
          : "border-zinc-200 dark:border-white/10"
      }`}
    >
      {isTourActive ? (
        <div className="absolute -top-4 right-4 z-10 w-72 rounded-2xl border border-violet-200 bg-white p-4 text-sm shadow-[0_18px_45px_rgba(76,29,149,0.18)] dark:border-violet-400/20 dark:bg-zinc-950 dark:shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
          <button
            type="button"
            onClick={closeTour}
            aria-label="Close tutorial"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-100"
          >
            <span aria-hidden="true">x</span>
          </button>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
            Profile dashboard
          </p>
          <p className="mt-2 font-bold text-zinc-950 dark:text-zinc-50">
            Every pilot has separate stats.
          </p>
          <p className="mt-2 leading-6 text-zinc-600 dark:text-zinc-300">
            When you switch profiles, this dashboard changes to that pilot&apos;s
            own scores, rankings, history, and progress.
          </p>
          <button
            type="button"
            onClick={closeTour}
            className="mt-4 rounded-xl bg-violet-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-600"
          >
            Finish
          </button>
        </div>
      ) : null}
      {children}
    </section>
  );
}
