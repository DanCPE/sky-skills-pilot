"use client";

import Image from "next/image";
import {
  DERN_JOOD_PAPER_COLOR_FILTERS,
  DERN_JOOD_PAPER_PATTERNS,
  DERN_JOOD_PAPER_SHAPE_FILTERS,
  type DernJoodPaperColorFilter,
  type DernJoodPaperPatternId,
  type DernJoodPaperShapeFilter,
} from "@/lib/dern-jood-paper";

interface PaperPatternSelectorProps {
  selectedPatternId: DernJoodPaperPatternId;
  selectedShapeFilter: DernJoodPaperShapeFilter;
  selectedColorFilter: DernJoodPaperColorFilter;
  onSelectPattern: (patternId: DernJoodPaperPatternId) => void;
  onSelectShapeFilter: (shapeFilter: DernJoodPaperShapeFilter) => void;
  onSelectColorFilter: (colorFilter: DernJoodPaperColorFilter) => void;
}

export default function PaperPatternSelector({
  selectedPatternId,
  selectedShapeFilter,
  selectedColorFilter,
  onSelectPattern,
  onSelectShapeFilter,
  onSelectColorFilter,
}: PaperPatternSelectorProps) {
  const selectedPattern =
    DERN_JOOD_PAPER_PATTERNS.find((pattern) => pattern.id === selectedPatternId) ??
    DERN_JOOD_PAPER_PATTERNS[0];

  return (
    <section className="mt-6 rounded-2xl border-2 border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-black/30">
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Pattern
        </p>
        <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-white">
          {selectedPattern.label}
        </p>
      </div>

      <div className="grid gap-2">
        {DERN_JOOD_PAPER_PATTERNS.map((pattern) => {
          const isSelected = pattern.id === selectedPatternId;

          return (
            <button
              key={pattern.id}
              type="button"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData(
                  "application/dern-jood-pattern",
                  pattern.id,
                );
                event.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => onSelectPattern(pattern.id)}
              className={`flex items-center gap-3 rounded-xl border-2 p-2 text-left transition ${
                isSelected
                  ? "border-brand-purple bg-violet-50 dark:bg-brand-purple/20"
                  : "border-zinc-100 bg-zinc-50 hover:border-zinc-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
              }`}
            >
              <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-white/10">
                <Image
                  src={pattern.svg}
                  alt={`${pattern.label} pattern preview`}
                  fill
                  sizes="80px"
                  className="object-cover object-top"
                />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-zinc-900 dark:text-white">
                  {pattern.label}
                </span>
                <span className="mt-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Drag or click
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {selectedPatternId === "mixed" && (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Shape Walk
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {DERN_JOOD_PAPER_SHAPE_FILTERS.map((shapeFilter) => {
              const isSelected = shapeFilter.id === selectedShapeFilter;

              return (
                <button
                  key={shapeFilter.id}
                  type="button"
                  onClick={() => onSelectShapeFilter(shapeFilter.id)}
                  className={`rounded-lg border-2 px-2.5 py-2 text-xs font-black transition ${
                    isSelected
                      ? "border-brand-purple bg-violet-50 text-brand-purple dark:bg-brand-purple/20 dark:text-brand-gold"
                      : "border-zinc-100 bg-zinc-50 text-zinc-600 hover:border-zinc-300 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:border-white/20"
                  }`}
                >
                  {shapeFilter.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          Color Walk
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {DERN_JOOD_PAPER_COLOR_FILTERS.map((colorFilter) => {
            const isSelected = colorFilter.id === selectedColorFilter;

            return (
              <button
                key={colorFilter.id}
                type="button"
                onClick={() => onSelectColorFilter(colorFilter.id)}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 px-2.5 py-2 text-xs font-black transition ${
                  isSelected
                    ? "border-brand-purple bg-violet-50 text-brand-purple dark:bg-brand-purple/20 dark:text-brand-gold"
                    : "border-zinc-100 bg-zinc-50 text-zinc-600 hover:border-zinc-300 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:border-white/20"
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full border border-black/10"
                  style={{ backgroundColor: colorFilter.swatch }}
                />
                {colorFilter.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
