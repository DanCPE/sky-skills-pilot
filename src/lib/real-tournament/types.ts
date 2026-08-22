export type TournamentDifficulty = "easy" | "medium" | "hard";
export type TournamentCategory =
  | "logical"
  | "spatial"
  | "scanning"
  | "approximation"
  | "short-term-memory";

export type TournamentQuestionKind =
  | "multiple-choice"
  | "string-difference"
  | "same-different";

export interface TournamentQuestionDisplay {
  id: string;
  sourceTopic: string;
  sourceTitle: string;
  prompt: string;
  kind: TournamentQuestionKind;
  difficulty: TournamentDifficulty;
  options: string[];
  detail?: {
    expression?: string;
    sequence?: number[];
      stringA?: string;
      stringB?: string;
      category?: string;
      passage?: string;
  };
}

export interface TournamentQuestionInternal extends TournamentQuestionDisplay {
  correctAnswer: string;
  explanation?: string;
}

export interface TournamentAnswerKey {
  generatedAt: string;
  expiresAt: string;
  questions: Array<{
    id: string;
    sourceTopic: string;
    roundId: string;
    difficulty: TournamentDifficulty;
    correctAnswer: string;
    explanation?: string;
  }>;
}

export interface TournamentQuestionAdapter {
  topic: string;
  title: string;
  category: TournamentCategory;
  timeLimitSeconds: number;
  generate: (
    difficulty: TournamentDifficulty,
    count: number,
  ) => TournamentQuestionInternal[];
  generateRound?: (count: number) => {
    questions: TournamentQuestionInternal[];
    briefingText?: string | null;
  };
}

export interface TournamentRoundDisplay {
  id: string;
  category: TournamentCategory;
  categoryLabel: string;
  topic: string;
  title: string;
  questionCount: number;
  timeLimitSeconds: number;
  introAutoStartSeconds: number;
  briefingText?: string | null;
  questions: TournamentQuestionDisplay[];
}

export interface TournamentQuizResponse {
  tournamentWeekId: string;
  rounds: TournamentRoundDisplay[];
  answerToken: string;
  mode: "real";
  difficulty: "mixed";
}

export interface TournamentSubmitPayload {
  answerToken?: string;
  answers?: Record<string, string>;
  roundTimes?: Record<string, number>;
  timeTakenSeconds?: number;
}

export interface TournamentSubmitResult {
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  questionCount: number;
  saved: boolean;
  rankingPosition: number | null;
  results: Array<{
    id: string;
    sourceTopic: string;
    roundId: string;
    difficulty: TournamentDifficulty;
    correct: boolean;
    correctAnswer: string;
    explanation?: string;
  }>;
}

export interface TournamentRankingEntry {
  rank: number;
  profileName: string;
  imageUrl: string | null;
  percentage: number;
  score: number;
  maxScore: number;
  correctCount: number;
  questionCount: number;
  timeTakenSeconds: number | null;
  completedAt: string;
}
