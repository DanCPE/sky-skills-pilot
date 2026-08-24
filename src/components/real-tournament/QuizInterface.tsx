"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  playTournamentSound,
  unlockTournamentAudio,
} from "@/lib/real-tournament/client-audio";
import type {
  TournamentQuestionDisplay,
  TournamentQuizResponse,
  TournamentRoundDisplay,
  TournamentSubmitResult,
} from "@/lib/real-tournament/types";

type Phase = "intro" | "reading" | "quiz" | "results";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function AirplaneIcon({
  angle,
  color = "currentColor",
}: {
  angle: number;
  color?: string;
}) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center"
      style={{ transform: `rotate(${angle}deg)` }}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-full w-full drop-shadow-sm"
        style={{ transform: "translateX(1px)" }}
      >
        <path
          d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
          fill={color}
        />
      </svg>
    </div>
  );
}

function CompassCircle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ticks = Array.from({ length: 16 }, (_, index) => index * 22.5);

  return (
    <div
      className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
    >
      <div className="absolute inset-0">
        {ticks.map((deg) => (
          <div
            key={deg}
            className="absolute h-full w-full"
            style={{ transform: `rotate(${deg}deg)` }}
          >
            <div
              className={`mx-auto h-1.5 ${
                deg % 90 === 0
                  ? "w-1 bg-zinc-400 dark:bg-zinc-500"
                  : deg % 45 === 0
                    ? "w-0.5 bg-zinc-300 dark:bg-zinc-600"
                    : "w-px bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
        <div className="absolute h-px w-[95%] bg-zinc-300 dark:bg-white/20" />
        <div className="absolute h-[95%] w-px bg-zinc-300 dark:bg-white/20" />
        <div className="absolute h-px w-[95%] rotate-45 bg-zinc-300 dark:bg-white/20" />
        <div className="absolute h-px w-[95%] -rotate-45 bg-zinc-300 dark:bg-white/20" />
      </div>
      <div className="relative z-10 flex h-full w-full items-center justify-center p-2">
        {children}
      </div>
    </div>
  );
}

function AircraftRotationDetail({
  question,
}: {
  question: TournamentQuestionDisplay;
}) {
  const aircraft = question.detail?.aircraftRotation;
  if (!aircraft) return null;

  return (
    <div className="mt-5 flex flex-1 items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-white/15 dark:bg-zinc-900/80">
      <CompassCircle className="ring-2 ring-blue-500/20">
        <AirplaneIcon angle={aircraft.initialHeading} color="#3b82f6" />
      </CompassCircle>

      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2 py-1">
        {aircraft.sequence.map((step, index) => {
          const isLast = index === aircraft.sequence.length - 1;
          return (
            <span
              key={`${step.angle}-${step.dir}-${index}`}
              className="flex items-center gap-2"
            >
              <span className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-bold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
                <span>{step.angle}</span>
                <span
                  className={
                    step.dir === "L"
                      ? "font-bold text-blue-500 dark:text-blue-400"
                      : "font-bold text-amber-500 dark:text-amber-400"
                  }
                >
                  {step.dir}
                </span>
              </span>
              {!isLast ? (
                <span className="shrink-0 font-bold text-zinc-400 dark:text-zinc-600">
                  →
                </span>
              ) : null}
            </span>
          );
        })}
      </div>

      <CompassCircle className="ring-2 ring-brand-purple/20">
        <AirplaneIcon angle={aircraft.targetHeading} color="#8b5cf6" />
      </CompassCircle>
    </div>
  );
}

function QuestionDetail({ question }: { question: TournamentQuestionDisplay }) {
  if (question.detail?.aircraftRotation) {
    return <AircraftRotationDetail question={question} />;
  }

  if (question.detail?.sequence) {
    return (
      <div className="mt-5 flex min-h-[100px] items-center justify-center overflow-hidden rounded-[1rem] border-2 border-[#4F12A6] bg-white px-6 py-4 dark:border-white/90 dark:bg-zinc-900/80">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
          {question.detail.sequence.map((value, index) => (
            <span
              key={`${value}-${index}`}
              className="contents"
            >
              <span className="text-[36px] font-bold tracking-tight text-zinc-900 dark:text-white">
                {value}
              </span>
              <span className="text-[36px] font-semibold text-black dark:text-zinc-600">
                ,
              </span>
            </span>
          ))}
          <span className="text-[36px] font-semibold tracking-tight text-zinc-900 dark:text-white">
            ?
          </span>
          {question.detail.nextNumberAfterAnswer !== undefined ? (
            <>
              <span className="text-[36px] font-semibold text-black dark:text-zinc-600">
                ,
              </span>
              <span className="text-[36px] font-bold tracking-tight text-zinc-900 dark:text-white">
                {question.detail.nextNumberAfterAnswer}
              </span>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  if (question.detail?.expression) {
    const tokens = question.detail.expression.split(" ");
    return (
      <div className="mt-5 flex min-h-[100px] items-center justify-center overflow-hidden rounded-[1rem] border-2 border-[#4F12A6] bg-white px-6 py-4 dark:border-white/90 dark:bg-zinc-900/80">
        <span
          className={`text-center font-bold tracking-tight text-zinc-900 dark:text-white ${
            question.sourceTopic === "missing-operator"
              ? "inline-flex flex-wrap items-center gap-x-[0.25em] text-[32px] leading-none md:text-[42px]"
              : "text-[32px] md:text-[42px]"
          }`}
        >
          {question.sourceTopic === "missing-operator"
            ? tokens.map((token, index) =>
                token === "?" ? (
                  <span
                    key={`${token}-${index}`}
                    className="inline-block h-[0.65em] w-[0.65em] border-[3px] border-zinc-900 bg-white dark:border-white dark:bg-zinc-900"
                  />
                ) : (
                  <span key={`${token}-${index}`}>{token}</span>
                ),
              )
            : question.detail.expression}
        </span>
      </div>
    );
  }

  if (question.detail?.stringA && question.detail?.stringB) {
    return (
      <div className="mt-5 mb-1 flex w-full flex-row gap-2">
        <div className="flex min-w-0 flex-1 flex-col justify-center rounded-xl border-2 border-transparent bg-zinc-100 p-3 dark:border-white/5 dark:bg-white/5">
          <div className="mb-1 text-[9px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            String A
          </div>
          <div className="break-all text-center text-[20px] font-bold text-zinc-900 dark:text-zinc-100">
            {question.detail.stringA}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center rounded-xl border-2 border-transparent bg-zinc-100 p-3 dark:border-white/5 dark:bg-white/5">
          <div className="mb-1 text-[9px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            String B
          </div>
          <div className="break-all text-center text-[20px] font-bold text-zinc-900 dark:text-zinc-100">
            {question.detail.stringB}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function getOptionLabel(question: TournamentQuestionDisplay, option: string) {
  if (!question.detail?.aircraftRotation) return option;
  if (option === "NO ANSWER") return "N/A";

  const match = option.match(/^([\d.]+)([LR])$/);
  return match ? `${match[1]} ${match[2]}` : option;
}

function OptionButtons({
  question,
  selectedAnswer,
  onAnswer,
}: {
  question: TournamentQuestionDisplay;
  selectedAnswer?: string;
  onAnswer: (answer: string) => void;
}) {
  if (question.sourceTopic === "passage-recall") {
    return (
      <div className="mt-8 grid gap-4">
        {question.options.map((option, index) => {
          const selected = selectedAnswer === option;
          const label = String.fromCharCode(65 + index);

          return (
            <button
              key={`${option}-${index}`}
              onClick={() => onAnswer(option)}
              className={`flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all duration-300 ${
                selected
                  ? "border-[#4F12A6] bg-[#4F12A6] text-white"
                  : "border-[#E0E0E0] bg-white text-zinc-900 hover:border-zinc-400 hover:bg-zinc-50 dark:border-white/5 dark:bg-zinc-950 dark:text-white dark:hover:border-white/20 dark:hover:bg-zinc-900"
              }`}
            >
              <span className="text-[16px] font-bold">{option}</span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[12px] font-bold ${
                  selected
                    ? "border-white/50 bg-white/10 text-white"
                    : "border-[#E0E0E0] text-zinc-500 dark:border-white/20 dark:text-zinc-300"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (
    question.sourceTopic === "string-comparison" ||
    question.sourceTopic === "string-sprint"
  ) {
    const isSprint = question.sourceTopic === "string-sprint";
    return (
      <div className={isSprint ? "mt-7 grid grid-cols-2 gap-2" : "mt-7 flex justify-center gap-2"}>
        {question.options.map((option) => {
          const selected = selectedAnswer === option;
          return (
            <button
              key={option}
              onClick={() => onAnswer(option)}
              className={`rounded-xl border-2 font-bold transition-all active:scale-95 ${
                isSprint
                  ? "px-4 py-3 text-lg"
                  : "max-w-[100px] flex-1 px-3 py-2 text-lg"
              } ${
                selected
                  ? "border-[#4F12A6] bg-[#4F12A6] text-white shadow-md shadow-[#4F12A6]/20"
                  : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700"
              }`}
            >
              {getOptionLabel(question, option)}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.detail?.aircraftRotation) {
    return (
      <div className="mt-7 grid grid-cols-5 gap-2">
        {question.options.map((option, index) => {
          const selected = selectedAnswer === option;
          return (
            <button
              key={`${option}-${index}`}
              onClick={() => onAnswer(option)}
              className={`h-12 rounded-xl border-2 px-2 text-xs font-bold tracking-tight transition-all sm:px-3 sm:text-sm ${
                selected
                  ? "z-10 scale-105 border-[#4F12A6] bg-[#4F12A6] text-white shadow-lg shadow-[#4F12A6]/20"
                  : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-400 hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-950 dark:text-white dark:hover:border-white/20 dark:hover:bg-zinc-900"
              }`}
            >
              {getOptionLabel(question, option)}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-7 w-full">
      <div className="flex items-start justify-between gap-2">
        {question.options.map((option, index) => {
          const selected = selectedAnswer === option;
          const label = String.fromCharCode(65 + index);

          return (
            <div
              key={`${option}-${index}`}
              className="flex max-w-[200px] flex-1 flex-col items-center gap-4"
            >
              <button
                onClick={() => onAnswer(option)}
                className={`h-10 w-full rounded-2xl border-2 text-[14px] font-bold transition-all duration-300 md:h-12 md:text-[16px] ${
                  selected
                    ? "z-10 scale-105 border-[#4F12A6] bg-[#4F12A6] text-white"
                    : "border-[#E0E0E0] bg-white text-zinc-900 hover:border-zinc-400 hover:bg-zinc-50 dark:border-white/5 dark:bg-zinc-950 dark:text-white dark:hover:border-white/20 dark:hover:bg-zinc-900"
                }`}
              >
                {getOptionLabel(question, option)}
              </button>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[12px] font-bold transition-all duration-300 ${
                  selected
                    ? "scale-110 border-[#4F12A6] bg-[#4F12A6] text-white"
                    : "border-[#E0E0E0] text-zinc-500 dark:border-white/20"
                }`}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TournamentQuestionCard({
  question,
  selectedAnswer,
  onAnswer,
}: {
  question: TournamentQuestionDisplay;
  selectedAnswer?: string;
  onAnswer: (answer: string) => void;
}) {
  const isApproximation = question.sourceTopic === "approximation";
  const isScanning =
    question.sourceTopic === "string-comparison" ||
    question.sourceTopic === "string-sprint";

  return (
    <div
      className={`rounded-2xl border-2 bg-white px-4 py-6 transition-shadow hover:shadow-xl dark:bg-black/20 ${
        isScanning
          ? "border-zinc-200 dark:border-white/10"
          : "border-[#E2EAF0] dark:border-white/5"
      }`}
    >
      <div className="text-center">
        {isApproximation && question.detail?.category ? (
          <span className="mb-4 inline-block rounded-md bg-[#4F12A6]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#4F12A6] dark:bg-violet-400/10 dark:text-violet-300">
            {question.detail.category.replace(/_/g, " ")}
          </span>
        ) : null}
        <h2
          className={`font-bold tracking-tight text-zinc-900 drop-shadow-sm dark:text-white ${
            question.sourceTopic === "passage-recall"
              ? "text-[18px]"
              : "text-[16px] md:text-[20px]"
          }`}
        >
          {question.prompt}
        </h2>
      </div>

      <QuestionDetail question={question} />
      <OptionButtons
        question={question}
        selectedAnswer={selectedAnswer}
        onAnswer={onAnswer}
      />
    </div>
  );
}

function RoundIntro({
  round,
  roundNumber,
  totalRounds,
  secondsLeft,
  onStart,
}: {
  round: TournamentRoundDisplay;
  roundNumber: number;
  totalRounds: number;
  secondsLeft: number;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center px-6 py-10">
      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-xl dark:border-white/10 dark:bg-black/60">
        <p className="text-xs font-bold uppercase text-[#4F12A6] dark:text-brand-gold">
          Round {roundNumber} of {totalRounds} · {round.categoryLabel}
        </p>
        <h1 className="mt-3 text-4xl font-bold text-zinc-900 dark:text-zinc-100">
          {round.title}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          {round.questions.length} questions. This round has its own clock. Finish
          it to unlock the next tournament topic.
        </p>
        <p className="mt-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
          {round.secondsPerQuestion
            ? `${round.secondsPerQuestion} seconds per question`
            : `${formatTime(round.timeLimitSeconds)} fixed round timer`}
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={onStart}
            className="rounded-lg bg-[#4F12A6] px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            Start {round.title}
          </button>
          <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            Auto-start in {formatTime(secondsLeft)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function QuizInterface({
  quizData,
  onRestart,
}: {
  quizData: TournamentQuizResponse;
  onRestart: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [roundIndex, setRoundIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [introSecondsLeft, setIntroSecondsLeft] = useState(
    quizData.rounds[0]?.introAutoStartSeconds ?? 0,
  );
  const [readingSecondsLeft, setReadingSecondsLeft] = useState(
    quizData.rounds[0]?.readingDurationSeconds ?? 0,
  );
  const [roundSecondsLeft, setRoundSecondsLeft] = useState(
    quizData.rounds[0]?.timeLimitSeconds ?? 0,
  );
  const [roundTimes, setRoundTimes] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TournamentSubmitResult | null>(null);
  const tournamentStartedAtRef = useRef(Date.now());
  const roundStartedAtRef = useRef(Date.now());
  const submittedRef = useRef(false);
  const phaseRef = useRef<Phase>("intro");
  const finishingRoundRef = useRef(false);
  const warningKeysRef = useRef(new Set<string>());

  const currentRound = quizData.rounds[roundIndex];
  const currentQuestion = currentRound?.questions[questionIndex];
  const totalQuestions = quizData.rounds.reduce(
    (sum, round) => sum + round.questions.length,
    0,
  );
  const answeredCount = Object.keys(answers).length;
  const resultById = useMemo(
    () => new Map(result?.results.map((item) => [item.id, item]) ?? []),
    [result],
  );

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  function startRound() {
    if (!currentRound || phaseRef.current !== "intro") return;
    void unlockTournamentAudio();
    playTournamentSound("start");
    setQuestionIndex(0);
    setRoundSecondsLeft(currentRound.timeLimitSeconds);

    if (currentRound.briefingText) {
      setReadingSecondsLeft(currentRound.readingDurationSeconds ?? 0);
      setPhase("reading");
      return;
    }

    roundStartedAtRef.current = Date.now();
    finishingRoundRef.current = false;
    setPhase("quiz");
  }

  function startRoundQuestions() {
    if (!currentRound || phaseRef.current !== "reading") return;
    void unlockTournamentAudio();
    playTournamentSound("start");
    roundStartedAtRef.current = Date.now();
    setRoundSecondsLeft(currentRound.timeLimitSeconds);
    finishingRoundRef.current = false;
    setPhase("quiz");
  }

  async function submitTournament(nextRoundTimes = roundTimes) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    const timeTakenSeconds = Math.max(
      0,
      Math.round((Date.now() - tournamentStartedAtRef.current) / 1000),
    );

    try {
      const response = await fetch("/api/real-tournament/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          answerToken: quizData.answerToken,
          answers,
          roundTimes: nextRoundTimes,
          timeTakenSeconds,
        }),
      });

      if (!response.ok) {
        throw new Error("Submit failed");
      }

      setResult((await response.json()) as TournamentSubmitResult);
      setPhase("results");
    } catch {
      submittedRef.current = false;
      finishingRoundRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  function finishRound() {
    if (!currentRound || phaseRef.current !== "quiz" || finishingRoundRef.current) {
      return;
    }

    finishingRoundRef.current = true;

    const elapsedSeconds = Math.max(
      0,
      Math.round((Date.now() - roundStartedAtRef.current) / 1000),
    );
    const nextRoundTimes = {
      ...roundTimes,
      [currentRound.id]: elapsedSeconds,
    };
    setRoundTimes(nextRoundTimes);

    if (roundIndex >= quizData.rounds.length - 1) {
      playTournamentSound("complete");
      void submitTournament(nextRoundTimes);
      return;
    }

    const nextRound = quizData.rounds[roundIndex + 1];
    setRoundIndex((value) => value + 1);
    setQuestionIndex(0);
    setIntroSecondsLeft(nextRound.introAutoStartSeconds);
    setReadingSecondsLeft(nextRound.readingDurationSeconds ?? 0);
    setRoundSecondsLeft(nextRound.timeLimitSeconds);
    setPhase("intro");
  }

  useEffect(() => {
    if (phase !== "intro" || !currentRound) return;

    const timer = window.setInterval(() => {
      setIntroSecondsLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          window.setTimeout(startRound, 0);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase, currentRound]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== "reading") return;

    const timer = window.setInterval(() => {
      setReadingSecondsLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          window.setTimeout(startRoundQuestions, 0);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase, roundIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== "reading") return;

    const key = `reading:${roundIndex}:${readingSecondsLeft}`;
    if (warningKeysRef.current.has(key)) return;

    if ([60, 30, 10].includes(readingSecondsLeft)) {
      warningKeysRef.current.add(key);
      playTournamentSound("warning");
      return;
    }

    if (readingSecondsLeft > 0 && readingSecondsLeft <= 5) {
      warningKeysRef.current.add(key);
      playTournamentSound("tick");
    }
  }, [phase, readingSecondsLeft, roundIndex]);

  useEffect(() => {
    if (phase !== "quiz" || result) return;

    const timer = window.setInterval(() => {
      setRoundSecondsLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          window.setTimeout(finishRound, 0);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase, result, roundIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== "quiz" || result) return;

    const key = `round:${roundIndex}:${roundSecondsLeft}`;
    if (warningKeysRef.current.has(key)) return;

    if ([60, 30, 10].includes(roundSecondsLeft)) {
      warningKeysRef.current.add(key);
      playTournamentSound("warning");
      return;
    }

    if (roundSecondsLeft > 0 && roundSecondsLeft <= 5) {
      warningKeysRef.current.add(key);
      playTournamentSound("tick");
    }
  }, [phase, result, roundIndex, roundSecondsLeft]);

  if (!currentRound) {
    return null;
  }

  if (phase === "intro") {
    return (
      <RoundIntro
        round={currentRound}
        roundNumber={roundIndex + 1}
        totalRounds={quizData.rounds.length}
        secondsLeft={introSecondsLeft}
        onStart={startRound}
      />
    );
  }

  if (phase === "reading") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center px-6 py-10">
        <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-black/60">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-[#4F12A6] dark:text-brand-gold">
                Round {roundIndex + 1} of {quizData.rounds.length} · Reading
              </p>
              <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {currentRound.title}
              </h1>
            </div>
            <span className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-bold text-white dark:bg-brand-gold dark:text-black">
              {formatTime(readingSecondsLeft)}
            </span>
          </div>

          <div className="max-h-[56vh] overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
            {currentRound.briefingText}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={startRoundQuestions}
              className="rounded-lg bg-[#4F12A6] px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
            >
              Start Recall Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    const allQuestions = quizData.rounds.flatMap((round) => round.questions);

    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase text-[#4F12A6] dark:text-brand-gold">
            Real Tournament Complete
          </p>
          <h1 className="mt-2 text-5xl font-bold text-zinc-900 dark:text-zinc-100">
            {result.percentage}%
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            {result.correctCount} correct out of {result.questionCount}
            {result.rankingPosition
              ? ` · Current rank #${result.rankingPosition}`
              : ""}
          </p>
        </div>

        <div className="mb-8 grid gap-3">
          {allQuestions.map((question, index) => {
            const item = resultById.get(question.id);
            return (
              <div
                key={question.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-black/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-zinc-400">
                      {index + 1}. {question.sourceTitle}
                    </p>
                    <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">
                      {question.prompt}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      item?.correct
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                    }`}
                  >
                    {item?.correct ? "Correct" : "Missed"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                  Answer: {item?.correctAnswer}
                  {item?.explanation ? ` · ${item.explanation}` : ""}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button
            onClick={onRestart}
            className="rounded-lg bg-[#4F12A6] px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            Back to Tournament Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-zinc-400">
            Round {roundIndex + 1} of {quizData.rounds.length} · Question{" "}
            {questionIndex + 1} of {currentRound.questions.length}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {currentRound.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-bold dark:border-white/10">
            {answeredCount}/{totalQuestions}
          </span>
          <span className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-bold text-white dark:bg-brand-gold dark:text-black">
            {formatTime(roundSecondsLeft)}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black/30 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 px-1">
          <span className="rounded-full bg-[#4F12A6]/10 px-3 py-1 text-xs font-bold text-[#4F12A6] dark:bg-brand-gold/10 dark:text-brand-gold">
            {currentRound.categoryLabel}
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold capitalize text-zinc-500 dark:bg-white/10 dark:text-zinc-300">
            {currentQuestion.difficulty}
          </span>
        </div>

        <TournamentQuestionCard
          question={currentQuestion}
          selectedAnswer={answers[currentQuestion.id]}
          onAnswer={(option) =>
            setAnswers((current) => ({
              ...current,
              [currentQuestion.id]: option,
            }))
          }
        />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          onClick={() => setQuestionIndex((value) => Math.max(0, value - 1))}
          disabled={questionIndex === 0}
          className="rounded-lg border border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
        >
          Previous
        </button>
        {questionIndex === currentRound.questions.length - 1 ? (
          <button
            onClick={finishRound}
            disabled={submitting}
            className="rounded-lg bg-[#4F12A6] px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Finish Round"}
          </button>
        ) : (
          <button
            onClick={() =>
              setQuestionIndex((value) =>
                Math.min(currentRound.questions.length - 1, value + 1),
              )
            }
            className="rounded-lg bg-[#4F12A6] px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
