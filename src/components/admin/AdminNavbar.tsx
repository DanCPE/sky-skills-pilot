"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminNavItems = [
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/billing", label: "Billing" },
  { href: "/admin/free-resources", label: "Free Resources" },
];

export default function AdminNavbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-200 bg-zinc-950 text-white dark:border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">
            Admin Console
          </p>
          <p className="mt-1 text-sm text-zinc-300">
            Manage SkySkills content and operations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  isActive
                    ? "bg-brand-gold text-zinc-950"
                    : "bg-white/10 text-zinc-200 hover:bg-white/15 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
