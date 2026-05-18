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

export function generateApproximationQuiz(
  count: number,
  difficulty: "easy" | "medium" | "hard" | "mixed",
): ApproximationQuestion[] {
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
}
