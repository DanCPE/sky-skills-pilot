import type {
  CubeCell,
  MissingCubePiece,
  MissingCubeQuestion,
  MissingCubeQuizResponse,
} from "@/types";

export type MissingCubeDifficulty = "easy" | "medium" | "hard" | "mixed";

const NEIGHBORS: CubeCell[] = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
];

const ROTATIONS: ((cell: CubeCell) => CubeCell)[] = [
  ({ x, y, z }) => ({ x, y, z }),
  ({ x, y, z }) => ({ x, z, y: -y }),
  ({ x, y, z }) => ({ x, y: -y, z: -z }),
  ({ x, y, z }) => ({ x, y: -z, z: y }),
  ({ x, y, z }) => ({ x: -x, y, z: -z }),
  ({ x, y, z }) => ({ x: -x, y: z, z: y }),
  ({ x, y, z }) => ({ x: -x, y: -y, z }),
  ({ x, y, z }) => ({ x: -x, y: -z, z: -y }),
  ({ x, y, z }) => ({ x: y, y: x, z: -z }),
  ({ x, y, z }) => ({ x: y, y: z, z: x }),
  ({ x, y, z }) => ({ x: y, y: -x, z }),
  ({ x, y, z }) => ({ x: y, y: -z, z: -x }),
  ({ x, y, z }) => ({ x: -y, y: x, z }),
  ({ x, y, z }) => ({ x: -y, y: z, z: -x }),
  ({ x, y, z }) => ({ x: -y, y: -x, z: -z }),
  ({ x, y, z }) => ({ x: -y, y: -z, z: x }),
  ({ x, y, z }) => ({ x: z, y: x, z: y }),
  ({ x, y, z }) => ({ x: z, y, z: -x }),
  ({ x, y, z }) => ({ x: z, y: -x, z: -y }),
  ({ x, y, z }) => ({ x: z, y: -y, z: x }),
  ({ x, y, z }) => ({ x: -z, y: x, z: -y }),
  ({ x, y, z }) => ({ x: -z, y, z: x }),
  ({ x, y, z }) => ({ x: -z, y: -x, z: y }),
  ({ x, y, z }) => ({ x: -z, y: -y, z: -x }),
];

function key(cell: CubeCell) {
  return `${cell.x},${cell.y},${cell.z}`;
}

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalize(cells: CubeCell[]) {
  const minX = Math.min(...cells.map((cell) => cell.x));
  const minY = Math.min(...cells.map((cell) => cell.y));
  const minZ = Math.min(...cells.map((cell) => cell.z));

  return cells
    .map((cell) => ({
      x: cell.x - minX,
      y: cell.y - minY,
      z: cell.z - minZ,
    }))
    .sort((a, b) => a.x - b.x || a.y - b.y || a.z - b.z);
}

function canonicalShape(cells: CubeCell[]) {
  return ROTATIONS.map((rotate) => {
    const rotated = normalize(cells.map(rotate));
    return rotated.map(key).join("|");
  }).sort()[0];
}

function isConnected(cells: CubeCell[]) {
  if (cells.length === 0) return false;
  const available = new Set(cells.map(key));
  const seen = new Set<string>();
  const stack = [cells[0]];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const currentKey = key(current);
    if (seen.has(currentKey)) continue;
    seen.add(currentKey);

    for (const delta of NEIGHBORS) {
      const next = {
        x: current.x + delta.x,
        y: current.y + delta.y,
        z: current.z + delta.z,
      };
      if (available.has(key(next))) stack.push(next);
    }
  }

  return seen.size === cells.length;
}

function fullCubeCells(size: number) {
  const cells: CubeCell[] = [];
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        cells.push({ x, y, z });
      }
    }
  }
  return cells;
}

function isSurfaceCell(cell: CubeCell, size: number) {
  return (
    cell.x === 0 ||
    cell.y === 0 ||
    cell.z === 0 ||
    cell.x === size - 1 ||
    cell.y === size - 1 ||
    cell.z === size - 1
  );
}

function getDifficultySettings(difficulty: Exclude<MissingCubeDifficulty, "mixed">) {
  if (difficulty === "easy") {
    return { size: 3 as const, missingBlocks: [4, 5, 6], partCount: 1 };
  }
  if (difficulty === "medium") {
    return { size: 4 as const, missingBlocks: [7, 8, 9, 10], partCount: 2 };
  }
  return { size: 5 as const, missingBlocks: [11, 12, 13, 14, 15], partCount: 3 };
}

function generateMissingPiece(size: number, blockCount: number) {
  const surfaceCells = fullCubeCells(size).filter((cell) => isSurfaceCell(cell, size));

  for (let attempt = 0; attempt < 400; attempt++) {
    const cells = [randomItem(surfaceCells)];
    const used = new Set(cells.map(key));

    while (cells.length < blockCount) {
      const frontier = cells.flatMap((cell) =>
        shuffle(NEIGHBORS)
          .map((delta) => ({
            x: cell.x + delta.x,
            y: cell.y + delta.y,
            z: cell.z + delta.z,
          }))
          .filter(
            (next) =>
              next.x >= 0 &&
              next.y >= 0 &&
              next.z >= 0 &&
              next.x < size &&
              next.y < size &&
              next.z < size &&
              isSurfaceCell(next, size) &&
              !used.has(key(next)),
          ),
      );

      if (frontier.length === 0) break;
      const next = randomItem(frontier);
      cells.push(next);
      used.add(key(next));
    }

    if (cells.length === blockCount && isConnected(cells)) return cells;
  }

  return surfaceCells.slice(0, blockCount);
}

function randomFragmentRotation() {
  return {
    yaw: randomItem([45, 135, 225, 315]),
    pitch: randomItem([-45, 45]),
    roll: randomItem([0, 90, 180, 270]),
  };
}

function splitVisibleParts(
  cells: CubeCell[],
  partCount: number,
  randomizeFragments: boolean,
): MissingCubePiece[] {
  if (partCount === 1) {
    return [{ id: "question-part-1", label: "Question shape", cells }];
  }

  const sorted = [...cells].sort((a, b) => a.x - b.x || a.y - b.y || a.z - b.z);
  const parts: MissingCubePiece[] = Array.from({ length: partCount }, (_, index) => ({
    id: `question-part-${index + 1}`,
    label: `Question part ${index + 1}`,
    cells: [],
  }));

  sorted.forEach((cell, index) => {
    parts[Math.floor((index / sorted.length) * partCount)].cells.push(cell);
  });

  return parts.map((part, index) => ({
    ...part,
    displayOffset: {
      x: (index - (partCount - 1) / 2) * (Math.max(...cells.map((c) => c.x)) + 3),
      y: 0,
      z: 0,
    },
    displayRotation: randomizeFragments ? randomFragmentRotation() : undefined,
  }));
}

function generateDistractor(correct: CubeCell[], blockCount: number) {
  const correctCanonical = canonicalShape(correct);

  for (let attempt = 0; attempt < 250; attempt++) {
    const cells: CubeCell[] = [{ x: 0, y: 0, z: 0 }];
    const used = new Set([key(cells[0])]);

    while (cells.length < blockCount) {
      const source = randomItem(cells);
      const delta = randomItem(NEIGHBORS);
      const next = {
        x: source.x + delta.x,
        y: source.y + delta.y,
        z: source.z + delta.z,
      };
      if (!used.has(key(next))) {
        cells.push(next);
        used.add(key(next));
      }
    }

    const normalized = normalize(cells);
    if (canonicalShape(normalized) !== correctCanonical && isConnected(normalized)) {
      return normalized;
    }
  }

  return normalize([
    ...correct.slice(1),
    {
      x: Math.max(...correct.map((cell) => cell.x)) + 1,
      y: 0,
      z: 0,
    },
  ]);
}

function createQuestion(difficulty: MissingCubeDifficulty): MissingCubeQuestion {
  const activeDifficulty =
    difficulty === "mixed" ? randomItem(["easy", "medium", "hard"] as const) : difficulty;
  const settings = getDifficultySettings(activeDifficulty);
  const blockCount = randomItem(settings.missingBlocks);
  const missingCells = generateMissingPiece(settings.size, blockCount);
  const missingKeys = new Set(missingCells.map(key));
  const visibleCells = fullCubeCells(settings.size).filter((cell) => !missingKeys.has(key(cell)));
  const correctId = crypto.randomUUID();
  const correctPiece: MissingCubePiece = {
    id: correctId,
    label: "A",
    cells: missingCells,
  };
  const seenShapes = new Set([canonicalShape(missingCells)]);
  const distractors: MissingCubePiece[] = [];

  while (distractors.length < 4) {
    const cells = generateDistractor(missingCells, blockCount);
    const shape = canonicalShape(cells);
    if (seenShapes.has(shape)) continue;
    seenShapes.add(shape);
    distractors.push({
      id: crypto.randomUUID(),
      label: String.fromCharCode(65 + distractors.length + 1),
      cells,
    });
  }

  const options = shuffle([correctPiece, ...distractors]).map((option, index) => ({
    ...option,
    label: String.fromCharCode(65 + index),
  }));

  return {
    id: crypto.randomUUID(),
    prompt: `Find the ${blockCount}-block piece that completes the ${settings.size}x${settings.size}x${settings.size} cube.`,
    size: settings.size,
    difficulty: activeDifficulty,
    visibleParts: splitVisibleParts(
      visibleCells,
      settings.partCount,
      activeDifficulty === "hard",
    ),
    missingPiece: correctPiece,
    options,
    correctOptionId: correctId,
    initialRotation: {
      yaw: 45,
      pitch: 45,
    },
    explanation:
      settings.partCount === 1
        ? "The correct piece fills every open cube position without adding blocks outside the cube."
        : `The question shape is separated into ${settings.partCount} visible parts. Mentally bring those parts together, then choose the only missing piece that completes the cube.`,
  };
}

export function generateMissingCubeQuiz(
  count: number,
  mode: "learn" | "real",
  difficulty: MissingCubeDifficulty = "mixed",
): MissingCubeQuizResponse {
  const questions = Array.from({ length: count }, () => createQuestion(difficulty));
  const secondsPerQuestion = 72;

  return {
    questions,
    mode,
    timeLimit: mode === "real" ? count * secondsPerQuestion : undefined,
  };
}
