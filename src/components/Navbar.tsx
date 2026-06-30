"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useTheme } from "@/lib/use-theme";

export const ACCOUNT_REFRESH_EVENT = "sky-account-refresh";
export const FLEET_SETUP_NUDGE_EVENT = "sky-fleet-setup-nudge";
export const FLEET_SETUP_NUDGE_STORAGE_KEY =
  "sky_fleet_setup_nudge_dismissed_v2";

export type AccountNavState = {
  name: string;
  email?: string | null;
  imageUrl: string | null;
  rank?: number | null;
  planTitle?: string | null;
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

function subscribeToFleetSetupNudge(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(FLEET_SETUP_NUDGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(FLEET_SETUP_NUDGE_EVENT, onStoreChange);
  };
}

function getFleetSetupNudgeSnapshot() {
  return localStorage.getItem(FLEET_SETUP_NUDGE_STORAGE_KEY) === "true";
}

function getServerFleetSetupNudgeSnapshot() {
  return true;
}

function subscribeToLocationSearch(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);

  return () => {
    window.removeEventListener("popstate", onStoreChange);
  };
}

function getLocationSearchSnapshot() {
  return window.location.search;
}

function getServerLocationSearchSnapshot() {
  return "";
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountStatus, setAccountStatus] = useState<
    "loading" | "signed-in" | "signed-out"
  >("loading");
  const [account, setAccount] = useState<AccountNavState | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [hideFleetSetupNudgeForNow, setHideFleetSetupNudgeForNow] =
    useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const { theme, toggleTheme } = useTheme();
  const isFleetSetupNudgeDismissed = useSyncExternalStore(
    subscribeToFleetSetupNudge,
    getFleetSetupNudgeSnapshot,
    getServerFleetSetupNudgeSnapshot,
  );
  const currentSearch = useSyncExternalStore(
    subscribeToLocationSearch,
    getLocationSearchSnapshot,
    getServerLocationSearchSnapshot,
  );

  function dismissFleetSetupNudge() {
    localStorage.setItem(FLEET_SETUP_NUDGE_STORAGE_KEY, "true");
    window.dispatchEvent(new Event(FLEET_SETUP_NUDGE_EVENT));
  }

  const loadAccount = useCallback((signal?: AbortSignal) => {
    return fetch("/api/account/me", { cache: "no-store", signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.user?.name) {
          setAccount({
            name: data.user.name,
            email: data.user.email ?? null,
            imageUrl: data.user.imageUrl ?? null,
            rank: data.rank ?? null,
            planTitle: data.planTitle ?? null,
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

  useEffect(() => {
    if (!accountMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  if (pathname === "/sign-in") {
    return null;
  }

  const showFleetSetupNudge =
    accountStatus === "signed-in" &&
    Boolean(account) &&
    !hideFleetSetupNudgeForNow &&
    !isFleetSetupNudgeDismissed &&
    pathname !== "/account" &&
    !new URLSearchParams(currentSearch).get("tour");

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
                (item.href === "/subscription" && pathname === "/payment") ||
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
              <div ref={accountMenuRef} className="relative">
                {showFleetSetupNudge ? (
                  <span className="pointer-events-none absolute inset-[-6px] rounded-full bg-violet-400/30 blur-sm" />
                ) : null}
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                  className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border bg-violet-700 text-sm font-bold text-white transition-colors hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-black ${
                    showFleetSetupNudge
                      ? "border-violet-300 shadow-[0_0_0_4px_rgba(139,92,246,0.18),0_0_28px_rgba(139,92,246,0.45)]"
                      : "border-zinc-200 dark:border-white/10"
                  }`}
                  aria-label={`Open fleet setup menu for ${account.name}`}
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                  title="Fleet setup"
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
                </button>
                {showFleetSetupNudge && !accountMenuOpen ? (
                  <div className="absolute right-0 top-14 z-50 w-72 rounded-2xl border border-violet-200 bg-white p-4 text-sm shadow-[0_18px_45px_rgba(76,29,149,0.18)] dark:border-violet-400/20 dark:bg-zinc-950 dark:shadow-[0_18px_45px_rgba(0,0,0,0.55)]">
                    <div className="absolute -top-2 right-4 h-4 w-4 rotate-45 border-l border-t border-violet-200 bg-white dark:border-violet-400/20 dark:bg-zinc-950" />
                    <button
                      type="button"
                      onClick={() => setHideFleetSetupNudgeForNow(true)}
                      aria-label="Close tutorial"
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-100"
                    >
                      <span aria-hidden="true">x</span>
                    </button>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                      Fleet setup
                    </p>
                    <p className="mt-2 font-bold text-zinc-950 dark:text-zinc-50">
                      Manage pilots from this button.
                    </p>
                    <p className="mt-2 leading-6 text-zinc-600 dark:text-zinc-300">
                      Open your profile menu to set up fleet slots, switch the
                      active pilot, and keep each pilot&apos;s scores separate.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href="/account?tour=fleet"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          setHideFleetSetupNudgeForNow(true);
                        }}
                        className="rounded-xl bg-violet-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-600"
                      >
                        Show me
                      </Link>
                      <button
                        type="button"
                        onClick={dismissFleetSetupNudge}
                        className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
                      >
                        Never show again
                      </button>
                    </div>
                  </div>
                ) : null}
                {account.rank === 1 || account.rank === 2 || account.rank === 3 ? (
                  <span
                    className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 text-base leading-none"
                    style={{
                      transform: "rotate(15deg)",
                      filter:
                        account.rank === 1
                          ? "drop-shadow(0 1px 2px rgba(0,0,0,0.4))"
                          : account.rank === 2
                            ? "grayscale(1) brightness(1.6) drop-shadow(0 1px 2px rgba(0,0,0,0.4))"
                            : "sepia(1) saturate(1.2) brightness(0.85) drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
                    }}
                    aria-label={`Rank #${account.rank}`}
                  >
                    👑
                  </span>
                ) : null}

                {accountMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-2 text-sm shadow-[0_16px_40px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-zinc-950 dark:shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold leading-5 text-zinc-950 dark:text-zinc-50">
                          {account.name}
                        </p>
                        {account.email ? (
                          <p className="mt-0.5 truncate text-xs font-medium text-zinc-400 dark:text-zinc-500">
                            {account.email}
                          </p>
                        ) : null}
                      </div>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-pink-200 bg-violet-700 text-xs font-bold text-white ring-1 ring-white dark:border-pink-400/50 dark:ring-zinc-950">
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
                    </div>
                    <Link
                      href="/account"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700"
                    >
                      <span className="flex h-5 w-5 items-center justify-center text-zinc-950 dark:text-zinc-50">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75 11.25 15 15 9.75M12 3.75l7.5 4.125v8.25L12 20.25l-7.5-4.125v-8.25L12 3.75Z"
                          />
                        </svg>
                      </span>
                      Fleet setup
                    </Link>
                    <Link
                      href="/subscription"
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                      className="mt-1 flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center text-zinc-950 dark:text-zinc-50">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.75 7.5h16.5m-15 3.75h13.5m-12 5.25h3m3 0h4.5M4.5 5.25h15a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-.75.75h-15a.75.75 0 0 1-.75-.75v-12a.75.75 0 0 1 .75-.75Z"
                            />
                          </svg>
                        </span>
                        Subscription
                      </span>
                      {account.planTitle ? (
                        <span className="rounded-lg bg-emerald-200 px-2 py-0.5 text-xs font-black uppercase text-emerald-900 ring-1 ring-emerald-300">
                          {account.planTitle}
                        </span>
                      ) : null}
                    </Link>
                    <div className="my-2 border-t border-zinc-100 dark:border-white/10" />
                    <form action="/api/auth/logout" method="post">
                      <button
                        type="submit"
                        role="menuitem"
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-100 hover:text-red-700 dark:text-zinc-50 dark:hover:bg-zinc-800 dark:hover:text-red-300"
                      >
                        <span className="flex h-5 w-5 items-center justify-center">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3-3h-9m9 0-3-3m3 3-3 3"
                            />
                          </svg>
                        </span>
                        Log out
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
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
                (item.href === "/subscription" && pathname === "/payment") ||
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
            {accountStatus === "loading" ? (
              <div className="flex items-center gap-3 rounded-lg px-4 py-2 text-zinc-700 dark:text-zinc-300">
                <span className="h-8 w-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
                Loading account
              </div>
            ) : account ? (
              <div className="space-y-1">
                <div className="flex items-center gap-3 rounded-lg px-4 py-2 text-zinc-700 dark:text-zinc-300">
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
                  {account.name}
                </div>
                <Link
                  href="/account"
                  className="block rounded-lg px-4 py-2 pl-16 font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Fleet setup
                </Link>
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="block w-full rounded-lg px-4 py-2 pl-16 text-left font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-red-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-red-300"
                  >
                    Log out
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/sign-in"
                className="flex items-center gap-3 rounded-lg px-4 py-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in
              </Link>
            )}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
