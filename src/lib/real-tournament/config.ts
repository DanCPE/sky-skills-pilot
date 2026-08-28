import type { TournamentCategory, TournamentDifficulty } from "./types";

export const REAL_TOURNAMENT_TOPIC = {
  slug: "real-tournament",
  title: "Real Tournament",
};

export const REAL_TOURNAMENT_MAX_ATTEMPTS_PER_WEEK = 3;

export const REAL_TOURNAMENT_TIMING = {
  roundIntroAutoStartSeconds: 2 * 60,
  passageReadingSeconds: 2 * 60,
  tokenTtlSeconds: 2 * 60 * 60,
  weekDurationMs: 7 * 24 * 60 * 60 * 1000,
};

// 2026-08-29 00:00 in Asia/Bangkok. Stored as UTC so server/client
// environments calculate the same tournament window.
const REAL_TOURNAMENT_EPOCH_MS = Date.UTC(2026, 7, 28, 17, 0, 0);

export const TOURNAMENT_CATEGORIES: Array<{
  category: TournamentCategory;
  label: string;
  candidates: string[];
}> = [
  {
    category: "logical",
    label: "Logical",
    candidates: ["number-series"],
  },
  {
    category: "spatial",
    label: "Spatial Orientation",
    candidates: ["aircraft-rotation"],
  },
  {
    category: "scanning",
    label: "Scanning",
    candidates: ["string-comparison", "string-sprint"],
  },
  {
    category: "approximation",
    label: "Approximation",
    candidates: ["calculate", "approximation", "missing-operator"],
  },
  {
    category: "short-term-memory",
    label: "Short-Term Memory",
    candidates: ["passage-recall"],
  },
];

export const MIXED_ROUND_DIFFICULTY_PLAN: Array<{
  difficulty: TournamentDifficulty;
  count: number;
}> = [
  { difficulty: "easy", count: 0 },
  { difficulty: "medium", count: 10 },
  { difficulty: "hard", count: 10 },
];

export const ROUND_QUESTION_COUNT = MIXED_ROUND_DIFFICULTY_PLAN.reduce(
  (total, entry) => total + entry.count,
  0,
);

export function getRealTournamentWeekTiming(now = Date.now()) {
  const elapsedMs = Math.max(0, now - REAL_TOURNAMENT_EPOCH_MS);
  const weekIndex = Math.floor(
    elapsedMs / REAL_TOURNAMENT_TIMING.weekDurationMs,
  );
  const weekStartMs =
    REAL_TOURNAMENT_EPOCH_MS +
    weekIndex * REAL_TOURNAMENT_TIMING.weekDurationMs;
  const weekEndMs = weekStartMs + REAL_TOURNAMENT_TIMING.weekDurationMs;

  return {
    weekIndex,
    weekId: `week-${weekIndex}`,
    weekStartMs,
    weekEndMs,
  };
}
