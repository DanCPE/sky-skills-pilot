import type { StringSprintQuestion } from "@/types";

const CHARACTER_POOL_ALPHANUMERIC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CHARACTER_POOL_SPECIAL = "!@#$%^&*()-_=+[]{}|;:,.<>?";
const CHARACTER_POOL_HARD = CHARACTER_POOL_ALPHANUMERIC + CHARACTER_POOL_SPECIAL;

export type Difficulty = "easy" | "medium" | "hard" | "mixed";

function generateId(): string {
  return `ss_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomString(length: number, pool: string): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += pool[Math.floor(Math.random() * pool.length)];
  }
  return result;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createStringWithDifferences(
  stringA: string,
  differenceCount: number,
  pool: string,
): string {
  if (differenceCount === 0) {
    return stringA;
  }

  const stringB = stringA.split("");
  const positions = shuffleArray(
    Array.from({ length: stringA.length }, (_, index) => index),
  ).slice(0, differenceCount);

  for (const position of positions) {
    const oldChar = stringB[position];
    let newChar = oldChar;
    while (newChar === oldChar) {
      newChar = pool[Math.floor(Math.random() * pool.length)];
    }
    stringB[position] = newChar;
  }

  return stringB.join("");
}

function generateQuestion(
  difficulty: Difficulty = "medium",
  fixedStringLength?: number,
): StringSprintQuestion {
  let activeDifficulty = difficulty;
  if (difficulty === "mixed") {
    const difficulties: Difficulty[] = ["easy", "medium", "hard"];
    activeDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
  }

  let stringLength: number;
  let pool = CHARACTER_POOL_ALPHANUMERIC;

  switch (activeDifficulty) {
    case "easy":
      stringLength = fixedStringLength ?? randomInRange(6, 9);
      break;
    case "hard":
      stringLength = fixedStringLength ?? randomInRange(16, 22);
      pool = CHARACTER_POOL_HARD;
      break;
    case "medium":
    default:
      stringLength = fixedStringLength ?? randomInRange(10, 15);
      break;
  }

  const isSame = Math.random() < 0.5;
  const differenceCount = isSame ? 0 : randomInRange(1, activeDifficulty === "easy" ? 2 : 4);
  const stringA = randomString(stringLength, pool);
  const stringB = createStringWithDifferences(stringA, differenceCount, pool);

  return {
    id: generateId(),
    prompt: "Decide fast: are these strings the same?",
    stringA,
    stringB,
    differenceCount,
    stringLength,
    isSame,
  };
}

export function generateQuiz(
  questionCount: number,
  difficulty: Difficulty = "medium",
  fixedStringLength?: number,
): StringSprintQuestion[] {
  return Array.from({ length: questionCount }, () =>
    generateQuestion(difficulty, fixedStringLength),
  );
}
