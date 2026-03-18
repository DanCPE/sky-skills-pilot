import type {
  ScanningPracticeQuestion,
} from "@/types";

// Character pools: Exclude O/0 and I/1 for clarity
const CHARACTER_POOL_ALPHANUMERIC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CHARACTER_POOL_SPECIAL = "!@#$%^&*()-_=+[]{}|;:,.<>?";
const CHARACTER_POOL_HARD = CHARACTER_POOL_ALPHANUMERIC + CHARACTER_POOL_SPECIAL;

export type Difficulty = "easy" | "medium" | "hard" | "mixed";

// Helper: Generate unique question ID
function generateId(): string {
  return `sp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Helper: Generate random number in range (inclusive)
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: Generate random string from character pool
function randomString(length: number, pool: string): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    result += pool[randomIndex];
  }
  return result;
}

// Helper: Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper: Create string B with exact number of differences from string A
function createStringWithDifferences(
  stringA: string, 
  differenceCount: number,
  pool: string
): string {
  // If no differences, return identical string
  if (differenceCount === 0) {
    return stringA;
  }

  // Get all character positions and shuffle them
  const positions = Array.from({ length: stringA.length }, (_, i) => i);
  const shuffledPositions = shuffleArray(positions);

  // Take the first 'differenceCount' positions to change
  const positionsToChange = shuffledPositions.slice(0, differenceCount);

  // Create string B as a copy of string A
  const stringB = stringA.split("");

  // Change characters at selected positions
  for (const pos of positionsToChange) {
    const oldChar = stringB[pos];
    let newChar: string;

    // Keep generating a new character until we get a different one
    do {
      const randomIndex = Math.floor(Math.random() * pool.length);
      newChar = pool[randomIndex];
    } while (newChar === oldChar);

    stringB[pos] = newChar;
  }

  return stringB.join("");
}

// Generate a single scanning question
function generateQuestion(
  difficulty: Difficulty = "medium",
  fixedStringLength?: number
): ScanningPracticeQuestion {
  let activeDifficulty = difficulty;
  if (difficulty === "mixed") {
    const diffs: Difficulty[] = ["easy", "medium", "hard"];
    activeDifficulty = diffs[Math.floor(Math.random() * diffs.length)];
  }

  // Determine string length and pool based on difficulty
  let stringLength: number;
  let pool: string = CHARACTER_POOL_ALPHANUMERIC;

  switch (activeDifficulty) {
    case "easy":
      stringLength = fixedStringLength ?? randomInRange(6, 10);
      break;
    case "hard":
      stringLength = fixedStringLength ?? randomInRange(18, 24);
      pool = CHARACTER_POOL_HARD;
      break;
    case "medium":
    default:
      stringLength = fixedStringLength ?? randomInRange(12, 16);
      break;
  }

  // Determine the number of differences (random 0-5)
  const differenceCount = randomInRange(0, 5);

  // Generate string A
  const stringA = randomString(stringLength, pool);

  // Generate string B with exact differences
  const stringB = createStringWithDifferences(stringA, differenceCount, pool);

  return {
    id: generateId(),
    prompt: "Compare the strings below. How many characters are different?",
    stringA,
    stringB,
    differenceCount,
    stringLength,
  };
}

// Quiz batch generator
export function generateQuiz(
  questionCount: number,
  difficulty: Difficulty = "medium",
  fixedStringLength?: number
): ScanningPracticeQuestion[] {
  const questions: ScanningPracticeQuestion[] = [];

  for (let i = 0; i < questionCount; i++) {
    questions.push(generateQuestion(difficulty, fixedStringLength));
  }

  return questions;
}
