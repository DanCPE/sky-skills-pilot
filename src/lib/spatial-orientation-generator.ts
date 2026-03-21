import { Direction, Instruction, SpatialOrientationQuestion } from "@/types";

export type Difficulty = "easy" | "medium" | "hard" | "mixed";

export function generateSpatialOrientationRound(difficulty: Difficulty = "medium"): SpatialOrientationQuestion {
  let activeDifficulty = difficulty;
  if (difficulty === "mixed") {
    const diffs: Difficulty[] = ["easy", "medium", "hard"];
    activeDifficulty = diffs[Math.floor(Math.random() * diffs.length)];
  }

  let angleIncrement = 45;
  let maxAngle = 180;
  let seqLengths = [3, 4, 5];

  switch (activeDifficulty) {
    case "easy":
      angleIncrement = 45;
      maxAngle = 360; // Based on user request "easy: 360"
      seqLengths = [3, 4];
      break;
    case "hard":
      angleIncrement = 22.5;
      maxAngle = 720; // Based on user request "hard: 720"
      seqLengths = [6, 7, 8, 9, 10];
      break;
    case "medium":
    default:
      angleIncrement = 22.5;
      maxAngle = 360; // Based on user request "medium: 360"
      seqLengths = [4, 5, 6];
      break;
  }

  // Generate possible angles based on increment and max
  const possibleAngles: number[] = [];
  for (let a = angleIncrement; a <= maxAngle; a += angleIncrement) {
    possibleAngles.push(a);
  }
  
  const possibleDirs: Direction[] = ["L", "R"];
  
  // Start Heading (Always 45/90/etc for standard orientation start, or keep 45 increments)
  const initialHeading = Math.floor(Math.random() * 8) * 45;

  // Generate Sequence
  const length = seqLengths[Math.floor(Math.random() * seqLengths.length)];
  const sequence: Instruction[] = [];

  let currentHeading = initialHeading;
  for (let i = 0; i < length; i++) {
    const angle = possibleAngles[Math.floor(Math.random() * possibleAngles.length)];
    const dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
    sequence.push({ angle, dir });
    
    const factor = dir === "R" ? 1 : -1;
    // Spatial orientation heading is usually 0-359.9...
    currentHeading = (currentHeading + angle * factor) % 360;
    if (currentHeading < 0) currentHeading += 360;
  }

  // Generate target heading (ensure it's on a valid coordinate, maybe multiples of 22.5 now)
  const targetPool: number[] = [];
  for (let a = 0; a < 360; a += angleIncrement) {
    targetPool.push(a);
  }
  
  let targetHeading = targetPool[Math.floor(Math.random() * targetPool.length)];
  while (Math.abs(targetHeading - currentHeading) < 0.1) {
    targetHeading = targetPool[Math.floor(Math.random() * targetPool.length)];
  }

  // Calculate Difference and exact shortest path
  const diff = (targetHeading - currentHeading + 360) % 360;
  
  let correctAngle = diff > 180 ? 360 - diff : diff;
  let correctDir: Direction = diff <= 180 ? "R" : "L";
  
  // Wrap-around edge case: 180 can be L or R, standardizing on R
  if (Math.abs(correctAngle - 180) < 0.1) {
     correctAngle = 180;
     correctDir = "R";
  }

  // Generate Distractor Options
  const optionsSet = new Set<string>();
  const correctStr = `${correctAngle}${correctDir}`;
  optionsSet.add(correctStr);

  while (optionsSet.size < 4) {
    const randAngle = possibleAngles[Math.floor(Math.random() * possibleAngles.length)];
    const randDir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
    const distStr = `${randAngle}${randDir}`;
    
    if (distStr !== correctStr && !(Math.abs(randAngle - 180) < 0.1 && Math.abs(correctAngle - 180) < 0.1)) {
        optionsSet.add(distStr);
    }
  }

  const formattedOptions: { angle: number; dir: Direction | null }[] = Array.from(optionsSet).map(opt => ({
      angle: parseFloat(opt.replace(/[LR]/, "")),
      dir: opt.slice(-1) as Direction
  }));

  formattedOptions.push({ angle: 0, dir: null });

  for (let i = formattedOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [formattedOptions[i], formattedOptions[j]] = [formattedOptions[j], formattedOptions[i]];
  }

  return {
    id: crypto.randomUUID(),
    initialHeading,
    sequence,
    targetHeading,
    correctAngle,
    correctDir,
    options: formattedOptions,
  };
}

export function generateSpatialOrientationQuiz(count: number, mode: "learn" | "real", difficulty: Difficulty = "medium") {
  const questions = Array.from({ length: count }, () => generateSpatialOrientationRound(difficulty));

  return {
    questions,
    mode,
    // Calculate time limit based on difficulty complexity
    // Easy: 10s, Medium: 15s, Hard: 20s
    timeLimit: mode === "real" ? count * (difficulty === "easy" ? 10 : difficulty === "hard" ? 20 : 15) : undefined,
  };
}
