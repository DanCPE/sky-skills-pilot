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
      return "border-violet-600 bg-violet-50 dark:border-violet-500 dark:bg-violet-950";
    }

    if (hoveredOption === option && !disabled) {
      return "border-violet-400 bg-violet-50 dark:border-violet-600 dark:bg-violet-950";
    }

    return "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700";
  };

  return (
    <div className={`rounded-3xl border-2 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 ${compact ? "p-4" : "p-6"}`}>
      {/* Question Prompt - hide in compact mode */}
      {!compact && (
        <h3 className={`font-semibold text-zinc-900 dark:text-zinc-100 ${compact ? "mb-3 text-lg" : "mb-6 text-xl"}`}>
          {question.prompt}
        </h3>
      )}

      {/* Strings Display - Side by Side */}
      <div className={`grid gap-3 md:grid-cols-2 ${compact ? "mb-4" : "mb-8"}`}>
        {/* String A */}
        <div className={`rounded-2xl bg-zinc-100 dark:bg-zinc-800 ${compact ? "p-3" : "p-6"}`}>
          <div className={`font-medium text-zinc-500 dark:text-zinc-400 ${compact ? "mb-1 text-xs" : "mb-2 text-sm"}`}>
            String A
          </div>
          <div className={`text-center font-medium tracking-widest text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-geist-mono)] ${compact ? "text-base" : "text-xl"}`}>
            {question.stringA}
          </div>
        </div>

        {/* String B */}
        <div className={`rounded-2xl bg-zinc-100 dark:bg-zinc-800 ${compact ? "p-3" : "p-6"}`}>
          <div className={`font-medium text-zinc-500 dark:text-zinc-400 ${compact ? "mb-1 text-xs" : "mb-2 text-sm"}`}>
            String B
          </div>
          <div className={`text-center font-medium tracking-widest text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-geist-mono)] ${compact ? "text-base" : "text-xl"}`}>
            {question.stringB}
          </div>
        </div>
      </div>

      {/* Answer Buttons */}
      <div className={`text-center text-zinc-600 dark:text-zinc-400 ${compact ? "mb-2 text-xs" : "mb-4 text-sm"}`}>
        How many characters are different?
      </div>
      <div className={`grid gap-2 ${compact ? "grid-cols-6 gap-2" : "grid-cols-3 gap-3 sm:grid-cols-6"}`}>
        {[0, 1, 2, 3, 4, 5].map((option) => (
          <button
            key={option}
            onClick={() => !disabled && onAnswer(String(option))}
            onMouseEnter={() => setHoveredOption(String(option))}
            onMouseLeave={() => setHoveredOption(null)}
            disabled={disabled}
            className={`rounded-2xl border-2 font-bold transition-all ${
              disabled
                ? "cursor-not-allowed"
                : "cursor-pointer active:scale-95"
            } ${getOptionStyle(String(option))} ${
              compact ? "px-3 py-2 text-lg" : "px-6 py-4 text-2xl"
            } ${
              disabled
                ? ""
                : "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
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
