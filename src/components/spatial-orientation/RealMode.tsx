"use client";

import { useState } from "react";
import React from "react";
import Timer from "@/components/shared/Timer";
import ProgressBar from "@/components/shared/ProgressBar";
import QuizCompleteConfirmation from "@/components/spatial-orientation/QuizCompleteConfirmation";
import QuestionNavigator from "@/components/number-series/QuestionNavigator";
import {
  SpatialOrientationQuizResponse,
  SpatialOrientationQuestion,
} from "@/types";

interface RealModeProps {
  quizData: SpatialOrientationQuizResponse;
  onRestart: () => void;
}

// Airplane icon component
const AirplaneIcon = ({
  angle,
  color = "currentColor",
  className = "",
}: {
  angle: number;
  color?: string;
  className?: string;
}) => (
  <div
    className={`relative flex items-center justify-center ${className}`}
    style={{ transform: `rotate(${angle}deg)` }}
  >
    <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-sm">
      <path
        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
        fill={color}
      />
    </svg>
  </div>
);

// Compass circle component
const CompassCircle = ({
  size,
  children,
  className,
}: {
  size?: "sm" | "md";
  children?: React.ReactNode;
  className?: string;
}) => {
  const sizeClasses = size === "sm" ? "w-14 h-14" : "w-16 h-16";

  return (
    <div className={`relative rounded-full border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 ${sizeClasses} ${className}`}>
      <div className="absolute inset-0 opacity-20">
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
          <div key={deg} className="absolute w-full h-full" style={{ transform: `rotate(${deg}deg)` }}>
            <div className="h-1.5 mx-auto w-full bg-zinc-300 dark:bg-zinc-700" style={{ transformOrigin: "center" }}></div>
          </div>
        ))}
      </div>
      {children}
    </div>
  );
};

// Individual Question Row Component
const QuestionRow = ({
  question,
  index,
  selectedAnswer,
  onSelect,
  isSubmitted,
}: {
  question: SpatialOrientationQuestion;
  index: number;
  selectedAnswer: string | null;
  onSelect: (val: string) => void;
  isSubmitted: boolean;
}) => {
  const isCorrect =
    isSubmitted &&
    selectedAnswer === `${question.correctAngle}${question.correctDir}`;

  return (
    <div
      id={`question-${question.id}`}
      className={`relative mb-6 p-6 rounded-3xl bg-white dark:bg-zinc-900 border-2 transition-all ${
        isSubmitted
          ? isCorrect
            ? "border-green-500 bg-green-50/30 dark:bg-green-900/10"
            : "border-red-500 bg-red-50/30 dark:bg-red-900/10"
          : "border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 shadow-sm"
      }`}
    >
      <div className="flex flex-col gap-5">
        {/* Top Row: Index + Visual Sequence (Always horizontal, single line) */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-base font-black text-zinc-400 dark:text-zinc-500 shrink-0">
            {index + 1}
          </div>

          {/* Visual Sequence Box */}
          <div className="flex flex-1 items-center gap-4 min-w-0 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 rounded-2xl border border-zinc-100 dark:border-white/5">
            <CompassCircle size="sm" className="shrink-0">
              <AirplaneIcon angle={question.initialHeading} color="#3b82f6" />
            </CompassCircle>
            
            <div className="flex flex-1 items-center justify-center flex-wrap gap-1.5 min-w-0 py-1">
              {question.sequence.map((step, i) => {
                const isLast = i === question.sequence.length - 1;
                return (
                  <React.Fragment key={i}>
                    <div className="flex items-center gap-1 shrink-0 font-bold text-sm bg-white dark:bg-zinc-800 px-3 py-2 rounded-lg shadow-sm border border-zinc-100 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-200 whitespace-nowrap">
                      <span>{step.angle}°</span>
                      <span className={step.dir === "L" ? "text-blue-500" : "text-amber-500 font-black"}>
                        {step.dir}
                      </span>
                    </div>
                    {!isLast && (
                      <span className="text-zinc-300 dark:text-zinc-700 font-bold shrink-0">→</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <CompassCircle size="sm">
              <AirplaneIcon angle={question.targetHeading} color="#7c3aed" />
            </CompassCircle>
          </div>
        </div>

        {/* Bottom Row: Answer Buttons (Always below question) */}
        <div className="grid grid-cols-5 gap-2">
          {question.options.map((opt, i) => {
            const optVal =
              opt.dir === null ? "NO_ANSWER" : `${opt.angle}${opt.dir}`;
            const isSelected = selectedAnswer === optVal;
            const isActuallyCorrect =
              optVal === `${question.correctAngle}${question.correctDir}`;

            let btnStyle =
              "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-400";

            if (isSubmitted) {
              if (isActuallyCorrect) {
                btnStyle = "bg-green-500 text-white shadow-lg shadow-green-500/30 ring-2 ring-green-400 ring-offset-2 dark:ring-offset-zinc-900";
              } else if (isSelected && !isActuallyCorrect) {
                btnStyle = "bg-red-500 text-white shadow-lg shadow-red-500/30";
              } else {
                btnStyle = "bg-zinc-100 text-zinc-300 opacity-30 dark:bg-zinc-800 dark:text-zinc-600";
              }
            } else if (isSelected) {
              btnStyle = "bg-violet-600 text-white shadow-md shadow-violet-500/30 ring-2 ring-violet-400 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 scale-105 z-10";
            }

            return (
              <button
                key={i}
                disabled={isSubmitted}
                onClick={() => onSelect(optVal)}
                className={`h-12 px-3 rounded-xl font-black text-sm transition-all tracking-tight ${btnStyle}`}
              >
                {opt.dir === null ? "N/A" : `${opt.angle}° ${opt.dir}`}
              </button>
            );
          })}
        </div>
      </div>

      {isSubmitted && !isCorrect && selectedAnswer !== null && (
        <div className="mt-4 flex items-center gap-2 text-sm">
           <span className="font-black uppercase tracking-widest text-red-500">Target:</span>
           <span className="font-bold text-zinc-600 dark:text-zinc-400">{question.correctAngle}° {question.correctDir}</span>
        </div>
      )}
    </div>
  );
};

export default function RealMode({
  quizData,
  onRestart,
}: RealModeProps) {
  const { questions, timeLimit } = quizData;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [quizStartTime] = useState(Date.now());
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const answeredCount = Object.keys(answers).length;

  const answeredSet = new Set(
    questions
      .map((q, i) => (answers[q.id] ? i : -1))
      .filter((i) => i !== -1),
  );

  const skippedSet = new Set<number>();

  const handleTimeUp = () => {
    handleSubmitQuiz();
  };

  const handleSubmitClick = () => {
    const unansweredCount = questions.length - answeredCount;
    if (unansweredCount > 0) {
      // Show confirmation if there are unanswered questions
      setShowConfirmation(true);
    } else {
      // All questions answered, submit directly
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = () => {
    setShowConfirmation(false);
    setIsSubmitted(true);
    setTotalTimeTaken(Math.floor((Date.now() - quizStartTime) / 1000));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === `${q.correctAngle}${q.correctDir}`) {
        score++;
      }
    });
    return Math.round((score / questions.length) * 100);
  };

  return (
    <div className="w-full max-w-[1600px] pr-4 sm:pr-6 lg:pr-8 pb-20">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Column (Questions) */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="flex justify-between items-center bg-white dark:bg-black/40 dark:backdrop-blur-md border-2 border-zinc-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-black text-brand-gold">
                <span className="text-2xl">✈️</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                  Spatial Orientation
                </h1>
              </div>
            </div>
          </div>

          {isSubmitted && (
            <div className="mb-4 text-center bg-violet-50 dark:bg-violet-900/20 p-8 rounded-3xl border border-violet-200 dark:border-violet-800/50">
              <h2 className="text-3xl font-black mb-2 text-violet-700 dark:text-violet-400">
                Score: {calculateScore()}%
              </h2>
              <p className="font-bold text-zinc-600 dark:text-zinc-400 mb-6">
                Completed in {Math.floor(totalTimeTaken / 60)}m{" "}
                {totalTimeTaken % 60}s
              </p>
              <button
                onClick={onRestart}
                className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md"
              >
                Play Again
              </button>
            </div>
          )}

          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                id={`question-${idx}`}
                className="scroll-mt-24"
              >
                <QuestionRow
                  question={q}
                  index={idx}
                  selectedAnswer={answers[q.id] || null}
                  onSelect={(val) => {
                    if (!isSubmitted) {
                      setAnswers((prev) => ({ ...prev, [q.id]: val }));
                      setCurrentQuestionIndex(idx);
                    }
                  }}
                  isSubmitted={isSubmitted}
                />
              </div>
            ))}
          </div>

          <div className="mt-8">
            <button
              onClick={onRestart}
              className="group flex items-center gap-2 rounded-xl bg-zinc-200/60 px-5 py-2.5 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 w-max"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:-translate-x-1"
              >
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
              </svg>
              Exit
            </button>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="flex w-full flex-col gap-6 md:w-80 shrink-0 sticky top-24 self-start">
          <div className="rounded-[1.5rem] border-2 border-zinc-100 dark:border-white/10 bg-white dark:bg-black/40 dark:backdrop-blur-md p-6 shadow-sm flex flex-col gap-5">
            {/* Timer */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                Time Remaining
              </span>
              {timeLimit && !isSubmitted && (
                <div className="[&>div]:mb-0 [&>div]:bg-transparent [&>div]:px-0">
                  <Timer
                    timeLimit={timeLimit}
                    onTimeUp={handleTimeUp}
                    isPaused={isSubmitted}
                    compact
                  />
                </div>
              )}
            </div>

            <ProgressBar
              current={answeredCount}
              total={questions.length}
              score={isSubmitted ? calculateScore() : undefined}
              compact
            />
          </div>

          <div className="rounded-[1.5rem] border-2 border-zinc-100 dark:border-white/10 bg-white dark:bg-black/40 dark:backdrop-blur-md p-6 shadow-sm">
            <h3 className="mb-5 font-bold text-zinc-800 dark:text-zinc-200">
              Question Navigator
            </h3>
            <QuestionNavigator
              totalQuestions={questions.length}
              currentIndex={currentQuestionIndex}
              answeredIndices={answeredSet}
              skippedIndices={skippedSet}
              onSelectQuestion={(index) => {
                const element = document.getElementById(`question-${index}`);
                if (element) {
                  element.scrollIntoView({ behavior: "smooth", block: "center" });
                }
                setCurrentQuestionIndex(index);
              }}
            />
          </div>

          <button
            onClick={handleSubmitClick}
            disabled={isSubmitted}
            className={`w-full rounded-[1.25rem] py-3.5 text-base font-bold transition-all shadow-sm ${
              isSubmitted
                ? "bg-zinc-300 text-zinc-500 cursor-not-allowed dark:bg-zinc-700 dark:text-zinc-400"
                : "bg-brand-gold text-zinc-900 hover:bg-amber-300 active:scale-[0.98] shadow-sm shadow-brand-gold/20"
            }`}
          >
            {isSubmitted ? "Submitted" : "Submit"}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <QuizCompleteConfirmation
          totalQuestions={questions.length}
          answeredCount={answeredCount}
          onBackToQuestions={() => {
            setShowConfirmation(false);
          }}
          onFinishQuiz={handleSubmitQuiz}
        />
      )}
    </div>
  );
}
