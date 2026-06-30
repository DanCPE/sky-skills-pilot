"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Phase = "idle" | "start" | "fill" | "done";

function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNavigatingRef = useRef(false);

  // start → fill: delay two frames so the browser paints at 0% first
  useEffect(() => {
    if (phase !== "start") return;
    let cancelled = false;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!cancelled) setPhase("fill");
      }),
    );
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [phase]);

  // Navigation completed → run the finish animation then go idle
  useEffect(() => {
    if (!isNavigatingRef.current) return;
    isNavigatingRef.current = false;
    setPhase("done");
    timerRef.current = setTimeout(() => setPhase("idle"), 500);
  }, [pathname, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Patch history.pushState to detect navigation start
  useEffect(() => {
    const orig = history.pushState.bind(history);

    function start() {
      if (timerRef.current) clearTimeout(timerRef.current);
      isNavigatingRef.current = true;
      setPhase("start");
    }

    history.pushState = function (...args) {
      start();
      return orig(...args);
    };

    window.addEventListener("popstate", start);
    return () => {
      history.pushState = orig;
      window.removeEventListener("popstate", start);
    };
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  if (phase === "idle") return null;

  const width =
    phase === "start" ? "0%" : phase === "fill" ? "80%" : "100%";
  const opacity = phase === "done" ? 0 : 1;
  const transition =
    phase === "start"
      ? "none"
      : phase === "fill"
        ? "width 3s cubic-bezier(0.1, 0.4, 0.5, 0.9)"
        : "width 200ms ease-out, opacity 300ms 150ms ease-out";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]"
    >
      <div
        style={{ width, opacity, transition }}
        className="h-full bg-violet-600 dark:bg-violet-400"
      />
    </div>
  );
}

// Suspense boundary is required because ProgressBar uses useSearchParams
export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressBar />
    </Suspense>
  );
}
