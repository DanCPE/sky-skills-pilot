"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ResultsScreen from "@/components/shared/ResultsScreen";
import type {
  ShortTermMemoryCell,
  ShortTermMemoryMathQuestion,
  ShortTermMemoryOption,
  ShortTermMemoryQuizResponse,
} from "@/types";

interface QuizInterfaceProps {
  quizData: ShortTermMemoryQuizResponse;
  onRestart: () => void;
}

type Phase = "ready" | "memorize" | "math" | "answer" | "results";

function createEmptyGrid(rows: number, columns: number) {
  return Array.from({ length: rows }, () => Array.from({ length: columns }, () => ""));
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function renderCellContent(cell: ShortTermMemoryCell, compact = false) {
  if (cell.imageSrc) {
    return (
      <div className="flex h-full w-full items-center justify-center overflow-hidden">
        <Image
          src={cell.imageSrc}
          alt={cell.label}
          width={compact ? 28 : 40}
          height={compact ? 28 : 40}
          className={`object-contain dark:invert ${
            compact ? "max-h-7 max-w-7" : "max-h-10 max-w-10"
          }`}
        />
      </div>
    );
  }

  return (
    <span
      className={`font-mono font-bold tracking-[0.25em] text-zinc-900 dark:text-zinc-100 ${
        compact ? "text-base" : "text-lg"
      }`}
    >
      {cell.label}
    </span>
  );
}

function renderOptionContent(option: ShortTermMemoryOption) {
  if (option.imageSrc) {
    return (
      <div className="flex h-full w-full items-center justify-center overflow-hidden">
        <Image
          src={option.imageSrc}
          alt={option.label}
          width={24}
          height={24}
          className="max-h-6 max-w-6 object-contain dark:invert"
        />
      </div>
    );
  }

  return <span className="font-mono text-sm font-bold tracking-[0.2em]">{option.label}</span>;
}

function MathQuestionCard({
  question,
  selectedAnswer,
  onAnswer,
}: {
  question: ShortTermMemoryMathQuestion;
  selectedAnswer?: string;
  onAnswer: (answer: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="mb-4 text-center font-[family-name:var(--font-space-grotesk)] text-2xl font-black text-zinc-900 dark:text-zinc-100">
        {question.prompt}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option) => (
          <button
            key={option}
            onClick={() => onAnswer(option)}
            className={`rounded-xl border-2 px-4 py-3 text-lg font-bold transition ${
              selectedAnswer === option
                ? "border-brand-purple bg-brand-purple text-white"
                : "border-zinc-200 bg-white text-zinc-900 hover:border-brand-purple dark:border-white/10 dark:bg-black/30 dark:text-zinc-100"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function QuizInterface({ quizData, onRestart }: QuizInterfaceProps) {
  const { grid, rows, columns, memorizeSeconds, mode, mathQuestions } = quizData;

  const [phase, setPhase] = useState<Phase>("ready");
  const [timeRemaining, setTimeRemaining] = useState(memorizeSeconds);
  const [answers, setAnswers] = useState<string[][]>(() => createEmptyGrid(rows, columns));
  const [mathAnswers, setMathAnswers] = useState<Record<string, string>>({});
  const [completedTime, setCompletedTime] = useState<number | undefined>(undefined);
  const startTimeRef = useRef<number | null>(null);
  const tableViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (phase !== "memorize" || mode !== "real") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimeRemaining((previous) => {
        if (previous <= 1) {
          window.clearInterval(intervalId);
          setPhase("math");
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [phase, mode]);

  useEffect(() => {
    if (phase === "memorize" || phase === "math" || phase === "answer") {
      requestAnimationFrame(() => {
        tableViewportRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    }
  }, [phase]);

  const flattenedReview = useMemo(
    () =>
      grid.flatMap((row, rowIndex) =>
        row.map((cell, columnIndex) => {
          const userAnswer = answers[rowIndex][columnIndex];
          const selectedOption = cell.options?.find((option) => option.value === userAnswer);

          return {
            answer: selectedOption?.label ?? userAnswer,
            isCorrect: userAnswer === cell.value,
            expected: cell.label,
            expectedImageSrc: cell.imageSrc,
            answerImageSrc: selectedOption?.imageSrc,
            rowIndex,
            columnIndex,
          };
        })
      ),
    [answers, grid]
  );

  const mathReview = useMemo(
    () =>
      mathQuestions.map((question) => ({
        answer: mathAnswers[question.id] ?? "",
        isCorrect: mathAnswers[question.id] === question.correctAnswer,
        question,
      })),
    [mathAnswers, mathQuestions]
  );

  const allReviewAnswers = useMemo(
    () => [...flattenedReview, ...mathReview],
    [flattenedReview, mathReview]
  );

  const answeredMathCount = mathReview.filter((answer) => answer.answer !== "").length;
  const allMathAnswered = answeredMathCount === mathQuestions.length;

  const handleStartMemorizing = () => {
    startTimeRef.current = Date.now();
    setTimeRemaining(memorizeSeconds);
    setPhase("memorize");
  };

  const handleOptionSelect = (
    rowIndex: number,
    columnIndex: number,
    optionValue: string
  ) => {
    setAnswers((previous) =>
      previous.map((row, currentRowIndex) =>
        currentRowIndex === rowIndex
          ? row.map((cellValue, currentColumnIndex) =>
              currentColumnIndex === columnIndex ? optionValue : cellValue
            )
          : row
      )
    );
  };

  const handleMathAnswer = (questionId: string, answer: string) => {
    setMathAnswers((previous) => ({
      ...previous,
      [questionId]: answer,
    }));
  };

  const handleSubmit = () => {
    const startedAt = startTimeRef.current ?? Date.now();
    setCompletedTime(Math.floor((Date.now() - startedAt) / 1000));
    setPhase("results");
  };

  const handleResetAnswers = () => {
    setAnswers(createEmptyGrid(rows, columns));
  };

  const handleBackToModeSelection = () => {
    onRestart();
  };

  if (phase === "results") {
    return (
      <TopicLayout
        title="Short-Term Memory Table"
        description="Memorize a mixed board of letters, numbers, and symbols, then recall the full grid from memory."
      >
        <ResultsScreen
          totalCount={rows * columns + mathQuestions.length}
          answers={allReviewAnswers}
          timeTaken={completedTime}
          onRestart={handleBackToModeSelection}
          restartLabel="Back to Mode Selection"
          showBackButton={false}
        >
          <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-black/40">
            <h3 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Math Distraction Review
            </h3>
            <div className="grid gap-3 md:grid-cols-3">
              {mathReview.map(({ question, answer, isCorrect }) => (
                <div
                  key={question.id}
                  className={`rounded-xl border p-4 ${
                    isCorrect
                      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30"
                      : "border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30"
                  }`}
                >
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">
                    {question.prompt}
                  </p>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Your answer: <span className="font-bold">{answer || "---"}</span>
                  </p>
                  {!isCorrect && (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Correct: <span className="font-bold">{question.correctAnswer}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-black/40">
            <h3 className="mb-4 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Answer Review
            </h3>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${rows}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: columns }, (_, columnIndex) =>
                Array.from({ length: rows }, (_, rowIndex) => {
                  const cell = flattenedReview.find(c => c.rowIndex === rowIndex && c.columnIndex === columnIndex)!;
                  return (
                <div
                  key={`${cell.rowIndex}-${cell.columnIndex}`}
                  className={`rounded-xl border p-3 ${
                    cell.isCorrect
                      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30"
                      : "border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30"
                  }`}
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {String.fromCharCode(65 + rowIndex)}{columnIndex + 1}
                  </p>
                  <div className="min-h-10">
                    {cell.answerImageSrc ? (
                        <Image
                          src={cell.answerImageSrc}
                          alt={cell.answer || "Selected symbol"}
                          width={36}
                          height={36}
                          className="h-9 w-9 object-contain dark:invert"
                        />
                    ) : (
                      <p className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {cell.answer || "---"}
                      </p>
                    )}
                  </div>
                  {!cell.isCorrect && (
                    <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="mr-1">Correct:</span>
                      {cell.expectedImageSrc ? (
                        <Image
                          src={cell.expectedImageSrc}
                          alt={cell.expected}
                          width={32}
                          height={32}
                          className="inline-block h-8 w-8 object-contain align-middle dark:invert"
                        />
                      ) : (
                        <span className="font-mono font-bold">{cell.expected}</span>
                      )}
                    </div>
                  )}
                </div>
                  );
                })
              )}
            </div>
          </div>
        </ResultsScreen>
      </TopicLayout>
    );
  }

  return (
    <TopicLayout
      title="Short-Term Memory Table"
      description="Memorize a mixed board of letters, numbers, and symbols, then recall the full grid from memory."
      fullWidth
      showBackLink={phase === "ready"}
    >
      <div className="mx-auto flex h-[calc(100dvh-10rem)] max-w-6xl flex-col px-4">
        {phase === "ready" ? (
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-black/40">
            <p className="mb-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              {mode === "real" ? "REAL MODE" : "LEARN MODE"}
            </p>
            <h2 className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-900 dark:text-zinc-100">
              Ready to Start?
            </h2>
            <p className="mt-3 max-w-xl text-sm font-[family-name:var(--font-inter)] text-zinc-600 dark:text-zinc-400">
              Press start when you are ready. The memory table will appear first, then you will solve 3 math questions before recall.
            </p>
            <div className="mt-6 grid w-full gap-3 rounded-2xl bg-zinc-50 p-4 text-left text-sm font-[family-name:var(--font-inter)] text-zinc-700 dark:bg-white/5 dark:text-zinc-300">
              <p>
                Grid size: <span className="font-bold">{columns} x {rows}</span>
              </p>
              <p>
                Cell content: <span className="font-bold">3 letters, 3 numbers, or one symbol image</span>
              </p>
              <p>
                Distraction task: <span className="font-bold">3 math questions before recall</span>
              </p>
              <p>
                Memorization time: <span className="font-bold">{mode === "real" ? formatTime(memorizeSeconds) : "No limit"}</span>
              </p>
              <p>
                Answer format:{" "}
                <span className="font-bold">Multiple choice</span>
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleBackToModeSelection}
                className="rounded-xl border-2 border-zinc-300 px-6 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
              >
                Back to Mode Selection
              </button>
              <button
                onClick={handleStartMemorizing}
                className="rounded-xl bg-brand-purple px-8 py-3 text-lg font-bold text-white shadow-lg shadow-brand-purple/20 transition hover:opacity-90"
              >
                Start Quiz
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={tableViewportRef}
            className="flex h-full flex-col"
          >
            <div className="mb-3 shrink-0 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black/40">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="mb-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    {mode === "real" ? "REAL MODE" : "LEARN MODE"}
                  </p>
                  <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] text-zinc-900 dark:text-zinc-100">
                    {phase === "memorize"
                      ? "Memorize the Grid"
                      : phase === "math"
                        ? "Solve the Math Questions"
                        : "Recall the Grid"}
                  </h2>
                  <p className="mt-2 text-sm font-[family-name:var(--font-inter)] text-zinc-600 dark:text-zinc-400">
                    {phase === "memorize"
                      ? mode === "real"
                        ? "Study each cell carefully before the grid is hidden."
                        : "Study the grid for as long as you need, then continue when you are ready."
                      : phase === "math"
                        ? "Answer all 3 questions to distract working memory before the grid recall begins."
                        : "Choose the correct answer for each cell from the mixed alphabet, numeric, and symbol options."}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3 md:items-end">
                  <button
                    onClick={handleBackToModeSelection}
                    className="rounded-xl border-2 border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
                  >
                    Back to Mode Selection
                  </button>
                  <div className="rounded-2xl bg-zinc-100 px-5 py-4 text-center dark:bg-white/5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                      {phase === "memorize" ? (mode === "real" ? "Time Remaining" : "Mode") : "Status"}
                    </p>
                    <p className="mt-1 text-3xl font-bold font-[family-name:var(--font-space-grotesk)] text-[#4F12A6] dark:text-brand-gold">
                      {phase === "memorize"
                        ? (mode === "real" ? formatTime(timeRemaining) : "LEARNING")
                        : phase === "math"
                          ? `${answeredMathCount}/3`
                          : "ANSWERING"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {phase === "math" ? (
              <div className="min-h-0 flex-1 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/40">
                <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
                  {mathQuestions.map((question) => (
                    <MathQuestionCard
                      key={question.id}
                      question={question}
                      selectedAnswer={mathAnswers[question.id]}
                      onAnswer={(answer) => handleMathAnswer(question.id, answer)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="min-h-0 flex-1 rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-black/40"
              >
                <div
                  className="grid h-full gap-2"
                  style={{ gridTemplateColumns: `repeat(${rows}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${columns}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: columns }, (_, columnIndex) =>
                    Array.from({ length: rows }, (_, rowIndex) => {
                      const cell = grid[rowIndex][columnIndex];
                      const selectedAnswer = answers[rowIndex][columnIndex];

                      return (
                        <div
                          key={cell.id}
                          className="flex flex-col rounded-2xl border border-zinc-200 bg-zinc-50 p-1.5 dark:border-white/10 dark:bg-white/5"
                        >
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                            {String.fromCharCode(65 + rowIndex)}{columnIndex + 1}
                          </p>

                          {phase === "memorize" ? (
                            <div className="flex flex-1 items-center justify-center rounded-xl bg-white px-1 dark:bg-black/30">
                              {renderCellContent(cell, true)}
                            </div>
                          ) : (
                            <div className="grid flex-1 grid-cols-2 gap-1">
                              {cell.options?.map((option) => (
                                <button
                                  key={option.id}
                                  onClick={() =>
                                    handleOptionSelect(rowIndex, columnIndex, option.value)
                                  }
                                  className={`flex items-center justify-center rounded-lg border px-1 transition ${
                                    selectedAnswer === option.value
                                      ? "border-brand-purple bg-violet-50 text-brand-purple dark:border-brand-purple dark:bg-brand-purple/20 dark:text-white"
                                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-white/10 dark:bg-black/30 dark:text-zinc-200"
                                  }`}
                                >
                                  {renderOptionContent(option)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="mt-3 flex shrink-0 flex-col gap-3 sm:flex-row sm:justify-center">
              {phase === "memorize" ? (
                <button
                  onClick={() => setPhase("math")}
                  className="rounded-xl border-2 border-zinc-300 px-6 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
                >
                  Continue to Math Questions
                </button>
              ) : phase === "math" ? (
                <button
                  onClick={() => setPhase("answer")}
                  disabled={!allMathAnswered}
                  className="rounded-xl bg-brand-purple px-6 py-3 font-bold text-white shadow-lg shadow-brand-purple/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue to Memory Recall
                </button>
              ) : (
                <>
                  <button
                    onClick={handleResetAnswers}
                    className="rounded-xl border-2 border-zinc-300 px-6 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
                  >
                    Clear Answers
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="rounded-xl bg-brand-purple px-6 py-3 font-bold text-white shadow-lg shadow-brand-purple/20 transition hover:opacity-90"
                  >
                    Finish Quiz
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </TopicLayout>
  );
}
