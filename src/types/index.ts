export interface Topic {
  slug: string;
  icon: string;
  title: string;
  description: string;
  category: TopicCategory;
  isLocked?: boolean;
}

export type TopicCategory = "scanning" | "logical" | "spatial" | "approximation" | "short-term-memory";

export interface Question {
  id: string;
  prompt: string;
  options?: string[];
}

export interface SubmitPayload {
  questionId: string;
  answer: string;
}

export interface SubmitResult {
  correct: boolean;
  explanation?: string;
}

// Number Series specific types
export type NumberSeriesPatternType =
  | "arithmetic" // Add/subtract constant (e.g., 2,4,6,8,?)
  | "geometric" // Multiply/divide constant (e.g., 2,4,8,16,?)
  | "fibonacci" // Sum of previous two (e.g., 1,1,2,3,5,?)
  | "square" // Square numbers (e.g., 1,4,9,16,?)
  | "cube" // Cube numbers (e.g., 1,8,27,64,?)
  | "mixed_operation" // Combination (e.g., +2, ×3, +2, ×3)
  | "alternating" // Two interleaved sequences
  | "prime" // Prime numbers (e.g., 2,3,5,7,11,?)
  | "powers_of_two"; // Powers of 2 (e.g., 2,4,8,16,32,?)

export interface NumberSeriesQuestion extends Question {
  id: string;
  prompt: string;
  options: string[]; // 5 options: 1 correct, 4 distractors
  patternType: NumberSeriesPatternType;
  sequence: number[]; // The visible sequence (e.g., [2,4,6,8])
  correctAnswer: number; // The missing number
  difficulty: "easy" | "medium" | "hard";
  explanation: string; // Pattern explanation
}

export interface NumberSeriesQuizRequest {
  mode: "learning" | "practice";
  difficulty: "easy" | "medium" | "hard" | "mixed";
  questionCount?: number; // Default: 10
}

export interface NumberSeriesQuizResponse {
  questions: NumberSeriesQuestion[];
  mode: "learning" | "practice";
  timeLimit?: number; // Seconds (practice mode only)
}

export interface NumberSeriesSubmitPayload extends SubmitPayload {
  mode: "learning" | "practice";
  questionIndex: number; // Current question in quiz
  timeRemaining?: number; // Seconds remaining (practice mode)
  correctAnswer: number; // The correct answer (for validation)
  patternType?: NumberSeriesPatternType; // Pattern type (for explanation)
}

export interface NumberSeriesSubmitResult extends SubmitResult {
  correctAnswer?: number;
  patternExplanation?: string;
  currentScore?: number; // Running score (0-100)
}
