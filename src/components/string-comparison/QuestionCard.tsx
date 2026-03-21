"use client";

import React, { useState } from "react";
import type { ScanningPracticeQuestion } from "@/types";

interface QuestionCardProps {
  question: ScanningPracticeQuestion;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
  selectedAnswer?: string;
  showResult?: boolean;
  isCorrect?: boolean;
  compact?: boolean; // New prop for compact mode in practice list view
}

export default function QuestionCard({
  question,
  onAnswer,
  disabled = false,
  selectedAnswer,
  showResult = false,
  isCorrect,
  compact = false,
}: QuestionCardProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const getOptionStyle = (option: string) => {
    const isSelected = selectedAnswer === option;
    const isCorrectAnswer = option === String(question.differenceCount);

    if (showResult) {
      if (isSelected && isCorrect) {
        return "border-green-500 bg-green-50 dark:bg-green-950";
      }
      if (isSelected && !isCorrect) {
        return "border-red-500 bg-red-50 dark:bg-red-950";
      }
      if (isCorrectAnswer) {
        return "border-green-500 bg-green-50 dark:bg-green-950";
      }
      return "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 opacity-50";
    }

    if (isSelected) {
      return "border-brand-purple bg-violet-50 dark:bg-brand-purple text-white shadow-md shadow-brand-purple/20";
    }

    if (hoveredOption === option && !disabled) {
      return "border-violet-400 bg-violet-50 dark:border-violet-600 dark:bg-violet-950";
    }

    return "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700";
  };

  return (
    <div className={`rounded-2xl border-2 border-zinc-200 bg-white dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md transition-all ${compact ? "p-3" : "p-4"}`}>
      {/* Question Prompt - hide in compact mode */}
      {!compact && (
        <h3 className="text-zinc-900 dark:text-brand-gold/90 mb-2 text-base font-medium">
          {question.prompt}
        </h3>
      )}

      {/* Strings Display - Horizontal Layout */}
      <div className="flex flex-row gap-2 w-full mb-4">
        {/* String A */}
        <div className="flex-1 min-w-0 rounded-xl bg-zinc-100 dark:bg-white/5 p-2 sm:p-3 border-2 border-transparent dark:border-white/5 flex flex-col justify-center">
          <div className="font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1 text-[9px]">
            String A
          </div>
          <div className="text-center tracking-[0.05em] text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-geist-mono)] break-all text-sm sm:text-base">
            {question.stringA}
          </div>
        </div>

        {/* String B */}
        <div className="flex-1 min-w-0 rounded-xl bg-zinc-100 dark:bg-white/5 p-2 sm:p-3 border-2 border-transparent dark:border-white/5 flex flex-col justify-center">
          <div className="font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1 text-[9px]">
            String B
          </div>
          <div className="text-center tracking-[0.05em] text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-geist-mono)] break-all text-sm sm:text-base">
            {question.stringB}
          </div>
        </div>
      </div>

      {/* Answer Buttons */}
      <div className="text-center text-zinc-500 dark:text-zinc-400 mb-2 text-[11px]">
        How many characters are different?
      </div>
      <div className="flex flex-row justify-center gap-1.5 sm:gap-2">
        {[0, 1, 2, 3, 4, 5].map((option) => (
          <button
            key={option}
            onClick={() => !disabled && onAnswer(String(option))}
            onMouseEnter={() => setHoveredOption(String(option))}
            onMouseLeave={() => setHoveredOption(null)}
            disabled={disabled}
            className={`flex-1 max-w-[60px] rounded-xl border-2 font-bold transition-all ${
              disabled
                ? "cursor-not-allowed"
                : "cursor-pointer active:scale-95"
            } ${getOptionStyle(String(option))} ${
              compact ? "px-2 py-1.5 text-base" : "px-3 py-2 text-lg"
            } ${
              disabled
                ? ""
                : "hover:shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
            }`}
          >
            <span className="text-zinc-900 dark:text-zinc-100">{option}</span>
          </button>
        ))}
      </div>

      {/* Feedback Text */}
      {showResult && selectedAnswer && (
        <div className={`text-center ${compact ? "mt-3" : "mt-6"}`}>
          {isCorrect ? (
            <p className={`font-semibold text-green-600 dark:text-green-400 ${compact ? "text-sm" : "text-lg"}`}>
              ✓ Correct! Great job!
            </p>
          ) : (
            <p className={`font-semibold text-red-600 dark:text-red-400 ${compact ? "text-sm" : "text-lg"}`}>
              ✗ Incorrect. The correct answer is{" "}
              <span className="font-bold">{question.differenceCount}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
