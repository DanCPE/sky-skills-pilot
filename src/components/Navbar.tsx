import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/sky-quest", label: "Sky Quest" },
  { href: "/subscription", label: "Subscription" },
  { href: "/news", label: "News" },
];

export default function Navbar() {
  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold">
            Sky Skills
          </Link>

          {/* Navigation Links */}
          <div className="flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
