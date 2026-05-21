import { generateDernJoodQuiz } from "@/lib/dern-jood-generator";
import type { JoyStickGameQuestion } from "@/types";

type Difficulty = "easy" | "medium" | "hard" | "mixed";

export function generateJoyStickGameQuiz(
  count: number,
  difficulty: Difficulty,
  mode: "learn" | "real",
  bpm?: number,
): JoyStickGameQuestion[] {
  return generateDernJoodQuiz(count, difficulty, mode, bpm);
}
