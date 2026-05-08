"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/use-theme";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/sky-quest", label: "Sky Quests" },
  { href: "/news", label: "News" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [account, setAccount] = useState<{
    name: string;
    imageUrl: string | null;
  } | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;

    fetch("/api/account/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.user?.name) {
          setAccount({
            name: data.user.name,
            imageUrl: data.user.imageUrl ?? null,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setAccount(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <nav className="border-b border-zinc-200 bg-white dark:border-white/10 dark:bg-black sticky top-0 z-50 transition-colors">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex flex-1 items-center gap-2">
              <Image
                src="/images/icons/Logo from Google Drive.png"
                alt="Sky Skills Logo"
                width={240}
                height={140}
                className="object-contain h-10 w-auto"
                priority
              />
              <span className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-900 dark:text-zinc-50">
                SkySkills
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex flex-1 justify-center gap-8 font-medium text-[14px] tracking-wider">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`transition-colors ${
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

            {/* Desktop Actions */}
            <div className="hidden sm:flex flex-1 justify-end items-center gap-6">
              {account ? (
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

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
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

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-4">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-yellow-50 text-yellow-600 font-semibold dark:bg-yellow-900/20"
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
                className="flex items-center gap-3 px-4 py-2 rounded-lg text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                {account ? (
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
          )}
        </div>
      </nav>
    </>
  );
}
