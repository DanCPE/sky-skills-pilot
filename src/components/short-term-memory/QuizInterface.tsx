"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import TopicLayout from "@/components/TopicLayout";
import ResultsScreen from "@/components/shared/ResultsScreen";
import type {
  ShortTermMemoryCell,
  ShortTermMemoryOption,
  ShortTermMemoryQuizResponse,
} from "@/types";

interface QuizInterfaceProps {
  quizData: ShortTermMemoryQuizResponse;
  onRestart: () => void;
}

type Phase = "ready" | "memorize" | "answer" | "results";

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
      <div className="flex items-center justify-center">
        <Image
          src={cell.imageSrc}
          alt={cell.label}
          width={compact ? 38 : 56}
          height={compact ? 38 : 56}
          className="h-auto w-auto object-contain"
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
      <div className="flex items-center justify-center">
        <Image
          src={option.imageSrc}
          alt={option.label}
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
        />
      </div>
    );
  }

  return <span className="font-mono text-sm font-bold tracking-[0.2em]">{option.label}</span>;
}

export default function QuizInterface({ quizData, onRestart }: QuizInterfaceProps) {
  const { grid, rows, columns, memorizeSeconds, charactersPerCell, mode } = quizData;

  const [phase, setPhase] = useState<Phase>("ready");
  const [timeRemaining, setTimeRemaining] = useState(memorizeSeconds);
  const [answers, setAnswers] = useState<string[][]>(() => createEmptyGrid(rows, columns));
  const [completedTime, setCompletedTime] = useState<number | undefined>(undefined);
  const startTimeRef = useRef<number | null>(null);
  const tableViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (phase !== "memorize") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimeRemaining((previous) => {
        if (previous <= 1) {
          window.clearInterval(intervalId);
          setPhase("answer");
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [phase]);

  useEffect(() => {
    if (phase === "memorize" || phase === "answer") {
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

  const handleStartMemorizing = () => {
    startTimeRef.current = Date.now();
    setTimeRemaining(memorizeSeconds);
    setPhase("memorize");
  };

  const handleTextAnswerChange = (rowIndex: number, columnIndex: number, value: string) => {
    const cell = grid[rowIndex][columnIndex];
    const maxLength = cell.contentType === "symbol" ? value.length : charactersPerCell;
    const sanitized = value.slice(0, maxLength).toUpperCase();

    setAnswers((previous) =>
      previous.map((row, currentRowIndex) =>
        currentRowIndex === rowIndex
          ? row.map((cellValue, currentColumnIndex) =>
              currentColumnIndex === columnIndex ? sanitized : cellValue
            )
          : row
      )
    );
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
        description="Memorize a mixed board, then recreate the full grid from memory."
      >
        <ResultsScreen
          totalCount={rows * columns}
          answers={flattenedReview}
          timeTaken={completedTime}
          onRestart={handleBackToModeSelection}
          restartLabel="Back to Mode Selection"
          showBackButton={false}
        >
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
                        className="h-9 w-9 object-contain"
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
                          className="inline-block h-8 w-8 object-contain align-middle"
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
      description="Memorize a mixed board, then recreate the full grid from memory."
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
              Press start when you are ready. The memory table will appear immediately and the timer will begin.
            </p>
            <div className="mt-6 grid w-full gap-3 rounded-2xl bg-zinc-50 p-4 text-left text-sm font-[family-name:var(--font-inter)] text-zinc-700 dark:bg-white/5 dark:text-zinc-300">
              <p>
                Grid size: <span className="font-bold">{columns} x {rows}</span>
              </p>
              <p>
                Cell content: <span className="font-bold">Letters only, numbers only, or one symbol image</span>
              </p>
              <p>
                Memorization time: <span className="font-bold">{formatTime(memorizeSeconds)}</span>
              </p>
              <p>
                Answer format:{" "}
                <span className="font-bold">
                  {mode === "real" ? "Multiple choice" : "Type into each cell"}
                </span>
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
                    {phase === "memorize" ? "Memorize the Grid" : "Recall the Grid"}
                  </h2>
                  <p className="mt-2 text-sm font-[family-name:var(--font-inter)] text-zinc-600 dark:text-zinc-400">
                    {phase === "memorize"
                      ? "Study each cell carefully before the grid is hidden."
                      : mode === "real"
                        ? "Choose the correct answer for each cell from the options below."
                        : "Type the exact letters or numbers, and type the symbol name for image cells."}
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
                      {phase === "memorize" ? "Time Remaining" : "Status"}
                    </p>
                    <p className="mt-1 text-3xl font-bold font-[family-name:var(--font-space-grotesk)] text-[#4F12A6] dark:text-brand-gold">
                      {phase === "memorize" ? formatTime(timeRemaining) : "ANSWERING"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

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
                        ) : mode === "real" ? (
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
                        ) : cell.contentType === "symbol" ? (
                          <input
                            value={selectedAnswer}
                            onChange={(event) =>
                              handleTextAnswerChange(rowIndex, columnIndex, event.target.value)
                            }
                            placeholder="name"
                            className="h-8 w-full rounded-xl border border-zinc-200 bg-white px-1 text-center text-xs font-semibold text-zinc-900 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 dark:border-white/10 dark:bg-black/30 dark:text-zinc-100"
                          />
                        ) : (
                          <input
                            value={selectedAnswer}
                            onChange={(event) =>
                              handleTextAnswerChange(rowIndex, columnIndex, event.target.value)
                            }
                            maxLength={charactersPerCell}
                            placeholder={"-".repeat(charactersPerCell)}
                            className="h-8 w-full rounded-xl border border-zinc-200 bg-white px-1 text-center font-mono text-sm font-bold uppercase tracking-[0.2em] text-zinc-900 outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 dark:border-white/10 dark:bg-black/30 dark:text-zinc-100"
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-3 flex shrink-0 flex-col gap-3 sm:flex-row sm:justify-center">
              {phase === "memorize" ? (
                <button
                  onClick={() => setPhase("answer")}
                  className="rounded-xl border-2 border-zinc-300 px-6 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
                >
                  Continue to Answering
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
