"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "@/lib/use-theme";

export const ACCOUNT_REFRESH_EVENT = "sky-account-refresh";

export type AccountNavState = {
  name: string;
  imageUrl: string | null;
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/sky-quest", label: "Sky Quests" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/subscription", label: "Subscription" },
  { href: "/news", label: "News" },
];

export function notifyAccountChanged(account?: AccountNavState) {
  window.dispatchEvent(new CustomEvent(ACCOUNT_REFRESH_EVENT, { detail: account }));

  try {
    localStorage.setItem(ACCOUNT_REFRESH_EVENT, String(Date.now()));
  } catch {
    // Local storage can be unavailable in private contexts; the current tab event is enough.
  }
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountStatus, setAccountStatus] = useState<
    "loading" | "signed-in" | "signed-out"
  >("loading");
  const [account, setAccount] = useState<AccountNavState | null>(null);
  const { theme, toggleTheme } = useTheme();

  const loadAccount = useCallback((signal?: AbortSignal) => {
    return fetch("/api/account/me", { cache: "no-store", signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.user?.name) {
          setAccount({
            name: data.user.name,
            imageUrl: data.user.imageUrl ?? null,
          });
          setAccountStatus("signed-in");
          return;
        }

        setAccount(null);
        setAccountStatus("signed-out");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setAccount(null);
        setAccountStatus("signed-out");
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadAccount(controller.signal);

    function handleAccountRefresh(event: Event) {
      const detail = (event as CustomEvent<AccountNavState | undefined>).detail;

      if (detail?.name) {
        setAccount(detail);
        setAccountStatus("signed-in");
        return;
      }

      void loadAccount();
    }

    window.addEventListener(ACCOUNT_REFRESH_EVENT, handleAccountRefresh);

    return () => {
      controller.abort();
      window.removeEventListener(ACCOUNT_REFRESH_EVENT, handleAccountRefresh);
    };
  }, [loadAccount]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === ACCOUNT_REFRESH_EVENT) {
        void loadAccount();
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadAccount]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadAccount();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loadAccount]);

  if (pathname === "/sign-in") {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white transition-colors dark:border-white/10 dark:bg-black">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex flex-1 items-center gap-2">
            <Image
              src="/images/icons/Logo from Google Drive.png"
              alt="Sky Skills Logo"
              width={240}
              height={140}
              className="h-10 w-auto object-contain"
              priority
            />
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              SkySkills
            </span>
          </Link>

          <div className="hidden flex-1 justify-center gap-8 text-[14px] font-medium tracking-wider md:flex">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap transition-colors ${
                    isActive
                      ? "text-brand-gold hover:text-amber-300"
                      : "text-violet-800 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden flex-1 items-center justify-end gap-6 sm:flex">
            {accountStatus === "loading" ? (
              <div
                className="h-10 w-10 animate-pulse rounded-full border border-zinc-200 bg-zinc-100 dark:border-white/10 dark:bg-zinc-800"
                aria-label="Loading account"
                title="Loading account"
              />
            ) : account ? (
              <Link
                href="/account"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-violet-700 text-sm font-bold text-white transition-colors hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:border-white/10 dark:focus:ring-offset-black"
                aria-label={`Open account for ${account.name}`}
                title={account.name}
              >
                {account.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={account.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  account.name.slice(0, 1).toUpperCase()
                )}
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-bold text-violet-800 transition-colors hover:bg-zinc-100 hover:text-violet-600 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                Sign in
              </Link>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg bg-zinc-100 p-2 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? (
                <svg
                  className="h-5 w-5 text-zinc-600 dark:text-zinc-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-zinc-600 dark:text-zinc-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle navigation menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className="space-y-4 py-4 md:hidden">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-4 py-2 transition-colors ${
                    isActive
                      ? "bg-yellow-50 font-semibold text-yellow-600 dark:bg-yellow-900/20"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href={account ? "/account" : "/sign-in"}
              className="flex items-center gap-3 rounded-lg px-4 py-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              {accountStatus === "loading" ? (
                <>
                  <span className="h-8 w-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  Loading account
                </>
              ) : account ? (
                <>
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-violet-700 text-xs font-bold text-white">
                    {account.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={account.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      account.name.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  Account
                </>
              ) : (
                "Sign in"
              )}
            </Link>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
