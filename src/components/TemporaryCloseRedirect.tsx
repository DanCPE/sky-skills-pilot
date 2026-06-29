"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const TEMPORARY_CLOSE_PATH = "/temporarily-closed";
const PUBLIC_PATHS = new Set([
  "/",
  "/sign-in",
  "/privacy",
  "/terms",
  TEMPORARY_CLOSE_PATH,
]);

export default function TemporaryCloseRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    // TEMPORARY CLOSE:
    // Keep OAuth identity pages public so Google can validate production:
    // /, /sign-in, /privacy, /terms. Everything else goes to /temporarily-closed.
    // When the site is ready again, remove <TemporaryCloseRedirect /> from
    // src/app/layout.tsx to restore normal routing.
    if (!PUBLIC_PATHS.has(pathname)) {
      window.location.replace(TEMPORARY_CLOSE_PATH);
    }
  }, [pathname]);

  return null;
}
