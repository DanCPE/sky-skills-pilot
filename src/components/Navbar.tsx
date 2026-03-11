"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/sky-quest", label: "Sky Quests" },
  { href: "/subscription", label: "Subscription" },
  { href: "/news", label: "News" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-zinc-200 bg-white sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/icons/Logo from Google Drive.png"
              alt="Sky Skills Logo"
              width={240}
              height={140}
              className="object-contain h-10 w-auto"
              priority
            />
            <span className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-900">
              SkySkills
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex flex-1 justify-center gap-8 font-semibold text-sm">
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
                      ? "text-yellow-500 hover:text-yellow-400"
                      : "text-violet-800 hover:text-violet-600"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-semibold text-zinc-600 hover:text-zinc-900"
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

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-zinc-600 hover:bg-zinc-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
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
                      ? "bg-yellow-50 text-yellow-600 font-semibold"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="px-4 pt-4 space-y-3">
              <Link
                href="/login"
                className="block text-center text-sm font-semibold text-zinc-600 hover:text-zinc-900 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="block text-center rounded-lg bg-violet-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-600 shadow-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
