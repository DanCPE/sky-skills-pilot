"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackClientEvent } from "@/lib/client-analytics";

function getTopicSlug(pathname: string): string | null {
  if (!pathname.startsWith("/sky-quest/")) {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  return segments[1] ?? null;
}

export default function FrontendUsageTracker() {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    // Prevent duplicate events when components remount without path changes.
    if (lastTrackedPathRef.current === pathname) {
      return;
    }

    lastTrackedPathRef.current = pathname;

    trackClientEvent({
      eventType: "page_view",
      pathname,
      topicSlug: getTopicSlug(pathname),
    });
  }, [pathname]);

  return null;
}
