"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const TEMPORARY_CLOSE_PATH = "/temporarily-closed";

export default function TemporaryCloseRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    // TEMPORARY CLOSE:
    // For now, every app page except /sign-in is sent to /temporarily-closed.
    // When the site is ready again, remove <TemporaryCloseRedirect /> from
    // src/app/layout.tsx to restore normal routing.
    if (pathname !== "/sign-in" && pathname !== TEMPORARY_CLOSE_PATH) {
      window.location.replace(TEMPORARY_CLOSE_PATH);
    }
  }, [pathname]);

  return null;
}
