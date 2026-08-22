import type { TournamentCategory, TournamentDifficulty } from "./types";

export const REAL_TOURNAMENT_TOPIC = {
  slug: "real-tournament",
  title: "Real Tournament",
};

export const ROUND_QUESTION_COUNT = 10;
export const ROUND_INTRO_AUTO_START_SECONDS = 2 * 60;

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
  { difficulty: "easy", count: 3 },
  { difficulty: "medium", count: 4 },
  { difficulty: "hard", count: 3 },
];
