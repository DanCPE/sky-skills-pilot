"use client";

import React, { useState } from "react";
import type { NumberSeriesQuestion } from "@/types";

interface QuestionCardProps {
  question: NumberSeriesQuestion;
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
  showResult = false,
  isCorrect,
}: QuestionCardProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const getOptionStyle = (option: string) => {
    const isSelected = selectedAnswer === option;

    if (isSelected) {
      return "border-brand-purple bg-violet-50 dark:bg-brand-purple text-white shadow-md shadow-brand-purple/20";
    }

    if (hoveredOption === option && !disabled) {
      return "border-violet-400 bg-violet-50 dark:border-violet-600 dark:bg-violet-950";
    }

    return "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700";
  };

  return (
    <div className="rounded-xl border-2 border-zinc-200 bg-white dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md p-4 transition-all border-b-4 border-b-zinc-200/50 dark:border-b-white/5">
      {/* Question Prompt */}
      <h3 className="mb-3 text-base font-medium text-zinc-900 dark:text-brand-gold/90">
        {question.prompt}
      </h3>

      {/* Sequence Display */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2 rounded-lg bg-zinc-100 dark:bg-white/5 p-3 dark:border dark:border-white/5">
        {question.sequence.map((num, index) => (
          <React.Fragment key={index}>
            <span className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-space-grotesk)]">
              {num}
            </span>
            {index < question.sequence.length - 1 && (
              <span className="text-base sm:text-lg text-zinc-400">,</span>
            )}
          </React.Fragment>
        ))}
        <span className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-space-grotesk)]">
          ?
        </span>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {question.options.map((option) => (
          <button
            key={option}
            onClick={() => !disabled && onAnswer(option)}
            onMouseEnter={() => setHoveredOption(option)}
            onMouseLeave={() => setHoveredOption(null)}
            disabled={disabled}
            className={`rounded-lg border-2 px-4 py-2 text-base font-medium transition-all ${
              disabled
                ? "cursor-not-allowed"
                : "cursor-pointer active:scale-95"
            } ${getOptionStyle(option)} ${
              disabled
                ? ""
                : "hover:shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
            }`}
          >
            <span className="text-zinc-900 dark:text-zinc-100">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
