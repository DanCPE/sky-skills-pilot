"use client";

import { useState } from "react";
import type { ShortTermMemoryQuestion } from "@/types";

interface QuestionCardProps {
  question: ShortTermMemoryQuestion;
  selectedAnswer?: string;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

export default function QuestionCard({
  question,
  selectedAnswer,
  onAnswer,
  disabled = false,
}: QuestionCardProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border-2 border-[#E2EAF0] bg-white px-4 py-6 transition-shadow hover:shadow-xl dark:border-white/5 dark:bg-black/20">
      <div className="pt-2 text-center">
        <h3 className="text-[18px] font-bold tracking-tight text-zinc-900 drop-shadow-sm dark:text-white font-[family-name:var(--font-inter)]">
          {question.prompt}
        </h3>
      </div>

      <div className="mt-8 grid gap-4">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const label = String.fromCharCode(65 + index);

          return (
            <button
              key={option}
              disabled={disabled}
              onClick={() => onAnswer(option)}
              onMouseEnter={() => setHoveredOption(option)}
              onMouseLeave={() => setHoveredOption(null)}
              className={`flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all duration-300 ${
                isSelected
                  ? "border-[#4F12A6] bg-[#4F12A6] text-white"
                  : hoveredOption === option && !disabled
                    ? "border-[#4F12A6] bg-violet-50 dark:border-[#4F12A6] dark:bg-violet-950"
                    : "border-[#E0E0E0] bg-white text-zinc-900 hover:border-zinc-400 hover:bg-zinc-50 dark:border-white/5 dark:bg-zinc-950 dark:text-white dark:hover:border-white/20 dark:hover:bg-zinc-900"
              } ${disabled && !isSelected ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <span className="text-[16px] font-bold">{option}</span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[12px] font-black ${
                  isSelected
                    ? "border-white/50 bg-white/10 text-white"
                    : "border-[#E0E0E0] text-zinc-500 dark:border-white/20 dark:text-zinc-300"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
