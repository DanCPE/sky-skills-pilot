import type { DernJoodQuestion } from "@/types";

type Difficulty = "easy" | "medium" | "hard";
type DifficultyInput = Difficulty | "mixed";

function generateId(): string {
  return `dern_jood_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function resolveDifficulty(difficulty: DifficultyInput): Difficulty {
  if (difficulty !== "mixed") return difficulty;
  return (["easy", "medium", "hard"] as const)[randomInRange(0, 2)];
}

function roundToNearestFive(value: number): number {
  return Math.round(value / 5) * 5;
}

function generateExpression(difficulty: Difficulty) {
  if (difficulty === "easy") {
    const templates = [
      () => {
        const left = randomInRange(10, 99);
        const right = randomInRange(10, 90);
        return {
          expression: `${left} + ${right}`,
          correctAnswer: left + right,
        };
      },
      () => {
        const left = randomInRange(30, 150);
        const right = randomInRange(10, left);
        return {
          expression: `${left} - ${right}`,
          correctAnswer: left - right,
        };
      },
      () => {
        const left = randomInRange(2, 12);
        const right = randomInRange(2, 12);
        return {
          expression: `${left} × ${right}`,
          correctAnswer: left * right,
        };
      },
      () => {
        const left = randomInRange(2, 20);
        const right = randomInRange(10, 30);
        return {
          expression: `${left} × ${right}`,
          correctAnswer: left * right,
        };
      },
    ];

    return templates[randomInRange(0, templates.length - 1)]();
  }

  if (difficulty === "medium") {
    const templates = [
      () => {
        const left = randomInRange(100, 999);
        const right = randomInRange(100, 999);
        return {
          expression: `${left} + ${right}`,
          correctAnswer: left + right,
        };
      },
      () => {
        const left = randomInRange(200, 999);
        const right = randomInRange(100, left);
        return {
          expression: `${left} - ${right}`,
          correctAnswer: left - right,
        };
      },
      () => {
        const left = randomInRange(11, 99);
        const right = randomInRange(6, 19);
        return {
          expression: `${left} × ${right}`,
          correctAnswer: left * right,
        };
      },
      () => {
        const quotient = randomInRange(8, 40);
        const divisor = randomInRange(3, 12);
        return {
          expression: `${quotient * divisor} ÷ ${divisor}`,
          correctAnswer: quotient,
        };
      },
    ];

    return templates[randomInRange(0, templates.length - 1)]();
  }

  const templates = [
    () => {
      const left = randomInRange(21, 89);
      const right = randomInRange(21, 89);
      return {
        expression: `${left} × ${right}`,
        correctAnswer: left * right,
      };
    },
    () => {
      const left = randomInRange(100, 999);
      const right = randomInRange(12, 29);
      return {
        expression: `${left} × ${right}`,
        correctAnswer: left * right,
      };
    },
    () => {
      const first = randomInRange(100, 999);
      const second = randomInRange(100, 999);
      const third = randomInRange(50, 499);
      return {
        expression: `${first} + ${second} - ${third}`,
        correctAnswer: first + second - third,
      };
    },
    () => {
      const quotient = randomInRange(12, 99);
      const divisor = randomInRange(11, 25);
      return {
        expression: `${quotient * divisor} ÷ ${divisor}`,
        correctAnswer: quotient,
      };
    },
  ];

  return templates[randomInRange(0, templates.length - 1)]();
}

function estimateQuestionSeconds(expression: string, difficulty: Difficulty): number {
  const multiplicationPenalty = expression.includes("×") ? 3 : 0;
  const divisionPenalty = expression.includes("÷") ? 2 : 0;
  const chainedPenalty = expression.split(" ").length > 3 ? 2 : 0;
  const digitLoad = (expression.match(/\d/g) ?? []).length;
  const baseByDifficulty = {
    easy: 7,
    medium: 11,
    hard: 16,
  } satisfies Record<Difficulty, number>;

  return Math.min(
    30,
    Math.max(
      6,
      baseByDifficulty[difficulty] +
        multiplicationPenalty +
        divisionPenalty +
        chainedPenalty +
        Math.floor(digitLoad / 3),
    ),
  );
}

export function generateDernJoodQuiz(
  count: number,
  difficulty: DifficultyInput,
  mode: "learn" | "real",
  bpm?: number,
): DernJoodQuestion[] {
  return Array.from({ length: count }, () => {
    const resolvedDifficulty = mode === "real" ? resolveDifficulty("mixed") : resolveDifficulty(difficulty);
    const resolvedBpm =
      mode === "real"
        ? roundToNearestFive(randomInRange(50, 180))
        : Math.min(180, Math.max(50, bpm ?? 90));
    const { expression, correctAnswer } = generateExpression(resolvedDifficulty);

    return {
      id: generateId(),
      prompt: "Answer with mental math",
      expression,
      correctAnswer,
      difficulty: resolvedDifficulty,
      bpm: resolvedBpm,
      timeLimitSeconds: estimateQuestionSeconds(expression, resolvedDifficulty),
      explanation: `${expression} = ${correctAnswer}`,
    };
  });
}
