"use client";

import { useEffect, useState } from "react";

type BroadcastResponse = {
  broadcast?: {
    phrase?: string;
  };
};

export default function BroadcastBand() {
  const [phrase, setPhrase] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/broadcast", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: BroadcastResponse | null) => {
        setPhrase(data?.broadcast?.phrase?.trim() ?? "");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setPhrase("");
      });

    return () => controller.abort();
  }, []);

  if (!phrase) return null;

  return (
    <div className="border-b border-amber-300/45 bg-amber-100/70 text-amber-950 shadow-sm backdrop-blur dark:border-amber-500/20 dark:bg-amber-400/55 dark:text-zinc-950">
      <div className="mx-auto flex min-h-10 max-w-7xl items-center justify-center px-6 py-2 text-center text-sm font-bold tracking-wide lg:px-8">
        {phrase}
      </div>
    </div>
  );
}
