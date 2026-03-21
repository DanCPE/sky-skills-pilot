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
    <div className="flex flex-col gap-16 py-6 px-4 bg-zinc-900/40 dark:bg-black/20 rounded-3xl border-4 border-white/5 shadow-inner">
      {/* Question Prompt */}
      <div className="text-center">
        <h3 className="text-md md:text-xl font-black text-white tracking-tight drop-shadow-sm">
          {question.prompt}
        </h3>
      </div>

      {/* Sequence Display Box */}
      <div className="flex items-center justify-center py-4 px-6 rounded-[2rem] border-2 border-white/20 bg-zinc-900/80 shadow-2xl overflow-hidden min-h-[100px]">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {question.sequence.map((num, index) => (
            <React.Fragment key={index}>
              <span className="text-3xl md:text-4xl font-black text-white font-[family-name:var(--font-space-grotesk)] tracking-tighter">
                {num}
              </span>
              <span className="text-3xl md:text-4xl font-black text-zinc-600">,</span>
            </React.Fragment>
          ))}
          <span className="text-3xl md:text-4xl font-black text-white font-[family-name:var(--font-space-grotesk)]">
            ?
          </span>
        </div>
      </div>

      {/* Options Row */}
      <div className="w-full">
        <div className="flex justify-between items-start gap-2">
          {question.options.map((option, index) => {
            const label = String.fromCharCode(65 + index); // A, B, C, D...
            const isSelected = selectedAnswer === option;
            
            return (
              <div key={option} className="flex flex-col items-center gap-4 flex-1 max-w-[200px]">
                <button
                  disabled={disabled}
                  onClick={() => onAnswer(option)}
                  onMouseEnter={() => setHoveredOption(option)}
                  onMouseLeave={() => setHoveredOption(null)}
                  className={`w-full h-10 md:h-12 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center text-sm md:text-md font-black shadow-lg ${
                    isSelected
                      ? "bg-brand-purple border-brand-purple text-white shadow-brand-purple/40 scale-105 z-10"
                      : "bg-zinc-950 border-white/5 text-white hover:border-white/20 hover:bg-zinc-900 active:scale-95"
                  } ${disabled && !isSelected ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {option}
                </button>
                
                {/* Circle Indicator Label */}
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 font-black text-xs transition-all duration-300 ${
                  isSelected 
                    ? "bg-brand-purple border-brand-purple text-white scale-110" 
                    : "border-white/20 text-zinc-500"
                }`}>
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
