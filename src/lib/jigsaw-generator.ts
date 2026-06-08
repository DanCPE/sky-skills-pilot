import type {
  JigsawOption,
  JigsawPiece,
  JigsawPoint,
  JigsawQuestion,
  JigsawQuizResponse,
} from "@/types";

export type JigsawDifficulty = "easy" | "medium" | "hard" | "mixed";

type Polygon = JigsawPoint[];
type CutLine = { point: JigsawPoint; normal: JigsawPoint };

interface DifficultySettings {
  pieceCounts: number[];
  families: string[];
  rotations: number[];
}

const PIECE_COLORS = ["#4F12A6", "#FACC15", "#14B8A6", "#F97316", "#2563EB", "#DC2626"];
const EPSILON = 1e-6;

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

function area(poly: Polygon) {
  return Math.abs(
    poly.reduce((sum, point, index) => {
      const next = poly[(index + 1) % poly.length];
      return sum + point.x * next.y - next.x * point.y;
    }, 0) / 2,
  );
}

function bounds(polygons: Polygon[]) {
  const points = polygons.flat();
  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

function normalizePolygon(poly: Polygon): Polygon {
  const box = bounds([poly]);
  return poly.map((point) => ({
    x: point.x - box.minX,
    y: point.y - box.minY,
  }));
}

function roundedKey(polygons: Polygon[]) {
  return polygons
    .map((poly) =>
      normalizePolygon(poly)
        .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
        .sort()
        .join("|"),
    )
    .sort()
    .join("::");
}

function lineValue(point: JigsawPoint, line: CutLine) {
  return (point.x - line.point.x) * line.normal.x + (point.y - line.point.y) * line.normal.y;
}

function intersectSegmentWithLine(a: JigsawPoint, b: JigsawPoint, line: CutLine) {
  const va = lineValue(a, line);
  const vb = lineValue(b, line);
  const t = va / (va - vb);
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

function clipPolygon(poly: Polygon, line: CutLine, keepPositive: boolean) {
  const output: Polygon = [];

  for (let index = 0; index < poly.length; index++) {
    const current = poly[index];
    const previous = poly[(index + poly.length - 1) % poly.length];
    const currentInside = keepPositive
      ? lineValue(current, line) >= -EPSILON
      : lineValue(current, line) <= EPSILON;
    const previousInside = keepPositive
      ? lineValue(previous, line) >= -EPSILON
      : lineValue(previous, line) <= EPSILON;

    if (currentInside !== previousInside) {
      output.push(intersectSegmentWithLine(previous, current, line));
    }
    if (currentInside) output.push(current);
  }

  return cleanPolygon(output);
}

function cleanPolygon(poly: Polygon) {
  const cleaned: Polygon = [];
  for (const point of poly) {
    const previous = cleaned[cleaned.length - 1];
    if (!previous || Math.hypot(previous.x - point.x, previous.y - point.y) > EPSILON) {
      cleaned.push(point);
    }
  }

  if (cleaned.length > 1) {
    const first = cleaned[0];
    const last = cleaned[cleaned.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) <= EPSILON) {
      cleaned.pop();
    }
  }

  return cleaned;
}

function makeCutLine(poly: Polygon): CutLine {
  const box = bounds([poly]);
  const width = box.maxX - box.minX;
  const height = box.maxY - box.minY;
  const angle = (randomItem([0, 30, 45, 60, 90, 120, 135, 150]) * Math.PI) / 180;
  const point = {
    x: box.minX + width * (0.36 + Math.random() * 0.28),
    y: box.minY + height * (0.36 + Math.random() * 0.28),
  };
  return {
    point,
    normal: { x: Math.cos(angle), y: Math.sin(angle) },
  };
}

function splitPolygon(poly: Polygon, minArea: number) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const line = makeCutLine(poly);
    const left = clipPolygon(poly, line, true);
    const right = clipPolygon(poly, line, false);
    if (
      left.length >= 3 &&
      right.length >= 3 &&
      area(left) >= minArea &&
      area(right) >= minArea
    ) {
      return [left, right];
    }
  }
  return null;
}

function cutTargetShape(target: Polygon, pieceCount: number) {
  const minArea = area(target) * 0.08;

  for (let attempt = 0; attempt < 120; attempt++) {
    let pieces: Polygon[] = [target];

    while (pieces.length < pieceCount) {
      const largestIndex = pieces.reduce(
        (best, piece, index) => (area(piece) > area(pieces[best]) ? index : best),
        0,
      );
      const split = splitPolygon(pieces[largestIndex], minArea);
      if (!split) break;
      pieces = [
        ...pieces.slice(0, largestIndex),
        ...split,
        ...pieces.slice(largestIndex + 1),
      ];
    }

    if (pieces.length === pieceCount && pieces.every((piece) => area(piece) >= minArea)) {
      return pieces;
    }
  }

  return splitFallback(target, pieceCount);
}

function splitFallback(target: Polygon, pieceCount: number) {
  let pieces = [target];
  for (let index = 1; index < pieceCount; index++) {
    const largestIndex = pieces.reduce(
      (best, piece, pieceIndex) => (area(piece) > area(pieces[best]) ? pieceIndex : best),
      0,
    );
    const box = bounds([pieces[largestIndex]]);
    const line: CutLine = {
      point: {
        x: box.minX + ((box.maxX - box.minX) * index) / pieceCount,
        y: box.minY + ((box.maxY - box.minY) * index) / pieceCount,
      },
      normal: index % 2 === 0 ? { x: 0, y: 1 } : { x: 1, y: 0 },
    };
    const split = [
      clipPolygon(pieces[largestIndex], line, true),
      clipPolygon(pieces[largestIndex], line, false),
    ].filter((piece) => piece.length >= 3 && area(piece) > EPSILON);
    if (split.length !== 2) break;
    pieces = [
      ...pieces.slice(0, largestIndex),
      ...split,
      ...pieces.slice(largestIndex + 1),
    ];
  }
  return pieces.slice(0, pieceCount);
}

function rectangle(): Polygon {
  return [
    { x: 0, y: 0 },
    { x: 7, y: 0 },
    { x: 7, y: 4.5 },
    { x: 0, y: 4.5 },
  ];
}

function triangle(): Polygon {
  return [
    { x: 0, y: 0 },
    { x: 7, y: 0 },
    { x: 3.4, y: 5.8 },
  ];
}

function trapezoid(): Polygon {
  return [
    { x: 0, y: 0 },
    { x: 7.5, y: 0 },
    { x: 5.8, y: 4.8 },
    { x: 1.4, y: 4.8 },
  ];
}

function house(): Polygon {
  return [
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 6, y: 3.4 },
    { x: 3, y: 5.7 },
    { x: 0, y: 3.4 },
  ];
}

function parallelogram(): Polygon {
  return [
    { x: 0, y: 0 },
    { x: 6.2, y: 0 },
    { x: 7.5, y: 4.4 },
    { x: 1.3, y: 4.4 },
  ];
}

function hexagon(): Polygon {
  return [
    { x: 1.3, y: 0 },
    { x: 5.7, y: 0 },
    { x: 7, y: 2.4 },
    { x: 5.6, y: 4.8 },
    { x: 1.4, y: 4.8 },
    { x: 0, y: 2.4 },
  ];
}

function arrow(): Polygon {
  return [
    { x: 0, y: 1.5 },
    { x: 4.5, y: 1.5 },
    { x: 4.5, y: 0 },
    { x: 7.4, y: 3 },
    { x: 4.5, y: 6 },
    { x: 4.5, y: 4.5 },
    { x: 0, y: 4.5 },
  ];
}

function lShape(): Polygon {
  return [
    { x: 0, y: 0 },
    { x: 6.4, y: 0 },
    { x: 6.4, y: 2 },
    { x: 2.4, y: 2 },
    { x: 2.4, y: 6.2 },
    { x: 0, y: 6.2 },
  ];
}

function shield(): Polygon {
  return [
    { x: 3.4, y: 0 },
    { x: 6.8, y: 1.4 },
    { x: 5.8, y: 4.2 },
    { x: 3.4, y: 6.1 },
    { x: 1, y: 4.2 },
    { x: 0, y: 1.4 },
  ];
}

function star(): Polygon {
  const center = { x: 3.5, y: 3.5 };
  return Array.from({ length: 10 }, (_, index) => {
    const radius = index % 2 === 0 ? 3.25 : 1.45;
    const angle = (Math.PI * index) / 5 - Math.PI / 2;
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };
  });
}

const TEMPLATES: Record<string, () => Polygon> = {
  rectangle,
  triangle,
  trapezoid,
  house,
  parallelogram,
  hexagon,
  arrow,
  l_shape: lShape,
  shield,
  star,
};

function getDifficultySettings(difficulty: Exclude<JigsawDifficulty, "mixed">): DifficultySettings {
  if (difficulty === "easy") {
    return {
      pieceCounts: [3, 4],
      families: ["rectangle", "triangle", "trapezoid", "house"],
      rotations: [0],
    };
  }
  if (difficulty === "medium") {
    return {
      pieceCounts: [4, 5],
      families: ["parallelogram", "hexagon", "house", "shield", "arrow"],
      rotations: [0, 90, 180, 270],
    };
  }
  return {
    pieceCounts: [5, 6],
    families: ["arrow", "l_shape", "hexagon", "shield", "star"],
    rotations: [0, 45, 90, 135, 180, 225, 270, 315],
  };
}

function createLoosePieces(polygons: Polygon[], rotations: number[]): JigsawPiece[] {
  const targetBounds = bounds(polygons);
  const spread = Math.max(targetBounds.maxX - targetBounds.minX, targetBounds.maxY - targetBounds.minY) + 2;

  return polygons.map((polygon, index) => {
    const pieceBounds = bounds([polygon]);
    const local = polygon.map((point) => ({
      x: point.x - pieceBounds.minX,
      y: point.y - pieceBounds.minY,
    }));
    return {
      id: crypto.randomUUID(),
      label: String(index + 1),
      polygon: local,
      color: PIECE_COLORS[index % PIECE_COLORS.length],
      displayRotation: randomItem(rotations),
      displayOffset: {
        x: (index - (polygons.length - 1) / 2) * spread,
        y: index % 2 === 0 ? 0 : spread * 0.18,
      },
    };
  });
}

function createDistractorOptions(target: Polygon, correctPieces: Polygon[], count: number) {
  const correctKey = roundedKey(correctPieces);
  const accepted = new Set([correctKey]);
  const distractors: Polygon[][] = [];

  while (distractors.length < 4) {
    const candidate = cutTargetShape(target, count);
    const key = roundedKey(candidate);
    if (accepted.has(key)) continue;
    accepted.add(key);
    distractors.push(candidate);
  }

  return distractors;
}

function createQuestion(difficulty: JigsawDifficulty): JigsawQuestion {
  const activeDifficulty =
    difficulty === "mixed" ? randomItem(["easy", "medium", "hard"] as const) : difficulty;
  const settings = getDifficultySettings(activeDifficulty);
  const targetFamily = randomItem(settings.families);
  const target = normalizePolygon(TEMPLATES[targetFamily]());
  const pieceCount = randomItem(settings.pieceCounts);
  const correctPieces = cutTargetShape(target, pieceCount);
  const correctId = crypto.randomUUID();
  const options = shuffle<JigsawOption>([
    {
      id: correctId,
      label: "A",
      polygons: correctPieces,
    },
    ...createDistractorOptions(target, correctPieces, pieceCount).map((polygons) => ({
      id: crypto.randomUUID(),
      label: "A",
      polygons,
    })),
  ]).map((option, index) => ({
    ...option,
    label: String.fromCharCode(65 + index),
  }));

  return {
    id: crypto.randomUUID(),
    prompt: "Mentally assemble the loose parts, then choose the option with the matching internal boundaries.",
    difficulty: activeDifficulty,
    targetFamily,
    pieces: createLoosePieces(correctPieces, settings.rotations),
    options,
    correctOptionId: correctId,
    explanation:
      "All five answers share the same outer silhouette. The correct answer is the one whose internal cut lines match how the loose pieces fit together.",
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
