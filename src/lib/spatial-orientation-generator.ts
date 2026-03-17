import { Direction, Instruction, SpatialOrientationQuestion } from "@/types";

export function generateSpatialOrientationRound(): SpatialOrientationQuestion {
  const possibleAngles = [45, 90, 135, 180];
  const possibleDirs: Direction[] = ["L", "R"];
  
  // Start Heading
  const initialHeading = Math.floor(Math.random() * 8) * 45;

  // Generate Sequence
  const seqLengths = [3, 4, 5];
  const length = seqLengths[Math.floor(Math.random() * seqLengths.length)];
  const sequence: Instruction[] = [];

  let currentHeading = initialHeading;
  for (let i = 0; i < length; i++) {
    const angle = possibleAngles[Math.floor(Math.random() * possibleAngles.length)];
    const dir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
    sequence.push({ angle, dir });
    
    const factor = dir === "R" ? 1 : -1;
    currentHeading = (currentHeading + angle * factor + 360) % 360;
  }

  // Generate target heading
  let targetHeading = Math.floor(Math.random() * 8) * 45;
  while (targetHeading === currentHeading) {
    targetHeading = Math.floor(Math.random() * 8) * 45;
  }

  // Calculate Difference and exact shortest path
  const diff = (targetHeading - currentHeading + 360) % 360;
  
  let correctAngle = diff > 180 ? 360 - diff : diff;
  let correctDir: Direction = diff <= 180 ? "R" : "L";
  
  // Wrap-around edge case: 180 can be L or R, standardizing on R for consistency
  if (correctAngle === 180) {
     correctDir = "R";
  }

  // Generate Distractor Options
  // We need 5 total options: 1 Correct, 1 NO ANSWER, 3 Distractors
  const optionsSet = new Set<string>();
  const correctStr = `${correctAngle}${correctDir}`;
  optionsSet.add(correctStr);

  while (optionsSet.size < 4) { // Get 3 distractors
    const randAngle = possibleAngles[Math.floor(Math.random() * possibleAngles.length)];
    const randDir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
    const distStr = `${randAngle}${randDir}`;
    
    // Ensure distractor doesn't equal correct answer equivalent (e.g. 180L is effectively 180R)
    if (distStr !== correctStr && !(randAngle === 180 && correctAngle === 180)) {
        optionsSet.add(distStr);
    }
  }

  // Build the final options array
  const formattedOptions: { angle: number; dir: Direction | null }[] = Array.from(optionsSet).map(opt => ({
      angle: parseInt(opt.slice(0, -1)),
      dir: opt.slice(-1) as Direction
  }));

  // Add the NO ANSWER option
  formattedOptions.push({ angle: 0, dir: null });

  // Shuffle options
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

export function generateSpatialOrientationQuiz(count: number, mode: "learn" | "real") {
  const questions = Array.from({ length: count }, () => generateSpatialOrientationRound());

  return {
    questions,
    mode,
    timeLimit: mode === "real" ? count * 15 : undefined, // Give 15s per question
  };
}
