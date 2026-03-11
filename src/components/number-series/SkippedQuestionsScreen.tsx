"use client";

import type { NumberSeriesQuestion } from "@/types";

interface SkippedQuestionsScreenProps {
  questions: NumberSeriesQuestion[];
  skippedIndices: number[];
  answeredIndices: Set<number>;
  onSelectQuestion: (index: number) => void;
  onFinishSkipped: () => void;
}

export default function SkippedQuestionsScreen({
  questions,
  skippedIndices,
  answeredIndices,
  onSelectQuestion,
  onFinishSkipped,
}: SkippedQuestionsScreenProps) {
  // Filter out skipped questions that have been answered
  const remainingSkipped = skippedIndices.filter(idx => !answeredIndices.has(idx));

  if (remainingSkipped.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 rounded-2xl border-2 border-violet-200 bg-violet-50 p-8 text-center dark:border-violet-900 dark:bg-violet-950">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900">
          <svg
            className="h-8 w-8 text-violet-600 dark:text-violet-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="mb-3 text-2xl font-bold text-violet-900 dark:text-violet-100">
          Questions to Review
        </h2>
        <p className="mb-6 text-violet-700 dark:text-violet-300">
          You have {remainingSkipped.length} {remainingSkipped.length === 1 ? "question" : "questions"} left to answer.
        </p>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {remainingSkipped.map((index) => {
            const question = questions[index];
            return (
              <button
                key={index}
                onClick={() => onSelectQuestion(index)}
                className="rounded-xl border-2 border-violet-200 bg-white p-4 text-left transition-all hover:border-violet-400 hover:shadow-md active:scale-95 dark:border-violet-800 dark:bg-zinc-900 dark:hover:border-violet-600"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                    Question {index + 1}
                  </span>
                  <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                    {question.difficulty}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {question.prompt}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {question.sequence.slice(0, 4).map((num, i) => (
                    <span
                      key={i}
                      className="text-xs font-mono text-zinc-500 dark:text-zinc-400"
                    >
                      {num}
                      {i < 3 && <span className="mx-0.5 text-zinc-300">·</span>}
                    </span>
                  ))}
                  <span className="text-xs text-zinc-400">...</span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-sm text-violet-600 dark:text-violet-400">
          Select a question above to continue
        </p>
      </div>
    </div>
  );
}
