"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  TournamentQuestionDisplay,
  TournamentQuizResponse,
  TournamentRoundDisplay,
  TournamentSubmitResult,
} from "@/lib/real-tournament/types";

type Phase = "intro" | "quiz" | "results";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function QuestionDetail({ question }: { question: TournamentQuestionDisplay }) {
  if (question.detail?.sequence) {
    return (
      <div className="mt-5 flex flex-wrap justify-center gap-2 text-lg font-bold">
        {question.detail.sequence.map((value, index) => (
          <span
            key={`${value}-${index}`}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-white/10 dark:bg-white/5"
          >
            {value}
          </span>
        ))}
        <span className="rounded-lg border border-[#4F12A6]/30 bg-[#4F12A6]/10 px-3 py-2 text-[#4F12A6] dark:border-brand-gold/40 dark:bg-brand-gold/10 dark:text-brand-gold">
          ?
        </span>
      </div>
    );
  }

  if (question.detail?.expression) {
    return (
      <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-5 text-center text-xl font-bold tracking-wide text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100">
        {question.detail.expression}
      </div>
    );
  }

  if (question.detail?.stringA && question.detail?.stringB) {
    return (
      <div className="mt-5 grid gap-3 font-mono text-lg font-bold tracking-wider">
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
          {question.detail.stringA}
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
          {question.detail.stringB}
        </div>
      </div>
    );
  }

  return null;
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
          10 questions. This round has its own clock. Finish it to unlock the
          next tournament topic.
        </p>

        {round.briefingText ? (
          <div className="mx-auto mt-6 max-h-72 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-left text-sm leading-7 text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
            {round.briefingText}
          </div>
        ) : null}

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
    quizData.rounds[0]?.introAutoStartSeconds ?? 120,
  );
  const [roundSecondsLeft, setRoundSecondsLeft] = useState(
    quizData.rounds[0]?.timeLimitSeconds ?? 300,
  );
  const [roundTimes, setRoundTimes] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TournamentSubmitResult | null>(null);
  const tournamentStartedAtRef = useRef(Date.now());
  const roundStartedAtRef = useRef(Date.now());
  const submittedRef = useRef(false);

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

  function startRound() {
    if (!currentRound) return;
    roundStartedAtRef.current = Date.now();
    setQuestionIndex(0);
    setRoundSecondsLeft(currentRound.timeLimitSeconds);
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
    } finally {
      setSubmitting(false);
    }
  }

  function finishRound() {
    if (!currentRound) return;

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
      void submitTournament(nextRoundTimes);
      return;
    }

    const nextRound = quizData.rounds[roundIndex + 1];
    setRoundIndex((value) => value + 1);
    setQuestionIndex(0);
    setIntroSecondsLeft(nextRound.introAutoStartSeconds);
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

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black/30">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#4F12A6]/10 px-3 py-1 text-xs font-bold text-[#4F12A6] dark:bg-brand-gold/10 dark:text-brand-gold">
            {currentRound.categoryLabel}
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold capitalize text-zinc-500 dark:bg-white/10 dark:text-zinc-300">
            {currentQuestion.difficulty}
          </span>
        </div>

        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {currentQuestion.prompt}
        </h2>
        <QuestionDetail question={currentQuestion} />

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {currentQuestion.options.map((option) => {
            const selected = answers[currentQuestion.id] === option;
            return (
              <button
                key={option}
                onClick={() =>
                  setAnswers((current) => ({
                    ...current,
                    [currentQuestion.id]: option,
                  }))
                }
                className={`min-h-12 rounded-lg border px-4 py-3 text-left text-sm font-bold transition ${
                  selected
                    ? "border-[#4F12A6] bg-[#4F12A6] text-white"
                    : "border-zinc-200 bg-white text-zinc-800 hover:border-[#4F12A6]/50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
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
