import type { TournamentCategory, TournamentDifficulty } from "./types";

export const REAL_TOURNAMENT_TOPIC = {
  slug: "real-tournament",
  title: "Real Tournament",
};

export const REAL_TOURNAMENT_TIMING = {
  roundIntroAutoStartSeconds: 2 * 60,
  passageReadingSeconds: 2 * 60,
  tokenTtlSeconds: 2 * 60 * 60,
  weekDurationMs: 7 * 24 * 60 * 60 * 1000,
};

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
