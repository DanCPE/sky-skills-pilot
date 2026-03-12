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
      return "border-violet-600 bg-violet-50 dark:border-violet-500 dark:bg-violet-950";
    }

    if (hoveredOption === option && !disabled) {
      return "border-violet-400 bg-violet-50 dark:border-violet-600 dark:bg-violet-950";
    }

    return "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700";
  };

  return (
    <div className="rounded-2xl border-2 border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Question Prompt */}
      <h3 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        {question.prompt}
      </h3>

      {/* Sequence Display */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-3 rounded-xl bg-zinc-100 p-6 dark:bg-zinc-800">
        {question.sequence.map((num, index) => (
          <React.Fragment key={index}>
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-space-grotesk)]">
              {num}
            </span>
            {index < question.sequence.length - 1 && (
              <span className="text-2xl text-zinc-400">,</span>
            )}
          </React.Fragment>
        ))}
        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-space-grotesk)]">
          ?
        </span>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {question.options.map((option) => (
          <button
            key={option}
            onClick={() => !disabled && onAnswer(option)}
            onMouseEnter={() => setHoveredOption(option)}
            onMouseLeave={() => setHoveredOption(null)}
            disabled={disabled}
            className={`rounded-xl border-2 px-6 py-4 text-lg font-semibold transition-all ${
              disabled
                ? "cursor-not-allowed"
                : "cursor-pointer active:scale-95"
            } ${getOptionStyle(option)} ${
              disabled
                ? ""
                : "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            }`}
          >
            <span className="text-zinc-900 dark:text-zinc-100">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
