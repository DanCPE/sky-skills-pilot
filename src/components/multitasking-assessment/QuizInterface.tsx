"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Timer from "@/components/shared/Timer";
import QuizFooterNav from "@/components/shared/QuizFooterNav";
import { useRecordRealModeScore } from "@/lib/account/client-score-history";
import type {
  MultitaskingAssessmentConfig,
  MultitaskingAssessmentResult,
} from "@/types";

type EventKind = "hit" | "miss" | "fault" | "info";
type AssessmentEvent = MultitaskingAssessmentResult["eventLog"][number];
type Direction = "up" | "down";

interface QuizInterfaceProps {
  config: MultitaskingAssessmentConfig;
  onRestart: () => void;
}

interface DifficultySettings {
  signalEveryMs: [number, number];
  signalTimeoutMs: number;
  gaugeSpeed: number;
  mathMax: number;
}

interface MathQuestion {
  id: string;
  a: number;
  b: number;
  operator: "+" | "-" | "×" | "÷";
  answer: number;
  difficulty: "easy" | "medium" | "hard";
}

interface ActiveSignal {
  lightIndex: number;
  position: string;
  expiresAt: number;
  actionable: boolean;
}

const difficultySettings: Record<string, DifficultySettings> = {
  easy: {
    signalEveryMs: [6500, 10500],
    signalTimeoutMs: 6500,
    gaugeSpeed: 4.2,
    mathMax: 12,
  },
  medium: {
    signalEveryMs: [4600, 8200],
    signalTimeoutMs: 5200,
    gaugeSpeed: 5.8,
    mathMax: 24,
  },
  hard: {
    signalEveryMs: [3200, 6500],
    signalTimeoutMs: 4200,
    gaugeSpeed: 7.4,
    mathMax: 40,
  },
};

const rows = "ABCDEFGHIJ".split("");
const columns = Array.from({ length: 10 }, (_, index) => index + 1);
const greenLow = 50;
const greenHigh = 70;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween([min, max]: [number, number]) {
  return min + Math.random() * (max - min);
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function scoreFromPenalty(penalty: number) {
  return Math.round(clamp(100 - penalty, 0, 100));
}

function makeMathQuestion(
  id: string,
  difficulty: "easy" | "medium" | "hard",
): MathQuestion {
  if (difficulty === "easy") {
    const a = Math.floor(100 + Math.random() * 900);
    const b = Math.floor(100 + Math.random() * 900);
    const operator = Math.random() > 0.5 ? "+" : "-";
    return {
      id,
      a,
      b,
      operator,
      answer: operator === "+" ? a + b : a - b,
      difficulty,
    };
  }

  const useDivision = difficulty === "hard" ? Math.random() < 0.55 : Math.random() < 0.35;
  if (useDivision) {
    const divisor =
      difficulty === "hard"
        ? Math.floor(2 + Math.random() * 98)
        : Math.floor(2 + Math.random() * 18);
    const quotient =
      difficulty === "hard"
        ? Math.floor(12 + Math.random() * 88)
        : Math.floor(4 + Math.random() * 46);
    return {
      id,
      a: divisor * quotient,
      b: divisor,
      operator: "÷",
      answer: quotient,
      difficulty,
    };
  }

  const a =
    difficulty === "hard"
      ? Math.floor(20 + Math.random() * 80)
      : Math.floor(10 + Math.random() * 90);
  const b =
    difficulty === "hard"
      ? Math.floor(10 + Math.random() * 90)
      : Math.floor(2 + Math.random() * 18);
  return {
    id,
    a,
    b,
    operator: "×",
    answer: a * b,
    difficulty,
  };
}

function makeMathQuestionSet() {
  const difficulties: Array<"easy" | "medium" | "hard"> = [
    "easy",
    "easy",
    "easy",
    "medium",
    "medium",
    "medium",
    "hard",
    "hard",
    "hard",
    "easy",
    "medium",
    "hard",
  ];
  return difficulties.map((difficulty, index) =>
    makeMathQuestion(`math-${index + 1}`, difficulty),
  );
}

function randomGridPosition() {
  const row = rows[Math.floor(Math.random() * rows.length)];
  const column = columns[Math.floor(Math.random() * columns.length)];
  return `${row}-${column}`;
}

function gaugeState(value: number): "high" | "low" | "safe" {
  if (value > greenHigh) return "high";
  if (value < greenLow) return "low";
  return "safe";
}

function makeGaugePlan(now: number, baseSpeed: number) {
  return {
    direction: (Math.random() > 0.5 ? 1 : -1) as 1 | -1,
    speed: baseSpeed * (0.38 + Math.random() * 1.15),
    nextChangeAt: now + 650 + Math.random() * 1850,
    pauseUntil: 0,
  };
}

export default function QuizInterface({ config, onRestart }: QuizInterfaceProps) {
  const settings = difficultySettings[config.difficulty];
  const hasMathTask = config.assessmentMode === "full";
  const [started, setStarted] = useState(false);
  const [complete, setComplete] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finalResult, setFinalResult] =
    useState<MultitaskingAssessmentResult | null>(null);
  const [systemGauge, setSystemGauge] = useState(60);
  const [activeSignal, setActiveSignal] = useState<ActiveSignal | null>(null);
  const [clickedCells, setClickedCells] = useState<Set<string>>(() => new Set());
  const [mathQuestions, setMathQuestions] = useState<MathQuestion[]>([]);
  const [mathAnswers, setMathAnswers] = useState<Record<string, string>>({});

  const startedAtRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const gaugeDirectionRef = useRef<1 | -1>(1);
  const gaugePlanRef = useRef(makeGaugePlan(0, settings.gaugeSpeed));
  const nextSignalAtRef = useRef(0);
  const activeSignalRef = useRef<ActiveSignal | null>(null);
  const allEventsRef = useRef<AssessmentEvent[]>([]);
  const clickedCellsRef = useRef<Set<string>>(new Set());
  const mathQuestionsRef = useRef<MathQuestion[]>([]);
  const mathAnswersRef = useRef<Record<string, string>>({});
  const metricsRef = useRef({
    systemFaults: 0,
    systemAcknowledgements: 0,
    systemMisses: 0,
    systemAttempts: 0,
    systemWrongCorrections: 0,
    gaugeOutOfBandSeconds: 0,
    gridHits: 0,
    gridMisses: 0,
    gridFalseAlarms: 0,
    gridWrongCellClicks: 0,
    gridDistractorClicks: 0,
    gridSignals: 0,
    gridDistractors: 0,
    mathQuestions: 0,
    mathCorrect: 0,
    mathIncorrect: 0,
    mathAnswered: 0,
  });

  useEffect(() => {
    activeSignalRef.current = activeSignal;
  }, [activeSignal]);

  useEffect(() => {
    clickedCellsRef.current = clickedCells;
  }, [clickedCells]);

  useEffect(() => {
    mathQuestionsRef.current = mathQuestions;
  }, [mathQuestions]);

  useEffect(() => {
    mathAnswersRef.current = mathAnswers;
  }, [mathAnswers]);

  const pushEvent = useCallback(
    (task: string, messageText: string, kind: EventKind) => {
      const elapsedSeconds = startedAtRef.current
        ? (performance.now() - startedAtRef.current) / 1000
        : 0;
      const entry = {
        elapsedSeconds,
        task,
        message: messageText,
        kind,
      };
      allEventsRef.current = [entry, ...allEventsRef.current];
    },
    [],
  );

  const finishAssessment = useCallback(() => {
    if (finalResult) return;
    const metrics = metricsRef.current;
    if (hasMathTask) {
      let correct = 0;
      let incorrect = 0;
      let answered = 0;
      for (const question of mathQuestionsRef.current) {
        const rawAnswer = mathAnswersRef.current[question.id]?.trim();
        if (!rawAnswer) continue;
        const value = Number(rawAnswer);
        if (Number.isNaN(value)) continue;
        answered += 1;
        if (value === question.answer) {
          correct += 1;
        } else {
          incorrect += 1;
        }
      }
      metrics.mathQuestions = mathQuestionsRef.current.length;
      metrics.mathCorrect = correct;
      metrics.mathIncorrect = incorrect;
      metrics.mathAnswered = answered;
    }
    const durationSeconds = Math.round(
      startedAtRef.current
        ? Math.min(
            config.sessionLengthSeconds,
            (performance.now() - startedAtRef.current) / 1000,
          )
        : elapsed,
    );
    const systemScore = scoreFromPenalty(
      metrics.systemMisses * 18 + metrics.gaugeOutOfBandSeconds * 0.85,
    );
    const signalTotal = Math.max(1, metrics.gridHits + metrics.gridMisses);
    const gridScore = scoreFromPenalty(
      (metrics.gridMisses / signalTotal) * 64 +
        metrics.gridWrongCellClicks * 12 +
        metrics.gridDistractorClicks * 14 +
        metrics.gridFalseAlarms * 8,
    );
    const signalScore = scoreFromPenalty(
      (metrics.gridMisses / signalTotal) * 48 +
        metrics.gridDistractorClicks * 16 +
        metrics.gridFalseAlarms * 8,
    );
    const unansweredMath = Math.max(
      0,
      metrics.mathQuestions - metrics.mathAnswered,
    );
    const mathScore =
      metrics.mathQuestions > 0
        ? Math.round((metrics.mathCorrect / metrics.mathQuestions) * 100)
        : hasMathTask
          ? 0
          : 100;
    const scores = hasMathTask
      ? [systemScore, gridScore, signalScore, mathScore]
      : [systemScore, gridScore, signalScore];

    setFinalResult({
      compositeScore: Math.round(
        scores.reduce((total, score) => total + score, 0) / scores.length,
      ),
      breakdown: {
        systemMonitoring: systemScore,
        gridSelection: gridScore,
        signalDetection: signalScore,
        ...(hasMathTask ? { resourceManagement: mathScore } : {}),
      },
      rawMetrics: {
        systemMonitoring: {
          faults: metrics.systemFaults,
          acknowledgements: metrics.systemAcknowledgements,
          misses: metrics.systemMisses,
          attempts: metrics.systemAttempts,
          wrongCorrections: metrics.systemWrongCorrections,
          gaugeOutOfBandSeconds: Math.round(metrics.gaugeOutOfBandSeconds),
        },
        gridSelection: {
          hits: metrics.gridHits,
          misses: metrics.gridMisses,
          falseAlarms: metrics.gridFalseAlarms,
          wrongCellClicks: metrics.gridWrongCellClicks,
          distractorClicks: metrics.gridDistractorClicks,
          signals: metrics.gridSignals,
        },
        signalDetection: {
          hits: metrics.gridHits,
          misses: metrics.gridMisses,
          falseAlarms: metrics.gridFalseAlarms,
          distractors: metrics.gridDistractors,
          signals: metrics.gridSignals,
        },
        ...(hasMathTask
          ? {
              resourceManagement: {
                questions: metrics.mathQuestions,
                correct: metrics.mathCorrect,
                incorrect: metrics.mathIncorrect,
                unanswered: unansweredMath,
                answered: metrics.mathAnswered,
              },
            }
          : {}),
      },
      durationSeconds,
      enabledSubtasks: hasMathTask
        ? [
            "system-monitoring",
            "grid-selection",
            "signal-detection",
            "math-questions",
            "scheduling",
          ]
        : ["system-monitoring", "grid-selection", "signal-detection"],
      eventLog: allEventsRef.current.slice().reverse(),
    });
    setComplete(true);
    setStarted(false);
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [config.sessionLengthSeconds, elapsed, finalResult, hasMathTask]);

  useRecordRealModeScore({
    completed: Boolean(finalResult),
    mode: config.mode,
    topicSlug: "multitasking-assessment",
    topicTitle: "Multitasking Assessment",
    score: finalResult?.compositeScore ?? 0,
    maxScore: 100,
    questionCount: 100,
    timeTakenSeconds: finalResult?.durationSeconds,
    difficulty: config.difficulty,
    metadata: finalResult
      ? {
          assessmentMode: config.assessmentMode,
          ownId: config.ownId,
          enabledSubtasks: finalResult.enabledSubtasks,
          breakdown: finalResult.breakdown,
          rawMetrics: finalResult.rawMetrics,
          eventLog: finalResult.eventLog,
        }
      : undefined,
  });

  const start = () => {
    const now = performance.now();
    startedAtRef.current = now;
    lastFrameRef.current = null;
    gaugePlanRef.current = makeGaugePlan(now, settings.gaugeSpeed);
    gaugeDirectionRef.current = gaugePlanRef.current.direction;
    nextSignalAtRef.current = now + randomBetween(settings.signalEveryMs);
    setClickedCells(new Set());
    if (hasMathTask) {
      const questions = makeMathQuestionSet();
      metricsRef.current.mathQuestions = questions.length;
      setMathQuestions(questions);
      setMathAnswers({});
      mathQuestionsRef.current = questions;
      mathAnswersRef.current = {};
    }
    setStarted(true);
    pushEvent("Session", "Assessment started", "info");
  };

  useEffect(() => {
    if (!started || complete) return;

    const tick = (now: number) => {
      const last = lastFrameRef.current ?? now;
      const deltaSeconds = Math.min(0.05, (now - last) / 1000);
      lastFrameRef.current = now;
      const elapsedSeconds = (now - startedAtRef.current) / 1000;
      setElapsed(elapsedSeconds);

      if (elapsedSeconds >= config.sessionLengthSeconds) {
        finishAssessment();
        return;
      }

      setSystemGauge((current) => {
        const plan = gaugePlanRef.current;
        if (now >= plan.nextChangeAt) {
          const shouldReverse =
            Math.random() < 0.46 ||
            current < greenLow - 8 ||
            current > greenHigh + 8;
          plan.direction = shouldReverse
            ? ((plan.direction * -1) as 1 | -1)
            : plan.direction;
          plan.speed = settings.gaugeSpeed * (0.28 + Math.random() * 1.35);
          plan.nextChangeAt = now + 520 + Math.random() * 2100;
          plan.pauseUntil =
            Math.random() < 0.18 ? now + 260 + Math.random() * 520 : 0;
          gaugeDirectionRef.current = plan.direction;
        }

        const paused = now < plan.pauseUntil;
        const jitter = (Math.random() - 0.5) * settings.gaugeSpeed * 0.42;
        let nextValue = current;
        if (!paused) {
          nextValue += plan.direction * plan.speed * deltaSeconds;
        }
        nextValue += jitter * deltaSeconds;

        if (nextValue >= 96) {
          nextValue = 96;
          plan.direction = -1;
          gaugeDirectionRef.current = plan.direction;
        }
        if (nextValue <= 4) {
          nextValue = 4;
          plan.direction = 1;
          gaugeDirectionRef.current = plan.direction;
        }
        if (gaugeState(nextValue) !== "safe") {
          metricsRef.current.gaugeOutOfBandSeconds += deltaSeconds;
        }
        return nextValue;
      });

      if (now >= nextSignalAtRef.current && !activeSignalRef.current) {
        const actionable = Math.random() > 0.34;
        const signal = {
          lightIndex: Math.floor(Math.random() * 3),
          position: randomGridPosition(),
          expiresAt: now + settings.signalTimeoutMs,
          actionable,
        };
        if (actionable) {
          metricsRef.current.gridSignals += 1;
        } else {
          metricsRef.current.gridDistractors += 1;
        }
        setActiveSignal(signal);
        pushEvent(
          "Grid",
          actionable
            ? `Green signal requests ${signal.position}`
            : `Red distractor shows ${signal.position}`,
          "info",
        );
        nextSignalAtRef.current = now + randomBetween(settings.signalEveryMs);
      }

      if (activeSignalRef.current && now > activeSignalRef.current.expiresAt) {
        if (activeSignalRef.current.actionable) {
          metricsRef.current.gridMisses += 1;
          pushEvent("Grid", `${activeSignalRef.current.position} missed`, "miss");
        }
        setActiveSignal(null);
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    complete,
    config.sessionLengthSeconds,
    finishAssessment,
    pushEvent,
    settings,
    started,
  ]);

  const handleSystemCorrection = (direction: Direction) => {
    const state = gaugeState(systemGauge);
    if (state === "safe") return;
    metricsRef.current.systemFaults += 1;
    metricsRef.current.systemAttempts += 1;
    const correct =
      (state === "high" && direction === "up") ||
      (state === "low" && direction === "down");
    if (correct) {
      metricsRef.current.systemAcknowledgements += 1;
      setSystemGauge(60);
      gaugeDirectionRef.current = state === "high" ? -1 : 1;
      pushEvent("System", `${direction.toUpperCase()} correction accepted`, "hit");
    } else {
      metricsRef.current.systemMisses += 1;
      metricsRef.current.systemWrongCorrections += 1;
      pushEvent("System", `${direction.toUpperCase()} correction rejected`, "miss");
    }
  };

  const handleGridClick = (position: string) => {
    if (clickedCellsRef.current.has(position)) return;
    const nextClicked = new Set(clickedCellsRef.current).add(position);
    clickedCellsRef.current = nextClicked;
    setClickedCells(nextClicked);

    const signal = activeSignalRef.current;
    if (!signal) {
      metricsRef.current.gridFalseAlarms += 1;
      pushEvent("Grid", `${position} clicked with no active signal`, "miss");
      return;
    }
    if (!signal.actionable) {
      metricsRef.current.gridFalseAlarms += 1;
      metricsRef.current.gridDistractorClicks += 1;
      pushEvent("Grid", `${position} clicked during red distractor`, "miss");
      return;
    }
    if (signal.position === position) {
      metricsRef.current.gridHits += 1;
      setActiveSignal(null);
      pushEvent("Grid", `${position} selected`, "hit");
    } else {
      metricsRef.current.gridFalseAlarms += 1;
      metricsRef.current.gridWrongCellClicks += 1;
      pushEvent("Grid", `${position} selected instead of ${signal.position}`, "miss");
    }
  };

  const systemState = gaugeState(systemGauge);

  if (finalResult) {
    const breakdownRows = [
      ["System Monitoring", finalResult.breakdown.systemMonitoring],
      ["Grid Selection", finalResult.breakdown.gridSelection],
      ["Signal Detection", finalResult.breakdown.signalDetection],
      ...(finalResult.breakdown.resourceManagement !== undefined
        ? [["Math Questions", finalResult.breakdown.resourceManagement] as const]
        : []),
    ];

    return (
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-brand-gold">
            Assessment Complete
          </p>
          <h2 className="mt-3 text-5xl font-bold text-zinc-950 dark:text-white">
            {finalResult.compositeScore}%
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Composite score across {breakdownRows.length} active scored tasks in{" "}
            {formatClock(finalResult.durationSeconds)}.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {breakdownRows.map(([label, score]) => (
              <div
                key={label}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>{label}</span>
                  <span className="text-violet-700 dark:text-brand-gold">
                    {score}%
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-violet-700 dark:bg-brand-gold"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={onRestart}
            className="mt-8 rounded-xl bg-violet-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-4xl px-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-brand-gold">
            Ready Room
          </p>
          <h2 className="mt-3 text-3xl font-bold text-zinc-950 dark:text-white">
            {formatClock(config.sessionLengthSeconds)} MATB Run
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            Keep the gauge inside the green band, respond only to green signal
            coordinates on the grid, ignore red-coordinate distractions, and
            fill math answer boxes before the timer ends.
          </p>
          <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50 p-5 text-left dark:border-brand-gold/20 dark:bg-brand-gold/10">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
              Play guide
            </h3>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-zinc-700 dark:text-zinc-200 md:grid-cols-2">
              <div>
                <span className="font-bold">System Monitoring:</span> the gauge
                marker moves with changing speed, pauses, reversals, and small
                jitter. The triangle buttons stay neutral. If the marker turns
                red above the green band, click ▲. If it turns red below the
                green band, click ▼.
              </div>
              <div>
                <span className="font-bold">Grid Selection:</span> rows are A-J
                and columns are 1-10. The cells are intentionally blank. Click
                the cell named by the active signal, such as A-4. Clicked cells
                stay green. The order does not matter. Missed green signals and
                extra clicks reduce your grid score.
              </div>
              <div>
                <span className="font-bold">Signal Lights:</span> the three red
                lights may show coordinates as distractions. Click the grid only
                when the coordinate is inside a green light. Stay still when it
                stays red.
              </div>
              <div>
                <span className="font-bold">Math Questions:</span> in Full 5,
                all mixed-difficulty questions are visible at once. Easy is
                3-digit add/subtract; harder rows include 2-digit multiply and
                clean division. There is no Submit button; typed answers are
                scored automatically when the session timer ends.
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-3 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-2">
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-white/5">
              Mode: <span className="font-bold capitalize">{config.assessmentMode}</span>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4 capitalize dark:bg-white/5">
              Difficulty: <span className="font-bold">{config.difficulty}</span>
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <button
              onClick={start}
              className="rounded-xl bg-violet-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-600"
            >
              Start Assessment
            </button>
            <button
              onClick={onRestart}
              className="rounded-xl border border-zinc-200 px-6 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const systemCard = (
    <section className="rounded-2xl border-2 border-zinc-200 bg-white p-4 dark:border-white/5 dark:bg-black/40">
      <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
        System Monitoring
      </h3>
      <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        Click ▲ only when the red marker is above the green band. Click ▼ only
        when the red marker is below the green band.
      </p>
      <div className="mt-5 flex flex-col items-center gap-3">
        <button
          onClick={() => handleSystemCorrection("up")}
          className="flex h-12 w-16 items-center justify-center rounded-xl border border-zinc-200 text-2xl font-black text-zinc-500 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/10"
          aria-label="Upper correction"
        >
          ▲
        </button>
        <div className="w-full rounded-xl border border-zinc-200 p-4 dark:border-white/10">
          <div className="flex justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
            <span>LOW</span>
            <span>{Math.round(systemGauge)}</span>
            <span>HIGH</span>
          </div>
          <div className="relative mt-4 h-5 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
            <div className="absolute left-[50%] top-0 h-full w-[20%] bg-emerald-400/45" />
            <div
              className={`absolute top-0 h-full w-3 rounded-full ${
                systemState === "safe"
                  ? "bg-violet-700 dark:bg-brand-gold"
                  : "bg-rose-500"
              }`}
              style={{ left: `${systemGauge}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => handleSystemCorrection("down")}
          className="flex h-12 w-16 items-center justify-center rounded-xl border border-zinc-200 text-2xl font-black text-zinc-500 transition hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/10"
          aria-label="Lower correction"
        >
          ▼
        </button>
      </div>
    </section>
  );

  const mathCard = hasMathTask ? (
    <section className="rounded-2xl border-2 border-zinc-200 bg-white p-4 dark:border-white/5 dark:bg-black/40">
      <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
        Math Questions
      </h3>
      <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        Fill any boxes you want. Answers are scored automatically when the
        session timer ends.
      </p>
      <div className="mt-4 max-h-[34rem] space-y-2 overflow-auto pr-1">
        {mathQuestions.map((question) => (
          <div
            key={question.id}
            className="rounded-xl bg-zinc-50 p-3 dark:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <span className="w-24 flex-1 text-base font-black text-zinc-950 dark:text-white">
                {question.a} {question.operator} {question.b}
              </span>
              <input
                inputMode="numeric"
                value={mathAnswers[question.id] ?? ""}
                onChange={(event) =>
                  setMathAnswers((current) => {
                    const next = {
                      ...current,
                      [question.id]: event.target.value,
                    };
                    mathAnswersRef.current = next;
                    return next;
                  })
                }
                className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-bold text-zinc-950 outline-none focus:border-violet-700 dark:border-white/10 dark:bg-black dark:text-white"
                placeholder="Answer"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  ) : null;

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-transparent">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 p-4 pb-8 pt-10 sm:p-6 sm:pt-12">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-zinc-200 bg-white px-6 py-4 dark:border-white/5 dark:bg-black/40 dark:backdrop-blur-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700 dark:text-brand-gold">
              Live Assessment
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Multitasking Assessment
            </h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              {config.assessmentMode === "full" ? "Full 5" : "Core 3"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Timer
              compact
              timeLimit={config.sessionLengthSeconds}
              onTimeUp={finishAssessment}
            />
            <QuizFooterNav onExit={finishAssessment} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(420px,1.35fr)_minmax(300px,0.95fr)]">
          <div className="space-y-4">{mathCard ?? systemCard}</div>

          <section className="rounded-2xl border-2 border-zinc-200 bg-white p-4 dark:border-white/5 dark:bg-black/40">
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
              Coordinate Grid
            </h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              Use row letters and column numbers to find the green signal
              coordinate. Clicked cells turn green. Extra clicks count against you.
            </p>
            <div className="mt-4 grid grid-cols-[1.5rem_repeat(10,minmax(0,1fr))] gap-1 text-center text-xs font-bold">
              <div />
              {columns.map((column) => (
                <div key={column} className="text-zinc-500 dark:text-zinc-400">
                  {column}
                </div>
              ))}
              {rows.map((row) => (
                <Fragment key={row}>
                  <div className="flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                    {row}
                  </div>
                  {columns.map((column) => {
                    const position = `${row}-${column}`;
                    const wasClicked = clickedCells.has(position);
                    return (
                      <button
                        key={position}
                        onClick={() => handleGridClick(position)}
                        aria-label={position}
                        className={`aspect-square rounded border transition ${
                          wasClicked
                            ? "border-emerald-300 bg-emerald-500 dark:border-emerald-300 dark:bg-emerald-500"
                            : "border-zinc-200 bg-zinc-50 hover:border-violet-500 hover:bg-violet-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-brand-gold/10"
                        }`}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border-2 border-zinc-200 bg-white p-4 dark:border-white/5 dark:bg-black/40">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                Signal Lights
              </h3>
              <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                Green dot with coordinate means click that grid cell. Red dot
                with coordinate is a fake cue; do nothing.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[0, 1, 2].map((index) => {
                  const isActive = activeSignal?.lightIndex === index;
                  return (
                    <div
                      key={index}
                      className={`flex aspect-square items-center justify-center rounded-full border-4 text-sm font-black ${
                        isActive && activeSignal.actionable
                          ? "border-emerald-300 bg-emerald-500 text-white"
                          : "border-rose-300 bg-rose-600 text-white/70"
                      }`}
                    >
                      {isActive ? activeSignal.position : ""}
                    </div>
                  );
                })}
              </div>
            </div>

            {hasMathTask ? systemCard : null}
          </section>
        </div>
      </div>
    </div>
  );
}
