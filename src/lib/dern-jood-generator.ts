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

function generateDescentRateProblem(difficulty: Difficulty) {
  const minutesByDifficulty = {
    easy: [4, 5, 10],
    medium: [3, 4, 5, 6, 8],
    hard: [3, 4, 5, 6, 7, 8],
  } satisfies Record<Difficulty, number[]>;

  const minutes =
    minutesByDifficulty[difficulty][
      randomInRange(0, minutesByDifficulty[difficulty].length - 1)
    ];
  const descentRate =
    difficulty === "easy"
      ? [300, 400, 500, 600][randomInRange(0, 3)]
      : difficulty === "medium"
        ? [400, 500, 600, 700, 800, 900][randomInRange(0, 5)]
        : [700, 800, 900, 1000, 1100, 1200, 1300][randomInRange(0, 6)];
  const flightLevelDrop = (descentRate * minutes) / 100;
  const targetFlightLevel =
    difficulty === "easy"
      ? randomInRange(10, 60)
      : difficulty === "medium"
        ? randomInRange(20, 120)
        : randomInRange(40, 180);
  const startFlightLevel = targetFlightLevel + flightLevelDrop;

  return {
    expression: `If an aircraft at FL${startFlightLevel} wants to descend to FL${targetFlightLevel} in ${minutes} min, what descent rate is required in ft/min?`,
    correctAnswer: descentRate,
    explanation: `FL${startFlightLevel} to FL${targetFlightLevel} is ${flightLevelDrop * 100} ft. ${flightLevelDrop * 100} ÷ ${minutes} = ${descentRate} ft/min.`,
  };
}

function generateNumberReadbackProblem(difficulty: Difficulty) {
  const digitCount =
    difficulty === "easy"
      ? randomInRange(5, 6)
      : difficulty === "medium"
        ? randomInRange(6, 7)
        : randomInRange(7, 8);
  const digits = Array.from({ length: digitCount }, () =>
    String(randomInRange(1, 9)),
  );
  const reversedDigits = [...digits].reverse();
  const correctAnswer = Number(reversedDigits.join(""));

  return {
    expression: `Say these numbers backward: ${digits.join(" ")}`,
    correctAnswer,
    explanation: `${digits.join(" ")} backward is ${reversedDigits.join(" ")}.`,
  };
}

function generateExpression(difficulty: Difficulty) {
  if (difficulty === "easy") {
    const templates = [
      () => generateDescentRateProblem("easy"),
      () => generateNumberReadbackProblem("easy"),
      () => {
        const left = randomInRange(10, 99);
        const right = randomInRange(10, 90);
        return {
          expression: `${left} + ${right}`,
          correctAnswer: left + right,
          explanation: `${left} + ${right} = ${left + right}`,
        };
      },
      () => {
        const left = randomInRange(30, 150);
        const right = randomInRange(10, left);
        return {
          expression: `${left} - ${right}`,
          correctAnswer: left - right,
          explanation: `${left} - ${right} = ${left - right}`,
        };
      },
      () => {
        const left = randomInRange(2, 12);
        const right = randomInRange(2, 12);
        return {
          expression: `${left} × ${right}`,
          correctAnswer: left * right,
          explanation: `${left} × ${right} = ${left * right}`,
        };
      },
      () => {
        const left = randomInRange(2, 20);
        const right = randomInRange(10, 30);
        return {
          expression: `${left} × ${right}`,
          correctAnswer: left * right,
          explanation: `${left} × ${right} = ${left * right}`,
        };
      },
    ];

    return templates[randomInRange(0, templates.length - 1)]();
  }

  if (difficulty === "medium") {
    const templates = [
      () => generateDescentRateProblem("medium"),
      () => generateNumberReadbackProblem("medium"),
      () => {
        const left = randomInRange(100, 999);
        const right = randomInRange(100, 999);
        return {
          expression: `${left} + ${right}`,
          correctAnswer: left + right,
          explanation: `${left} + ${right} = ${left + right}`,
        };
      },
      () => {
        const left = randomInRange(200, 999);
        const right = randomInRange(100, left);
        return {
          expression: `${left} - ${right}`,
          correctAnswer: left - right,
          explanation: `${left} - ${right} = ${left - right}`,
        };
      },
      () => {
        const left = randomInRange(11, 99);
        const right = randomInRange(6, 19);
        return {
          expression: `${left} × ${right}`,
          correctAnswer: left * right,
          explanation: `${left} × ${right} = ${left * right}`,
        };
      },
      () => {
        const quotient = randomInRange(8, 40);
        const divisor = randomInRange(3, 12);
        return {
          expression: `${quotient * divisor} ÷ ${divisor}`,
          correctAnswer: quotient,
          explanation: `${quotient * divisor} ÷ ${divisor} = ${quotient}`,
        };
      },
    ];

    return templates[randomInRange(0, templates.length - 1)]();
  }

  const templates = [
    () => generateDescentRateProblem("hard"),
    () => generateNumberReadbackProblem("hard"),
    () => {
      const left = randomInRange(21, 89);
      const right = randomInRange(21, 89);
      return {
        expression: `${left} × ${right}`,
        correctAnswer: left * right,
        explanation: `${left} × ${right} = ${left * right}`,
      };
    },
    () => {
      const left = randomInRange(100, 999);
      const right = randomInRange(12, 29);
      return {
        expression: `${left} × ${right}`,
        correctAnswer: left * right,
        explanation: `${left} × ${right} = ${left * right}`,
      };
    },
    () => {
      const first = randomInRange(100, 999);
      const second = randomInRange(100, 999);
      const third = randomInRange(50, 499);
      return {
        expression: `${first} + ${second} - ${third}`,
        correctAnswer: first + second - third,
        explanation: `${first} + ${second} - ${third} = ${
          first + second - third
        }`,
      };
    },
    () => {
      const quotient = randomInRange(12, 99);
      const divisor = randomInRange(11, 25);
      return {
        expression: `${quotient * divisor} ÷ ${divisor}`,
        correctAnswer: quotient,
        explanation: `${quotient * divisor} ÷ ${divisor} = ${quotient}`,
      };
    },
  ];

  return templates[randomInRange(0, templates.length - 1)]();
}

function estimateQuestionSeconds(expression: string, difficulty: Difficulty): number {
  const multiplicationPenalty = expression.includes("×") ? 3 : 0;
  const divisionPenalty = expression.includes("÷") ? 2 : 0;
  const wordProblemPenalty = expression.includes("FL") ? 6 : 0;
  const readbackPenalty = expression.startsWith("Say these numbers backward")
    ? 5
    : 0;
  const chainedPenalty = expression.split(" ").length > 3 ? 2 : 0;
  const digitLoad = (expression.match(/\d/g) ?? []).length;
  const baseByDifficulty = {
    easy: 7,
    medium: 11,
    hard: 16,
  } satisfies Record<Difficulty, number>;

  const estimatedSeconds = Math.min(
    30,
    Math.max(
      6,
      baseByDifficulty[difficulty] +
        multiplicationPenalty +
        divisionPenalty +
        wordProblemPenalty +
        readbackPenalty +
        chainedPenalty +
        Math.floor(digitLoad / 3),
    ),
  );

  return estimatedSeconds * 2;
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
    const { expression, correctAnswer, explanation } =
      generateExpression(resolvedDifficulty);

    return {
      id: generateId(),
      prompt: expression.includes("FL")
        ? "Calculate the descent rate"
        : expression.startsWith("Say these numbers backward")
          ? "Read back the numbers"
          : "Answer with mental math",
      expression,
      correctAnswer,
      difficulty: resolvedDifficulty,
      bpm: resolvedBpm,
      timeLimitSeconds: estimateQuestionSeconds(expression, resolvedDifficulty),
      explanation,
    };
  });
}
