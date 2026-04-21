"use client";

import { useState } from "react";
import { generateShortTermMemoryQuiz } from "@/lib/short-term-memory-generator";
import type { ShortTermMemoryQuizResponse } from "@/types";

interface ModeSelectionProps {
  onStart: (quizData: ShortTermMemoryQuizResponse) => void;
}

type Mode = "learn" | "real";

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  const [mode, setMode] = useState<Mode>("real");
  const [rows, setRows] = useState(7);
  const [columns, setColumns] = useState(4);

  const effectiveRows = mode === "real" ? 7 : rows;
  const effectiveColumns = mode === "real" ? 4 : columns;

  const handleStart = () => {
    onStart(
      generateShortTermMemoryQuiz({
        mode,
        rows: effectiveRows,
        columns: effectiveColumns,
        memorizeSeconds: 120,
        charactersPerCell: 3,
        contentType: "mixed",
      })
    );
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-900 dark:text-white">
          Build Your Recall Challenge
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Memorize a mixed board of letters, numbers, and symbols, then recall it from memory.
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <button
          onClick={() => setMode("learn")}
          className={`rounded-2xl border-2 p-6 text-left transition-all ${
            mode === "learn"
              ? "border-brand-purple bg-violet-50 dark:border-brand-purple dark:bg-brand-purple/20"
              : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-white/10 dark:bg-black/40 dark:hover:border-white/20"
          }`}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-xl dark:bg-brand-purple">
              🧪
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Learn Mode
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Adjustable board size
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Practice with a custom table size. Each cell is either letters only, numbers only, or one symbol image, but never a mixed text cell.
          </p>
        </button>

        <button
          onClick={() => setMode("real")}
          className={`rounded-2xl border-2 p-6 text-left transition-all ${
            mode === "real"
              ? "border-brand-purple bg-violet-50 dark:border-brand-purple dark:bg-brand-purple/20"
              : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-white/10 dark:bg-black/40 dark:hover:border-white/20"
          }`}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-xl dark:bg-brand-purple">
              ⏱️
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Real Mode
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Fixed 4 rows × 7 columns
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Match the assessment-style setup with a fixed 4 rows × 7 columns grid and multiple-choice recall after the memorization phase.
          </p>
        </button>
      </div>

      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-black/40">
        <div className="mb-5 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Columns
            </label>
            <input
              type="range"
              min={3}
              max={9}
              step={1}
              value={effectiveRows}
              onChange={(event) => setRows(Number(event.target.value))}
              disabled={mode === "real"}
              className="w-full accent-brand-purple disabled:opacity-50"
            />
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {effectiveRows} columns {mode === "real" ? "(locked in real mode)" : ""}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Rows
            </label>
            <input
              type="range"
              min={3}
              max={6}
              step={1}
              value={effectiveColumns}
              onChange={(event) => setColumns(Number(event.target.value))}
              disabled={mode === "real"}
              className="w-full accent-brand-purple disabled:opacity-50"
            />
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {effectiveColumns} rows {mode === "real" ? "(locked in real mode)" : ""}
            </p>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-white/5 dark:text-zinc-300">
          <p>
            Board size: <span className="font-bold">{effectiveColumns} rows × {effectiveRows} columns</span>
          </p>
          <p>
            Board content: <span className="font-bold">Mixed across the full grid</span>
          </p>
          <p>
            Cell content:{" "}
            <span className="font-bold">
              3 letters, 3 numbers, or 1 symbol image per cell
            </span>
          </p>
          <p>
            Memorization time: <span className="font-bold">2 minutes</span>
          </p>
          <p>
            Recall format:{" "}
            <span className="font-bold">
              {mode === "real" ? "Multiple choice" : "Type into each cell"}
            </span>
          </p>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleStart}
          className="inline-flex items-center justify-center rounded-xl bg-brand-purple px-8 py-4 text-lg font-bold text-white shadow-lg shadow-brand-purple/20 transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Start Memory Quiz
        </button>
      </div>
    </div>
  );
}
