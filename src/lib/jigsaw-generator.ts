import type {
  JigsawCell,
  JigsawOption,
  JigsawPiece,
  JigsawQuestion,
  JigsawQuizResponse,
} from "@/types";

export type JigsawDifficulty = "easy" | "medium" | "hard" | "mixed";

const NEIGHBORS: JigsawCell[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

const PIECE_COLORS = ["#4F12A6", "#FACC15", "#14B8A6", "#F97316", "#2563EB"];

function key(cell: JigsawCell) {
  return `${cell.x},${cell.y}`;
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

function normalize(cells: JigsawCell[]) {
  const minX = Math.min(...cells.map((cell) => cell.x));
  const minY = Math.min(...cells.map((cell) => cell.y));

  return cells
    .map((cell) => ({ x: cell.x - minX, y: cell.y - minY }))
    .sort((a, b) => a.y - b.y || a.x - b.x);
}

function serialize(cells: JigsawCell[]) {
  return normalize(cells).map(key).join("|");
}

function isConnected(cells: JigsawCell[]) {
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
      const next = { x: current.x + delta.x, y: current.y + delta.y };
      if (available.has(key(next))) stack.push(next);
    }
  }

  return seen.size === cells.length;
}

function getDifficultySettings(difficulty: Exclude<JigsawDifficulty, "mixed">) {
  if (difficulty === "easy") {
    return { gridSize: 4, cellCount: 9, pieceCount: 3 };
  }
  if (difficulty === "medium") {
    return { gridSize: 5, cellCount: 12, pieceCount: 4 };
  }
  return { gridSize: 6, cellCount: 16, pieceCount: 5 };
}

function generateShape(gridSize: number, cellCount: number) {
  for (let attempt = 0; attempt < 300; attempt++) {
    const cells: JigsawCell[] = [
      {
        x: Math.floor(gridSize / 2),
        y: Math.floor(gridSize / 2),
      },
    ];
    const used = new Set(cells.map(key));

    while (cells.length < cellCount) {
      const frontier = shuffle(
        cells.flatMap((cell) =>
          NEIGHBORS.map((delta) => ({
            x: cell.x + delta.x,
            y: cell.y + delta.y,
          })),
        ),
      ).filter(
        (cell) =>
          cell.x >= 0 &&
          cell.y >= 0 &&
          cell.x < gridSize &&
          cell.y < gridSize &&
          !used.has(key(cell)),
      );

      if (frontier.length === 0) break;
      const next = frontier[0];
      cells.push(next);
      used.add(key(next));
    }

    const normalized = normalize(cells);
    const width = Math.max(...normalized.map((cell) => cell.x)) + 1;
    const height = Math.max(...normalized.map((cell) => cell.y)) + 1;
    if (
      normalized.length === cellCount &&
      width >= 3 &&
      height >= 3 &&
      isConnected(normalized)
    ) {
      return normalized;
    }
  }

  return normalize(
    Array.from({ length: cellCount }, (_, index) => ({
      x: index % gridSize,
      y: Math.floor(index / gridSize),
    })),
  );
}

function splitIntoPieces(shape: JigsawCell[], pieceCount: number) {
  const remaining = new Set(shape.map(key));
  const cellsByKey = new Map(shape.map((cell) => [key(cell), cell]));
  const targetSizes = Array.from({ length: pieceCount }, (_, index) =>
    Math.floor(shape.length / pieceCount) + (index < shape.length % pieceCount ? 1 : 0),
  );

  for (let attempt = 0; attempt < 200; attempt++) {
    const pieces: JigsawCell[][] = [];
    remaining.clear();
    shape.forEach((cell) => remaining.add(key(cell)));

    for (let pieceIndex = 0; pieceIndex < pieceCount; pieceIndex++) {
      const targetSize = targetSizes[pieceIndex];
      const seedKey = randomItem(Array.from(remaining));
      const seed = cellsByKey.get(seedKey);
      if (!seed) break;

      const piece = [seed];
      remaining.delete(seedKey);

      while (piece.length < targetSize) {
        const frontier = shuffle(
          piece.flatMap((cell) =>
            NEIGHBORS.map((delta) => ({
              x: cell.x + delta.x,
              y: cell.y + delta.y,
            })),
          ),
        ).filter((cell) => remaining.has(key(cell)));

        if (frontier.length === 0) break;
        const next = frontier[0];
        piece.push(next);
        remaining.delete(key(next));
      }

      pieces.push(piece);
    }

    if (
      pieces.length === pieceCount &&
      remaining.size === 0 &&
      pieces.every((piece) => piece.length > 1 && isConnected(piece))
    ) {
      return pieces;
    }
  }

  return targetSizes.reduce<JigsawCell[][]>((pieces, size) => {
    const start = pieces.flat().length;
    pieces.push(shape.slice(start, start + size));
    return pieces;
  }, []);
}

function generateDistractor(correct: JigsawCell[], gridSize: number) {
  const correctShape = serialize(correct);

  for (let attempt = 0; attempt < 250; attempt++) {
    const distractor = generateShape(gridSize, correct.length);
    if (serialize(distractor) !== correctShape) return distractor;
  }

  const shifted = correct.slice(1).concat({
    x: Math.max(...correct.map((cell) => cell.x)) + 1,
    y: 0,
  });
  return normalize(shifted);
}

function createQuestion(difficulty: JigsawDifficulty): JigsawQuestion {
  const activeDifficulty =
    difficulty === "mixed" ? randomItem(["easy", "medium", "hard"] as const) : difficulty;
  const settings = getDifficultySettings(activeDifficulty);
  const assembledShape = generateShape(settings.gridSize, settings.cellCount);
  const correctId = crypto.randomUUID();
  const seenShapes = new Set([serialize(assembledShape)]);
  const distractors: JigsawOption[] = [];

  while (distractors.length < 4) {
    const cells = generateDistractor(assembledShape, settings.gridSize);
    const shape = serialize(cells);
    if (seenShapes.has(shape)) continue;
    seenShapes.add(shape);
    distractors.push({
      id: crypto.randomUUID(),
      label: String.fromCharCode(66 + distractors.length),
      cells,
    });
  }

  const options = shuffle<JigsawOption>([
    {
      id: correctId,
      label: "A",
      cells: assembledShape,
    },
    ...distractors,
  ]).map((option, index) => ({
    ...option,
    label: String.fromCharCode(65 + index),
  }));

  const pieces: JigsawPiece[] = splitIntoPieces(
    assembledShape,
    settings.pieceCount,
  ).map((piece, index) => ({
    id: crypto.randomUUID(),
    label: String.fromCharCode(65 + index),
    cells: normalize(piece),
    color: PIECE_COLORS[index % PIECE_COLORS.length],
    displayRotation:
      activeDifficulty === "easy"
        ? 0
        : randomItem(activeDifficulty === "medium" ? [0, 90, 180, 270] : [0, 45, 90, 135, 180, 225, 270, 315]),
  }));

  return {
    id: crypto.randomUUID(),
    prompt: `Mentally assemble the ${settings.pieceCount} loose shape parts, then choose the matching completed silhouette.`,
    difficulty: activeDifficulty,
    gridSize: settings.gridSize,
    pieces,
    options,
    correctOptionId: correctId,
    explanation:
      "The correct silhouette preserves the outline made when every loose part is moved together. The colors help track the pieces, but the final answer is the combined outer shape.",
  };
}

export function generateJigsawQuiz(
  count: number,
  mode: "learn" | "real",
  difficulty: JigsawDifficulty = "mixed",
): JigsawQuizResponse {
  const questions = Array.from({ length: count }, () => createQuestion(difficulty));
  const secondsPerQuestion = 55;

  return {
    questions,
    mode,
    timeLimit: mode === "real" ? count * secondsPerQuestion : undefined,
  };
}
