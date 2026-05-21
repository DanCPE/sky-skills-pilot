"use client";

import React, { useState } from "react";
import type { CalculationQuestion } from "@/types";

interface QuestionCardProps {
  question: CalculationQuestion;
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
    <div className="flex flex-col gap-10 rounded-2xl border-2 border-[#E2EAF0] bg-white px-4 py-6 transition-shadow hover:shadow-xl dark:border-white/5 dark:bg-black/20">
      <div className="pt-6 text-center">
        <h3 className="text-[16px] font-bold tracking-tight text-zinc-900 drop-shadow-sm dark:text-white md:text-[20px] font-[family-name:var(--font-inter)]">
          {question.prompt}
        </h3>
      </div>

      <div className="flex min-h-[100px] items-center justify-center overflow-hidden rounded-[1rem] border-2 border-[#4F12A6] bg-white px-6 py-4 dark:border-white/90 dark:bg-zinc-900/80">
        <span className="font-[family-name:var(--font-space-grotesk)] text-[42px] font-black tracking-tight text-zinc-900 dark:text-white md:text-[32px]">
          {question.expression}
        </span>
      </div>

      <div className="w-full">
        <div className="flex items-start justify-between gap-2">
          {question.options.map((option, index) => {
            const label = String.fromCharCode(65 + index);
            const isSelected = selectedAnswer === option;

            return (
              <div
                key={option}
                className="flex max-w-[200px] flex-1 flex-col items-center gap-4"
              >
                <button
                  disabled={disabled}
                  onClick={() => onAnswer(option)}
                  onMouseEnter={() => setHoveredOption(option)}
                  onMouseLeave={() => setHoveredOption(null)}
                  className={`h-10 w-full rounded-2xl border-2 text-[14px] font-black transition-all duration-300 md:h-12 md:text-[16px] ${
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
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[12px] font-black transition-all duration-300 ${
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
