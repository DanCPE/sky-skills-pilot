"use client";

import React from "react";

interface QuestionCountSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
  labels: number[];
  isLoading?: boolean;
}

export default function QuestionCountSlider({
  value,
  min,
  max,
  step,
  onChange,
  labels,
  isLoading,
}: QuestionCountSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-8 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-black/40 dark:backdrop-blur-md p-6">
      <label className="mb-6 block text-[16px] font-bold text-zinc-900 dark:text-zinc-100 font-[family-name:var(--font-inter)] text-left">
        Number of Questions
      </label>
      <div className="relative h-10 flex items-center px-2">
        {/* Custom Track Background */}
        <div className="absolute left-2 right-2 h-1.5 rounded-lg bg-[#F2F1F9] dark:bg-white" />

        {/* Custom Progress Line */}
        <div
          className="absolute left-2 h-1.5 rounded-l-lg bg-[#4F12A6] dark:bg-[#FACC15] transition-all duration-200"
          style={{ width: `calc(${percentage}% - ${percentage * 0.16}px)` }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={isLoading}
          className="relative z-10 h-1.5 w-full cursor-pointer appearance-none bg-transparent 
            [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#4F12A6] dark:[&::-webkit-slider-thumb]:bg-[#FACC15]
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-zinc-900
            [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-[#4F12A6] dark:[&::-moz-range-thumb]:bg-[#FACC15]
            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white dark:[&::-moz-range-thumb]:border-zinc-900"
        />
      </div>
      <div className="relative mt-2 h-6 w-full font-[family-name:var(--font-inter)]">
        {labels.map((label) => {
          const pos = ((label - min) / (max - min)) * 100;
          return (
            <span
              key={label}
              className={`absolute top-0 -translate-x-1/2 text-[16px] font-bold transition-colors duration-200 ${
                value === label
                  ? "text-[#4F12A6] dark:text-[#FACC15]"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
              style={{ left: `calc(8px + ${pos}% - ${pos * 0.16}px)` }}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
