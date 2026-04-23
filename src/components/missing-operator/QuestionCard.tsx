"use client";

import { useState } from "react";
import type { MissingOperatorQuestion } from "@/types";

interface QuestionCardProps {
  question: MissingOperatorQuestion;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
  selectedAnswer?: string;
  showResult?: boolean;
  isCorrect?: boolean;
}

export default function QuestionCard({
  question,
  onAnswer,
  disabled = false,
  selectedAnswer,
}: QuestionCardProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-8 rounded-2xl border-2 border-[#E2EAF0] bg-white px-4 py-8 transition-shadow hover:shadow-xl dark:border-white/5 dark:bg-black/20">
      <div className="text-center">
        <h3 className="text-[16px] font-bold tracking-tight text-zinc-900 drop-shadow-sm dark:text-white md:text-[20px] font-[family-name:var(--font-inter)]">
          {question.prompt}
        </h3>
      </div>

      <div className="flex min-h-[100px] items-center justify-center overflow-hidden rounded-[1rem] border-2 border-[#4F12A6] bg-white px-6 py-4 dark:border-white/90 dark:bg-zinc-900/80">
        <span className="inline-flex flex-wrap items-center gap-x-[0.25em] font-[family-name:var(--font-space-grotesk)] text-[32px] font-black leading-none tracking-tight text-zinc-900 dark:text-white md:text-[42px]">
          {question.expression.split(" ").map((token, index) =>
            token === "?" ? (
              <span
                key={index}
                className="inline-block h-[0.65em] w-[0.65em] border-[3px] border-zinc-900 bg-white dark:border-white dark:bg-zinc-900"
              />
            ) : (
              <span key={index}>{token}</span>
            )
          )}
        </span>
      </div>

      <div className="w-full">
        <div className="flex items-end justify-between gap-2">
          {question.options.map((option, index) => {
            const label = String.fromCharCode(65 + index);
            const isSelected = selectedAnswer === option;

            return (
              <div
                key={option}
                className="flex max-w-[200px] flex-1 flex-col items-center gap-3"
              >
                <button
                  disabled={disabled}
                  onClick={() => onAnswer(option)}
                  onMouseEnter={() => setHoveredOption(option)}
                  onMouseLeave={() => setHoveredOption(null)}
                  className={`min-h-10 w-full rounded-2xl border-2 px-2 py-2 text-[14px] font-black transition-all duration-300 md:min-h-12 md:text-[16px] ${
                    isSelected
                      ? "z-10 scale-105 border-[#4F12A6] bg-[#4F12A6] text-white"
                      : hoveredOption === option && !disabled
                        ? "border-[#4F12A6] bg-violet-50 dark:border-[#4F12A6] dark:bg-violet-950"
                        : "border-[#E0E0E0] bg-white text-zinc-900 hover:border-zinc-400 hover:bg-zinc-50 dark:border-white/5 dark:bg-zinc-950 dark:text-white dark:hover:border-white/20 dark:hover:bg-zinc-900"
                  } ${disabled && !isSelected ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                >
                  {option}
                </button>

                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-black transition-all duration-300 ${
                    isSelected
                      ? "scale-110 border-[#4F12A6] bg-[#4F12A6] text-white"
                      : "border-[#E0E0E0] text-zinc-500 dark:border-white/20"
                  }`}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
