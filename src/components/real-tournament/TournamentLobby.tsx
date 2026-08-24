"use client";

import { useEffect, useState } from "react";
import RankingBoard from "./RankingBoard";
import QuizInterface from "./QuizInterface";
import { unlockTournamentAudio } from "@/lib/real-tournament/client-audio";
import type {
  TournamentQuizResponse,
  TournamentRankingEntry,
} from "@/lib/real-tournament/types";

interface AttemptStatus {
  maxAttempts: number;
  usedAttempts: number;
  remainingAttempts: number;
  weekId: string;
}

export default function TournamentLobby() {
  const [ranking, setRanking] = useState<TournamentRankingEntry[]>([]);
  const [attemptStatus, setAttemptStatus] = useState<AttemptStatus | null>(null);
  const [signInRequired, setSignInRequired] = useState(false);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [quizData, setQuizData] = useState<TournamentQuizResponse | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRanking() {
    setRankingLoading(true);
    try {
      const response = await fetch("/api/real-tournament/ranking");
      const data = (await response.json()) as {
        ranking?: TournamentRankingEntry[];
        attemptStatus?: AttemptStatus | null;
        signInRequired?: boolean;
      };
      setRanking(data.ranking ?? []);
      setAttemptStatus(data.attemptStatus ?? null);
      setSignInRequired(Boolean(data.signInRequired));
    } finally {
      setRankingLoading(false);
    }
  }

  async function startTournament() {
    setStarting(true);
    setError(null);
    void unlockTournamentAudio();

    try {
      const response = await fetch("/api/real-tournament/questions");
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Tournament is unavailable right now.");
      }

      const data = (await response.json()) as TournamentQuizResponse & {
        remainingAttempts?: number;
      };
      setAttemptStatus((current) =>
        current
          ? {
              ...current,
              usedAttempts:
                current.maxAttempts - (data.remainingAttempts ?? current.remainingAttempts),
              remainingAttempts:
                data.remainingAttempts ?? current.remainingAttempts,
            }
          : current,
      );
      setQuizData(data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Tournament is unavailable right now.",
      );
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    void loadRanking();
  }, []);

  if (quizData) {
    return (
      <QuizInterface
        quizData={quizData}
        onRestart={() => {
          setQuizData(null);
          void loadRanking();
        }}
      />
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-6">
      <section className="mx-auto max-w-3xl text-center">
        <div className="mb-3 inline-flex rounded-full bg-[#4F12A6]/10 px-3 py-1 text-xs font-bold uppercase text-[#4F12A6] dark:bg-brand-gold/10 dark:text-brand-gold">
          Fixed Mixed Difficulty
        </div>
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Five weekly topics, one ordered tournament
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Each week chooses one quest from each core category. Every round has
          a fixed question set, its own timer, and a 2-minute intro countdown
          before it auto-starts.
        </p>
        <div className="mt-6 flex justify-center">
          <button
            onClick={startTournament}
            disabled={
              starting ||
              signInRequired ||
              attemptStatus?.remainingAttempts === 0
            }
            className="rounded-lg bg-[#4F12A6] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#4F12A6]/20 transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
          >
            {starting
              ? "Preparing Tournament..."
              : signInRequired
                ? "Sign in to Start"
                : attemptStatus?.remainingAttempts === 0
                  ? "No Tokens Left"
                  : "Start Tournament"}
          </button>
        </div>
        <p className="mt-3 text-xs font-bold uppercase text-zinc-400">
          {signInRequired
            ? "Tournament entry requires sign in"
            : attemptStatus
              ? `${attemptStatus.remainingAttempts}/${attemptStatus.maxAttempts} weekly tokens remaining`
              : "Loading weekly tokens..."}
        </p>
        {error ? (
          <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-300">
            {error}
          </p>
        ) : null}
      </section>

      <RankingBoard ranking={ranking} loading={rankingLoading} />
    </div>
  );
}
