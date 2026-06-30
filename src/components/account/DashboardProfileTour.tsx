"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export default function DashboardProfileTour({
  children,
}: {
  children: ReactNode;
}) {
  const searchParams = useSearchParams();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [localTourStep, setLocalTourStep] = useState<string | null>(null);
  const tourStep = localTourStep ?? searchParams.get("tour");
  const isTourActive = tourStep === "profiles";

  useEffect(() => {
    setLocalTourStep(searchParams.get("tour"));
  }, [searchParams]);

  useLayoutEffect(() => {
    if (!isTourActive) return;

    sectionRef.current?.scrollIntoView({
      behavior: "instant",
      block: window.innerWidth < 640 ? "start" : "center",
    });
  }, [isTourActive]);

  function closeTour() {
    window.history.replaceState(null, "", "/dashboard");
    setLocalTourStep(null);
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
        <div className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-violet-200 bg-white p-4 text-sm shadow-[0_18px_45px_rgba(76,29,149,0.18)] dark:border-violet-400/20 dark:bg-zinc-950 dark:shadow-[0_18px_45px_rgba(0,0,0,0.55)] sm:absolute sm:inset-x-auto sm:-top-4 sm:right-4 sm:bottom-auto sm:z-10 sm:w-72">
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
