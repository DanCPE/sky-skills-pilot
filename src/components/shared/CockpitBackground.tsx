import Image from "next/image";

/**
 * CockpitBackground
 *
 * Full-screen fixed background using the home-dark cockpit image
 * with a violet-to-black gradient overlay — same aesthetic as the
 * landing page hero. Drop this into any page to get that look:
 *
 *   <CockpitBackground />
 *   <div className="relative z-10">…content…</div>
 *
 * The component is always visible (not scoped to dark mode).
 * Wrap it in `dark:block hidden` on the parent if you want dark-only.
 */
export default function CockpitBackground() {
  return (
    <div className="fixed inset-0 z-0 bg-black">
      <Image
        src="/images/backgrounds/home-dark.png"
        alt="Cockpit background"
        fill
        priority
        quality={90}
        className="object-cover opacity-80"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950/40 via-violet-900/10 to-black" />
    </div>
  );
}
