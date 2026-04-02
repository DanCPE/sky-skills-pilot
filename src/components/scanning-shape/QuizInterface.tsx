"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Timer from "@/components/shared/Timer";
import { generateScanningShapeSections } from "@/lib/scanning-shape-generator";
import type {
  ScanningShapeItem,
  ScanningShapeQuizResponse,
  ScanningShapeSection,
  ScanningShapeType,
} from "@/types";
import {
  SCANNING_SHAPE_ANSWERS_PER_SECTION,
  SCANNING_SHAPE_CANVAS_HEIGHT,
  SCANNING_SHAPE_CANVAS_WIDTH,
} from "@/lib/scanning-shape-generator";

type LearnDisplayMode = "color" | "mono";

const SHAPE_FILL: Record<ScanningShapeType, string> = {
  circle: "#4F12A6",
  square: "#FACC15",
  triangle: "#22c55e",
  hexagon: "#f43f5e",
};

const SHAPE_STROKE: Record<ScanningShapeType, string> = {
  circle: "#3a0d7a",
  square: "#b08c0c",
  triangle: "#16a34a",
  hexagon: "#be123c",
};

const SHAPE_CARD_BORDER: Record<ScanningShapeType, string> = {
  circle: "border-violet-600 dark:border-violet-500",
  square: "border-amber-400",
  triangle: "border-green-500",
  hexagon: "border-rose-500",
};

const MONO_SHAPE_FILL = "none";
const MONO_SHAPE_STROKE = "#6b7280";
const MONO_SHAPE_TEXT = "#111827";

function ShapeGraphic({
  type,
  cx,
  cy,
  size,
  label,
  rotation = 0,
  showDigitsOnly = false,
  displayMode = "color",
}: {
  type: ScanningShapeType;
  cx: number;
  cy: number;
  size: number;
  label: string;
  rotation?: number;
  showDigitsOnly?: boolean;
  displayMode?: LearnDisplayMode;
}) {
  const fill = displayMode === "mono" ? MONO_SHAPE_FILL : SHAPE_FILL[type];
  const stroke =
    displayMode === "mono" ? MONO_SHAPE_STROKE : SHAPE_STROKE[type];
  const textColor = displayMode === "mono" ? MONO_SHAPE_TEXT : "white";
  const radius = size / 2;
  const fontSize = Math.max(11, Math.round(size * 0.28));
  const displayText = showDigitsOnly ? label.slice(0, 2) : label;
  const textDy = type === "triangle" ? size * 0.06 : 0;

  let shapeElement: ReactNode;

  if (type === "circle") {
    shapeElement = (
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
      />
    );
  } else if (type === "square") {
    shapeElement = (
      <rect
        x={cx - radius}
        y={cy - radius}
        width={size}
        height={size}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
      />
    );
  } else if (type === "triangle") {
    const height = (size * Math.sqrt(3)) / 2;
    const points = `${cx},${cy - (height * 2) / 3} ${cx - radius},${cy + height / 3} ${cx + radius},${cy + height / 3}`;

    shapeElement = (
      <polygon points={points} fill={fill} stroke={stroke} strokeWidth={2} />
    );
  } else {
    const points = Array.from({ length: 6 }, (_, index) => {
      const angle = (Math.PI / 3) * index - Math.PI / 6;
      return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
    }).join(" ");

    shapeElement = (
      <polygon points={points} fill={fill} stroke={stroke} strokeWidth={2} />
    );
  }

  return (
    <>
      <g transform={`rotate(${rotation} ${cx} ${cy})`}>{shapeElement}</g>
      <text
        x={cx}
        y={cy + textDy}
        textAnchor="middle"
        dominantBaseline="central"
        fill={textColor}
        fontSize={fontSize}
        fontFamily="var(--font-geist-mono), 'Geist Mono', monospace"
        fontWeight="bold"
      >
        {displayText}
      </text>
    </>
  );
}

function AnswerCard({
  shape,
  isLocked,
  isFlashing,
  inputValue,
  correctLetter,
  onInput,
  quizEnded,
  fullWidth = false,
  displayMode = "color",
}: {
  shape: ScanningShapeItem;
  isLocked: boolean;
  isFlashing: boolean;
  inputValue: string;
  correctLetter: string;
  onInput: (char: string) => void;
  quizEnded: boolean;
  fullWidth?: boolean;
  displayMode?: LearnDisplayMode;
}) {
  const isRevealed = quizEnded && !isLocked;
  const displayValue = isRevealed ? correctLetter : inputValue;

  const cardBorderClass = isLocked
    ? "border-green-500"
    : isFlashing
      ? "border-red-500"
      : isRevealed
        ? "border-amber-400"
        : displayMode === "mono"
          ? "border-zinc-400 dark:border-zinc-600"
          : SHAPE_CARD_BORDER[shape.shape];

  const inputClass = [
    "h-9 w-9 rounded-lg border-2 text-center text-sm font-bold uppercase outline-none transition-all",
    isLocked
      ? "cursor-not-allowed border-green-500 bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"
      : isFlashing
        ? "border-red-500 bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
        : isRevealed
          ? "cursor-not-allowed border-amber-400 bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
          : "border-zinc-300 bg-transparent text-zinc-900 focus:border-[#4F12A6] dark:border-zinc-600 dark:text-zinc-100 dark:focus:border-amber-400",
  ].join(" ");

  const cardSize = 64;

  return (
    <div
      className={`flex ${fullWidth ? "w-full" : "min-w-[90px]"} flex-col items-center gap-2 rounded-xl border-2 ${cardBorderClass} bg-white p-2.5 transition-colors duration-300 dark:bg-black/40`}
    >
      <svg
        width={cardSize}
        height={cardSize}
        viewBox={`0 0 ${cardSize} ${cardSize}`}
      >
        <ShapeGraphic
          type={shape.shape}
          cx={cardSize / 2}
          cy={cardSize / 2}
          size={cardSize * 0.84}
          label={shape.digits}
          showDigitsOnly
          displayMode={displayMode}
        />
      </svg>
      <input
        type="text"
        value={displayValue}
        readOnly={isLocked || quizEnded || isFlashing}
        maxLength={1}
        placeholder="?"
        className={inputClass}
        onChange={(event) => {
          if (isLocked || quizEnded || isFlashing) {
            return;
          }

          const char = event.target.value
            .toUpperCase()
            .replace(/[^A-Z]/g, "")
            .slice(-1);

          if (char) {
            onInput(char);
          }
        }}
        onKeyDown={(event) => {
          if (isLocked || quizEnded || isFlashing) {
            return;
          }

          if (event.key.length === 1 && !/[a-zA-Z]/.test(event.key)) {
            event.preventDefault();
          }
        }}
      />
    </div>
  );
}

function SectionPair({
  section,
  numSections,
  answers,
  locked,
  wrongFlash,
  onInput,
  quizEnded,
  displayMode,
}: {
  section: ScanningShapeSection;
  numSections: number;
  answers: Record<string, string>;
  locked: Set<string>;
  wrongFlash: Set<string>;
  onInput: (id: string, char: string, correctLetter: string) => void;
  quizEnded: boolean;
  displayMode: LearnDisplayMode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-black/40 dark:backdrop-blur-md">
      <div className="border-b border-zinc-100 px-4 py-2 dark:border-white/5">
        <span className="font-[family-name:var(--font-space-grotesk)] text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Section {section.id} / {numSections}
        </span>
      </div>

      <div
        className="relative w-full overflow-hidden"
        style={{
          height: SCANNING_SHAPE_CANVAS_HEIGHT,
          background: displayMode === "mono" ? "#ffffff" : "#000000",
        }}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id={`dg-${section.id}`}
              x="0"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx="1"
                cy="1"
                r="1"
                fill={
                  displayMode === "mono"
                    ? "rgba(0,0,0,0.08)"
                    : "rgba(255,255,255,0.07)"
                }
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#dg-${section.id})`} />
        </svg>

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${SCANNING_SHAPE_CANVAS_WIDTH} ${SCANNING_SHAPE_CANVAS_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          {section.shapes.map((shape) => (
            <ShapeGraphic
              key={shape.id}
              type={shape.shape}
              cx={shape.x}
              cy={shape.y}
              size={shape.size}
              label={shape.digits + shape.letter}
              rotation={shape.rotation}
              displayMode={displayMode}
            />
          ))}
        </svg>

        <div
          className={`pointer-events-none absolute left-3 top-2 select-none font-[family-name:var(--font-geist-mono)] text-[10px] font-medium tracking-wider ${
            displayMode === "mono" ? "text-zinc-500" : "text-zinc-600"
          }`}
        >
          Section {section.id}
        </div>
      </div>

      <div className="px-4 py-3">
        <div
          className="grid grid-cols-2 justify-center gap-3 sm:grid-cols-4 xl:grid-cols-8"
        >
          {section.answerShapes.map((shape) => (
            <AnswerCard
              key={shape.id}
              shape={shape}
              isLocked={locked.has(shape.id)}
              isFlashing={wrongFlash.has(shape.id)}
              inputValue={answers[shape.id] ?? ""}
              correctLetter={shape.letter}
              onInput={(char) => onInput(shape.id, char, shape.letter)}
              quizEnded={quizEnded}
              fullWidth
              displayMode={displayMode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultModal({
  score,
  totalAnswers,
  trigger,
  elapsed,
  isLearnMode,
  onTryAgain,
  onRestart,
  onDismiss,
}: {
  score: number;
  totalAnswers: number;
  trigger: "timer" | "complete";
  elapsed: number;
  isLearnMode: boolean;
  onTryAgain: () => void;
  onRestart: () => void;
  onDismiss: () => void;
}) {
  const percentage = (score / totalAnswers) * 100;
  const percentageDisplay = Math.round(percentage * 10) / 10;

  const performance =
    percentage >= 90
      ? "Excellent - Pilot Grade"
      : percentage >= 70
        ? "Good - Above Average"
        : percentage >= 50
          ? "Fair - Needs Improvement"
          : "Poor - Requires Practice";

  const performanceColor =
    percentage >= 90
      ? "text-green-600 dark:text-green-400"
      : percentage >= 70
        ? "text-[#4F12A6] dark:text-brand-gold"
        : percentage >= 50
          ? "text-amber-500 dark:text-amber-400"
          : "text-red-500 dark:text-red-400";

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  const title =
    !isLearnMode && trigger === "timer" ? "TIME'S UP" : "QUIZ COMPLETE";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <p className="font-[family-name:var(--font-space-grotesk)] text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            {title}
          </p>
          <button
            onClick={onDismiss}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-white/10 dark:hover:text-zinc-200"
            title="Close and review answers"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 text-center">
          <div className="font-[family-name:var(--font-space-grotesk)] text-5xl font-black text-zinc-900 dark:text-zinc-100">
            {score}
            <span className="text-2xl font-medium text-zinc-400">
              {" "}
              / {totalAnswers}
            </span>
          </div>
          <div className="mt-1 font-[family-name:var(--font-inter)] text-xs text-zinc-500 dark:text-zinc-400">
            Correct Answers
          </div>
        </div>

        <div className="mb-6 space-y-2.5 rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex justify-between text-sm">
            <span className="font-[family-name:var(--font-inter)] text-zinc-500 dark:text-zinc-400">
              Percentage
            </span>
            <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-zinc-900 dark:text-zinc-100">
              {percentageDisplay}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-[family-name:var(--font-inter)] text-zinc-500 dark:text-zinc-400">
              {isLearnMode || trigger === "complete" ? "Time Taken" : "Time Limit"}
            </span>
            <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-zinc-900 dark:text-zinc-100">
              {formatTime(elapsed)}
            </span>
          </div>
          <div className="border-t border-zinc-200 pt-2.5 dark:border-white/10">
            <div
              className={`text-center font-[family-name:var(--font-space-grotesk)] text-sm font-bold ${performanceColor}`}
            >
              {performance}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onTryAgain}
            className="flex-1 rounded-xl bg-[#4F12A6] px-4 py-3 font-[family-name:var(--font-space-grotesk)] text-sm font-bold tracking-wider text-white shadow-lg shadow-[#4F12A6]/20 transition-all hover:opacity-90 active:scale-[0.98]"
          >
            TRY AGAIN
          </button>
          <button
            onClick={onRestart}
            className="rounded-xl bg-zinc-100 px-4 py-3 font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-zinc-600 transition-all hover:bg-zinc-200 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10"
          >
            EXIT
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuizInterface({
  quizData,
  onRestart,
}: {
  quizData: ScanningShapeQuizResponse;
  onRestart: () => void;
}) {
  const { mode, difficulty, sectionCount, timeLimit } = quizData;
  const isLearnMode = mode === "learn";
  const totalAnswers = sectionCount * SCANNING_SHAPE_ANSWERS_PER_SECTION;

  const [sections, setSections] = useState(quizData.sections);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [wrongFlash, setWrongFlash] = useState<Set<string>>(new Set());
  const [quizEnded, setQuizEnded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [trigger, setTrigger] = useState<"timer" | "complete">("complete");
  const [elapsed, setElapsed] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [learnDisplayMode, setLearnDisplayMode] =
    useState<LearnDisplayMode>("color");

  const startRef = useRef(0);
  const endedRef = useRef(false);

  const displayMode: LearnDisplayMode = isLearnMode ? learnDisplayMode : "mono";
  const score = locked.size;
  const progressPercent = (score / totalAnswers) * 100;

  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  const finishQuiz = useCallback(
    (finishTrigger: "timer" | "complete", elapsedSeconds: number) => {
      if (endedRef.current) {
        return;
      }

      endedRef.current = true;
      setElapsed(elapsedSeconds);
      setTrigger(finishTrigger);
      setQuizEnded(true);
      setShowModal(true);
    },
    [],
  );

  const handleInput = useCallback(
    (id: string, char: string, correctLetter: string) => {
      setAnswers((previous) => ({ ...previous, [id]: char }));

      if (!isLearnMode) {
        // real mode: just record the answer, no immediate feedback
        return;
      }

      if (char === correctLetter) {
        setLocked((previous) => {
          const next = new Set(previous);
          next.add(id);

          if (!endedRef.current && next.size >= totalAnswers) {
            finishQuiz(
              "complete",
              Math.floor((Date.now() - startRef.current) / 1000),
            );
          }

          return next;
        });
        return;
      }

      setWrongFlash((previous) => new Set([...previous, id]));
      setTimeout(() => {
        setWrongFlash((previous) => {
          const next = new Set(previous);
          next.delete(id);
          return next;
        });

        setAnswers((previous) => {
          const next = { ...previous };
          delete next[id];
          return next;
        });
      }, 600);
    },
    [isLearnMode, finishQuiz, totalAnswers],
  );

  const computeLockedFromAnswers = useCallback(() => {
    const newLocked = new Set<string>();
    for (const section of sections) {
      for (const shape of section.answerShapes) {
        if (answers[shape.id] === shape.letter) {
          newLocked.add(shape.id);
        }
      }
    }
    return newLocked;
  }, [sections, answers]);

  const handleSubmit = useCallback(() => {
    if (endedRef.current) return;
    setLocked(computeLockedFromAnswers());
    finishQuiz("complete", Math.floor((Date.now() - startRef.current) / 1000));
  }, [computeLockedFromAnswers, finishQuiz]);

  const handleTimeUp = useCallback(() => {
    setLocked(computeLockedFromAnswers());
    finishQuiz("timer", timeLimit ?? 0);
  }, [computeLockedFromAnswers, finishQuiz, timeLimit]);

  const handleTryAgain = useCallback(() => {
    endedRef.current = false;
    setSections(generateScanningShapeSections(sectionCount, difficulty));
    setAnswers({});
    setLocked(new Set());
    setWrongFlash(new Set());
    setQuizEnded(false);
    setShowModal(false);
    setElapsed(0);
    setTrigger("complete");
    setTimerKey((current) => current + 1);
    startRef.current = Date.now();

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [difficulty, sectionCount]);

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-transparent dark:text-zinc-100">
      <div className="sticky top-16 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-white/10 dark:bg-black/95">
        <div className="mx-auto max-w-[1200px] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="font-[family-name:var(--font-space-grotesk)] text-xs font-bold uppercase tracking-[0.15em] text-[#4F12A6] sm:text-sm dark:text-brand-gold">
                Scanning Shape
              </h1>
              <span className="hidden rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-900 sm:inline-flex">
                {isLearnMode ? "Learn" : "Real"}
              </span>
            </div>

            {isLearnMode ? (
              <div className="flex items-center gap-2">
                <span className="hidden font-[family-name:var(--font-inter)] text-xs font-medium text-zinc-400 sm:inline">
                  View
                </span>
                <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 p-1 dark:border-white/10 dark:bg-white/5">
                  <button
                    onClick={() => setLearnDisplayMode("color")}
                    className={`rounded-full px-3 py-1 font-[family-name:var(--font-inter)] text-[11px] font-semibold transition-colors ${
                      learnDisplayMode === "color"
                        ? "bg-[#4F12A6] text-white"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    }`}
                  >
                    Colorful
                  </button>
                  <button
                    onClick={() => setLearnDisplayMode("mono")}
                    className={`rounded-full px-3 py-1 font-[family-name:var(--font-inter)] text-[11px] font-semibold transition-colors ${
                      learnDisplayMode === "mono"
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    }`}
                  >
                    B/W
                  </button>
                </div>
              </div>
            ) : timeLimit !== null ? (
              <div className="flex items-center gap-1.5">
                <svg
                  className="h-3.5 w-3.5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <Timer
                  key={timerKey}
                  timeLimit={timeLimit}
                  onTimeUp={handleTimeUp}
                  isPaused={quizEnded}
                  compact
                />
              </div>
            ) : (
              <span className="font-[family-name:var(--font-inter)] text-xs font-medium text-zinc-400 dark:text-zinc-500">
                No Limit
              </span>
            )}

            <div className="flex items-center gap-3">
              {!isLearnMode && !quizEnded && (
                <button
                  onClick={handleSubmit}
                  className="rounded-lg bg-[#4F12A6] px-3 py-1.5 font-[family-name:var(--font-space-grotesk)] text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-[#4F12A6]/20 transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  Submit
                </button>
              )}
              {quizEnded && !showModal && (
                <button
                  onClick={() => setShowModal(true)}
                  className="rounded-lg border border-[#4F12A6] px-3 py-1.5 font-[family-name:var(--font-space-grotesk)] text-xs font-bold uppercase tracking-wider text-[#4F12A6] transition-all hover:bg-[#4F12A6]/10 dark:border-brand-gold dark:text-brand-gold"
                >
                  Results
                </button>
              )}
              <div className="flex items-center gap-1 whitespace-nowrap font-[family-name:var(--font-space-grotesk)] text-sm font-bold">
                <span className="text-[#4F12A6] dark:text-brand-gold">{score}</span>
                <span className="text-zinc-300 dark:text-zinc-600">/</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {totalAnswers}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-[#4F12A6] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-1">
            <button
              onClick={onRestart}
              className="font-[family-name:var(--font-inter)] text-[10px] text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              ← Back to Setup
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-6">
        {sections.map((section) => (
          <SectionPair
            key={section.id}
            section={section}
            numSections={sectionCount}
            answers={answers}
            locked={locked}
            wrongFlash={wrongFlash}
            onInput={handleInput}
            quizEnded={quizEnded}
            displayMode={displayMode}
          />
        ))}
      </div>

      {quizEnded && showModal && (
        <ResultModal
          score={score}
          totalAnswers={totalAnswers}
          trigger={trigger}
          elapsed={elapsed}
          isLearnMode={isLearnMode}
          onTryAgain={handleTryAgain}
          onRestart={onRestart}
          onDismiss={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
