"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/sky-quest", label: "Sky Quests" },
  { href: "/subscription", label: "Subscription" },
  { href: "/news", label: "News" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/images/icons/Logo from Google Drive.png" 
              alt="Sky Skills Logo" 
              width={140} 
              height={40} 
              className="object-contain"
              priority
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex flex-1 justify-center gap-8 font-semibold text-sm">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-colors ${
                    isActive
                      ? "text-yellow-500 hover:text-yellow-400"
                      : "text-violet-800 hover:text-violet-600 dark:text-violet-400"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="hidden sm:flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-violet-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-600 shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
