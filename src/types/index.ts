export interface Topic {
  slug: string;
  icon: string;
  title: string;
  description: string;
  category: TopicCategory;
  isLocked?: boolean;
  coverImage?: string;
  coverImageDark?: string;
  coverBg?: string;
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
  mode: "learn" | "real";
  difficulty: "easy" | "medium" | "hard" | "mixed";
  questionCount?: number; // Default: 10
}

export interface NumberSeriesQuizResponse {
  questions: NumberSeriesQuestion[];
  mode: "learn" | "real";
  timeLimit?: number; // Seconds (real mode only)
}

export interface NumberSeriesSubmitPayload extends SubmitPayload {
  mode: "learn" | "real";
  questionIndex: number; // Current question in quiz
  timeRemaining?: number; // Seconds remaining (real mode)
  correctAnswer: number; // The correct answer (for validation)
  patternType?: NumberSeriesPatternType; // Pattern type (for explanation)
}

export interface NumberSeriesSubmitResult extends SubmitResult {
  correctAnswer?: number;
  patternExplanation?: string;
  currentScore?: number; // Running score (0-100)
}

// Calculation specific types
export type CalculationOperator = "+" | "-" | "×" | "÷";

export interface CalculationQuestion extends Question {
  id: string;
  prompt: string;
  expression: string;
  options: string[];
  correctAnswer: number;
  difficulty: "easy" | "medium" | "hard";
  explanation: string;
}

export interface CalculationQuizResponse {
  questions: CalculationQuestion[];
  mode: "learn" | "real";
  timeLimit?: number;
}

export interface CalculationSubmitPayload extends SubmitPayload {
  mode: "learn" | "real";
  questionIndex: number;
  timeRemaining?: number;
  correctAnswer: number;
}

export interface CalculationSubmitResult extends SubmitResult {
  correctAnswer?: number;
  explanation?: string;
  currentScore?: number;
}

// Scanning Practice specific types
export interface ScanningPracticeQuestion extends Question {
  id: string;
  prompt: string;
  stringA: string; // e.g., "8K2L9S1V"
  stringB: string; // e.g., "8K2L9S2V" (1 difference)
  differenceCount: number; // 0-5, the correct answer
  stringLength: number; // 12-18, for reference
}

export interface ScanningPracticeQuizRequest {
  mode: "learn" | "real";
  difficulty: "easy" | "medium" | "hard" | "mixed";
  stringLength?: number; // Default: random based on difficulty
  questionCount?: number; // Default: 40
}

export interface ScanningPracticeQuizResponse {
  questions: ScanningPracticeQuestion[];
  mode: "learn" | "real";
  timeLimit?: number; // Seconds (real mode only)
}

export interface ScanningPracticeSubmitPayload extends SubmitPayload {
  mode: "learn" | "real";
  questionIndex: number;
  timeRemaining?: number;
  differenceCount: number; // The correct answer (for validation)
}

export interface ScanningPracticeSubmitResult extends SubmitResult {
  correctAnswer?: number;
  currentScore?: number; // Running score (0-100)
}

// --- Scanning Shape specific types ---

export interface ScanningShapeQuizConfig {
  mode: "learn" | "real";
  difficulty: "easy" | "medium" | "hard" | "mixed";
  /** Number of section pairs (canvas + answer grid) to generate: 1–8 */
  sectionCount: number;
  /** Countdown seconds for Real Mode; null means no timer (Learn Mode) */
  timeLimit: number | null;
}

export type ScanningShapeType =
  | "circle"
  | "square"
  | "triangle"
  | "hexagon";

export interface ScanningShapeItem {
  id: string;
  shape: ScanningShapeType;
  digits: string;
  letter: string;
  rotation: number;
  x: number;
  y: number;
  size: number;
}

export interface ScanningShapeSection {
  id: number;
  shapes: ScanningShapeItem[];
  answerShapes: ScanningShapeItem[];
}

export interface ScanningShapeQuizResponse extends ScanningShapeQuizConfig {
  sections: ScanningShapeSection[];
}

// --- Spatial Orientation Practice Types ---

export type Direction = "L" | "R";

export interface Instruction {
  angle: number;
  dir: Direction;
}

export interface SpatialOrientationQuestion {
  id: string;
  initialHeading: number;
  sequence: Instruction[];
  targetHeading: number;
  correctAngle: number;
  correctDir: Direction;
  options: { angle: number; dir: Direction | null }[]; // null dir means "NO ANSWER"
}

export interface SpatialOrientationQuizResponse {
  questions: SpatialOrientationQuestion[];
  mode: "learn" | "real";
  timeLimit?: number;
}

export interface SpatialOrientationSubmitResult {
  correct: boolean;
  correctAngle: number;
  correctDir: Direction;
}

// --- Short-Term Memory Table Types ---

export type ShortTermMemoryContentType =
  | "alphanumeric"
  | "symbol"
  | "mixed";

export interface ShortTermMemoryOption {
  id: string;
  value: string;
  label: string;
  imageSrc?: string;
}

export interface ShortTermMemoryCell {
  id: string;
  value: string;
  label: string;
  contentType: Exclude<ShortTermMemoryContentType, "mixed">;
  imageSrc?: string;
  options?: ShortTermMemoryOption[];
}

export interface ShortTermMemoryQuizConfig {
  mode: "learn" | "real";
  rows: number;
  columns: number;
  memorizeSeconds: number;
  charactersPerCell: number;
  contentType: ShortTermMemoryContentType;
}

export interface ShortTermMemoryQuizResponse extends ShortTermMemoryQuizConfig {
  grid: ShortTermMemoryCell[][];
}
