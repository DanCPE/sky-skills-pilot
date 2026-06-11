import { execFileSync } from "node:child_process";
import path from "node:path";
import type { ApproximationQuestion } from "@/types";

interface ApproximationEngineResponse {
  questions: ApproximationQuestion[];
}

const engineScriptPath = path.join(
  process.cwd(),
  "src",
  "lib",
  "approximation-engine",
  "generate_quiz_json.py",
);

type ApproximationDifficulty = "easy" | "medium" | "hard" | "mixed";

const fallbackTemplates = [
  {
    category: "arithmetic",
    build(difficulty: Exclude<ApproximationDifficulty, "mixed">) {
      const ranges = {
        easy: [20, 120],
        medium: [100, 600],
        hard: [500, 2_500],
      } as const;
      const [min, max] = ranges[difficulty];
      const first = randomInt(min, max);
      const second = randomInt(min, max);
      const exactValue = first + second;

      return {
        prompt: `Estimate ${first} + ${second}.`,
        exactValue,
        unit: undefined,
        explanation: `${first} + ${second} = ${exactValue}`,
      };
    },
  },
  {
    category: "percentage",
    build(difficulty: Exclude<ApproximationDifficulty, "mixed">) {
      const bases = difficulty === "easy" ? [100, 200, 400] : [250, 500, 800, 1200];
      const percentages =
        difficulty === "hard" ? [12, 18, 22, 35, 45] : [10, 15, 20, 25, 30];
      const base = pick(bases);
      const percentage = pick(percentages);
      const exactValue = (base * percentage) / 100;

      return {
        prompt: `Estimate ${percentage}% of ${base}.`,
        exactValue,
        unit: undefined,
        explanation: `${percentage}% of ${base} = ${exactValue}`,
      };
    },
  },
  {
    category: "unit_conversion",
    build(difficulty: Exclude<ApproximationDifficulty, "mixed">) {
      const miles = difficulty === "easy" ? randomInt(10, 80) : randomInt(80, 450);
      const exactValue = Number((miles * 1.609).toFixed(1));

      return {
        prompt: `Convert ${miles} miles to kilometers. Use 1 mile = 1.609 km.`,
        exactValue,
        unit: "km",
        explanation: `${miles} x 1.609 is about ${exactValue} km`,
      };
    },
  },
  {
    category: "geometry",
    build(difficulty: Exclude<ApproximationDifficulty, "mixed">) {
      const radius = difficulty === "hard" ? randomInt(9, 24) : randomInt(3, 12);
      const exactValue = Number((Math.PI * radius * radius).toFixed(1));

      return {
        prompt: `Estimate the area of a circle with radius ${radius} cm. Use A = pi*r^2.`,
        exactValue,
        unit: "cm^2",
        explanation: `pi x ${radius}^2 is about ${exactValue} cm^2`,
      };
    },
  },
  {
    category: "aviation",
    build(difficulty: Exclude<ApproximationDifficulty, "mixed">) {
      const speed = difficulty === "easy" ? pick([120, 150, 180]) : pick([240, 300, 450]);
      const hours = difficulty === "hard" ? pick([1.6, 2.4, 3.2]) : pick([1.5, 2, 2.5]);
      const exactValue = Number((speed * hours).toFixed(1));

      return {
        prompt: `An aircraft flies at ${speed} knots for ${hours} hours. Estimate the distance in nautical miles.`,
        exactValue,
        unit: "NM",
        explanation: `${speed} x ${hours} = ${exactValue} NM`,
      };
    },
  },
];

export function generateApproximationQuiz(
  count: number,
  difficulty: ApproximationDifficulty,
): ApproximationQuestion[] {
  try {
    const output = execFileSync(
      process.env.PYTHON_BIN || "python3",
      [
        engineScriptPath,
        "--count",
        String(count),
        "--difficulty",
        difficulty,
      ],
      {
        cwd: path.dirname(engineScriptPath),
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
      },
    );

    const parsed = JSON.parse(output) as ApproximationEngineResponse;
    return parsed.questions;
  } catch (error) {
    console.warn(
      "[approximation-generator] Python engine unavailable; using TypeScript fallback.",
      error instanceof Error ? error.message : String(error),
    );

    return generateFallbackApproximationQuiz(count, difficulty);
  }
}

function generateFallbackApproximationQuiz(
  count: number,
  difficulty: ApproximationDifficulty,
): ApproximationQuestion[] {
  return Array.from({ length: count }, (_, index) => {
    const resolvedDifficulty = resolveDifficulty(difficulty, index);
    const template = fallbackTemplates[index % fallbackTemplates.length];
    const built = template.build(resolvedDifficulty);
    const correctAnswer = formatAnswer(built.exactValue, built.unit);
    const options = buildOptions(built.exactValue, built.unit);
    const correctIndex = options.indexOf(correctAnswer);

    return {
      id: `approx_fallback_${index + 1}_${Date.now().toString(36)}`,
      prompt: built.prompt,
      options,
      correctAnswer,
      correctChoice: String.fromCharCode(65 + correctIndex),
      exactValue: built.exactValue,
      unit: built.unit,
      category: template.category,
      questionType: "estimation",
      difficulty: resolvedDifficulty,
      explanation: built.explanation,
    };
  });
}

function resolveDifficulty(
  difficulty: ApproximationDifficulty,
  index: number,
): Exclude<ApproximationDifficulty, "mixed"> {
  if (difficulty !== "mixed") return difficulty;
  return (["easy", "medium", "hard"] as const)[index % 3];
}

function buildOptions(exactValue: number, unit: string | undefined) {
  const correctAnswer = formatAnswer(exactValue, unit);
  const offsets = [-0.25, -0.12, 0.14, 0.28, 0.4];
  const values = offsets.map((offset) => exactValue * (1 + offset));
  const options = new Set<string>([correctAnswer]);

  for (const value of values) {
    if (options.size >= 5) break;
    options.add(formatAnswer(value, unit));
  }

  while (options.size < 5) {
    options.add(formatAnswer(exactValue + randomInt(2, 18), unit));
  }

  return shuffle([...options]).slice(0, 5);
}

function formatAnswer(value: number, unit: string | undefined) {
  const rounded = Math.abs(value) >= 100 ? Math.round(value) : Number(value.toFixed(1));
  return unit ? `${rounded} ${unit}` : String(rounded);
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: T[]) {
  return items[randomInt(0, items.length - 1)];
}

function shuffle<T>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}
