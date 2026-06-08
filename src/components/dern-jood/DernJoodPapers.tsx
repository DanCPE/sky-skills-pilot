import Image from "next/image";

interface DernJoodPaper {
  title: string;
  shortTitle: string;
  kind: "PNG" | "PDF";
  href: string;
  downloadName: string;
  preview?: string;
}

const dernJoodPapers: DernJoodPaper[] = [
  {
    title: "Circle Dern-Jood Paper",
    shortTitle: "Circle paper",
    kind: "PNG",
    href: "/images/dern-jood/ciecle.png",
    downloadName: "dern-jood-paper-circle.png",
    preview: "/images/dern-jood/ciecle.png",
  },
  {
    title: "Mixed Dern-Jood Paper",
    shortTitle: "Mixed paper",
    kind: "PNG",
    href: "/images/dern-jood/mix.png",
    downloadName: "dern-jood-paper-mixed.png",
    preview: "/images/dern-jood/mix.png",
  },
  {
    title: "Circle Dern-Jood Paper PDF",
    shortTitle: "Circle PDF",
    kind: "PDF",
    href: "/images/dern-jood/circle%20pdf.pdf",
    downloadName: "dern-jood-paper-circle.pdf",
  },
] as const;

interface DernJoodPapersProps {
  compact?: boolean;
}

export default function DernJoodPapers({ compact = false }: DernJoodPapersProps) {
  return (
    <section
      className={`rounded-2xl border-2 border-zinc-200 bg-white dark:border-white/10 dark:bg-black/40 ${
        compact ? "p-4" : "mb-8 p-5"
      }`}
    >
      <div className={compact ? "mb-3" : "mb-4 flex flex-wrap items-end justify-between gap-3"}>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-purple dark:text-brand-gold">
            Dern-Jood Paper
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-zinc-900 dark:text-white">
            Practice sheets
          </h3>
        </div>
        {!compact && (
          <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            Open or download the Dern-Jood paper sheets for offline practice.
          </p>
        )}
      </div>

      <div className={compact ? "space-y-2" : "grid gap-4 sm:grid-cols-3"}>
        {dernJoodPapers.map((paper) => (
          <article
            key={paper.href}
            className={`overflow-hidden rounded-xl border-2 border-zinc-100 bg-zinc-50 dark:border-white/10 dark:bg-white/5 ${
              compact ? "flex gap-3 p-2" : ""
            }`}
          >
            {paper.preview ? (
              <div
                className={`relative shrink-0 bg-white ${
                  compact ? "h-16 w-12 rounded-lg" : "aspect-[3/4]"
                }`}
              >
                <Image
                  src={paper.preview}
                  alt={paper.title}
                  fill
                  sizes={compact ? "224px" : "(min-width: 640px) 30vw, 90vw"}
                  className={`${compact ? "rounded-lg" : ""} object-cover object-top`}
                />
              </div>
            ) : (
              <div
                className={`flex shrink-0 items-center justify-center bg-white font-black text-brand-purple dark:bg-zinc-900 dark:text-brand-gold ${
                  compact
                    ? "h-16 w-12 rounded-lg text-sm"
                    : "aspect-[3/4] text-4xl"
                }`}
              >
                PDF
              </div>
            )}

            <div className={compact ? "min-w-0 flex-1" : "p-3"}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                  {compact ? paper.shortTitle : paper.title}
                </h4>
                <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-zinc-500 dark:bg-black/30 dark:text-zinc-300">
                  {paper.kind}
                </span>
              </div>
              <a
                href={paper.href}
                download={paper.downloadName}
                className="block rounded-lg bg-brand-purple px-3 py-2 text-center text-sm font-bold text-white transition hover:opacity-90"
              >
                Download
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
