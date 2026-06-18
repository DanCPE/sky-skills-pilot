"use client";

import { useState } from "react";
import SharedModeSelection from "@/components/shared/ModeSelection";
import { generateShortTermMemoryQuiz } from "@/lib/short-term-memory-generator";
import type { ShortTermMemoryQuizResponse } from "@/types";

interface ModeSelectionProps {
  onStart: (quizData: ShortTermMemoryQuizResponse) => void;
}

export default function ModeSelection({ onStart }: ModeSelectionProps) {
  const [rows, setRows] = useState(7);
  const [columns, setColumns] = useState(4);

  return (
    <SharedModeSelection<ShortTermMemoryQuizResponse>
      subtitle="Memorize a mixed board of letters, numbers, and symbols, then recall it from memory."
      topicSlug="short-term-memory"
      showDifficulty={false}
      showQuestionCount={false}
      startLabel="Start Memory Quiz"
      learnDescription="Practice with a custom table size. Learn Mode uses the same multiple-choice recall flow as Real Mode, but without a countdown."
      realDescription={() =>
        "Match the assessment-style setup with a fixed 4 rows x 7 columns grid, timed memorization, and multiple-choice recall."
      }
      formatRealModeTime={() => "Fixed 4 rows x 7 columns"}
      childrenBeforeDifficulty={({ selectedMode, isLoading }) => {
        const effectiveRows = selectedMode === "real" ? 7 : rows;
        const effectiveColumns = selectedMode === "real" ? 4 : columns;

        return (
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
                  disabled={selectedMode === "real" || isLoading}
                  className="w-full accent-brand-purple disabled:opacity-50"
                />
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {effectiveRows} columns{" "}
                  {selectedMode === "real" ? "(locked in real mode)" : ""}
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
                  disabled={selectedMode === "real" || isLoading}
                  className="w-full accent-brand-purple disabled:opacity-50"
                />
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {effectiveColumns} rows{" "}
                  {selectedMode === "real" ? "(locked in real mode)" : ""}
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-white/5 dark:text-zinc-300">
              <p>
                Board size:{" "}
                <span className="font-bold">
                  {effectiveColumns} rows x {effectiveRows} columns
                </span>
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
                Distraction task:{" "}
                <span className="font-bold">3 scored math questions before recall</span>
              </p>
              <p>
                Memorization time:{" "}
                <span className="font-bold">
                  {selectedMode === "real" ? "2 minutes" : "No limit"}
                </span>
              </p>
              <p>
                Recall format: <span className="font-bold">Multiple choice</span>
              </p>
            </div>
          </div>
        );
      }}
      onFetch={async (mode) => {
        const effectiveRows = mode === "real" ? 7 : rows;
        const effectiveColumns = mode === "real" ? 4 : columns;

        return generateShortTermMemoryQuiz({
          mode,
          rows: effectiveRows,
          columns: effectiveColumns,
          memorizeSeconds: 120,
          charactersPerCell: 3,
          contentType: "mixed",
        });
      }}
      onStart={onStart}
    />
  );
}
