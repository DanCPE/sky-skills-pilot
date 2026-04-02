import type {
  ScanningShapeItem,
  ScanningShapeQuizResponse,
  ScanningShapeSection,
  ScanningShapeType,
} from "@/types";

interface DifficultyParams {
  minSize: number;
  maxSize: number;
  minShapes: number;
  maxShapes: number;
}

export const SCANNING_SHAPE_CANVAS_WIDTH = 1200;
export const SCANNING_SHAPE_CANVAS_HEIGHT = 340;
export const SCANNING_SHAPE_ANSWERS_PER_SECTION = 8;

const DIFFICULTY_PARAMS: Record<string, DifficultyParams> = {
  easy: { minSize: 70, maxSize: 110, minShapes: 20, maxShapes: 24 },
  medium: { minSize: 55, maxSize: 100, minShapes: 24, maxShapes: 28 },
  hard: { minSize: 50, maxSize: 85, minShapes: 40, maxShapes: 60 },
  mixed: { minSize: 30, maxSize: 110, minShapes: 32, maxShapes: 60 },
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}

function noCollision(
  x: number,
  y: number,
  size: number,
  placed: ScanningShapeItem[],
  gap = 6,
): boolean {
  const halfSize = size / 2;

  for (const item of placed) {
    const itemHalfSize = item.size / 2;

    if (
      Math.abs(x - item.x) < halfSize + itemHalfSize + gap &&
      Math.abs(y - item.y) < halfSize + itemHalfSize + gap
    ) {
      return false;
    }
  }

  return true;
}

function generateSection(
  id: number,
  params: DifficultyParams,
): ScanningShapeSection {
  const shapes: ScanningShapeItem[] = [];
  const usedClues = new Set<string>();
  const zoneCols = 4;
  const zoneRows = 3;
  const zoneUsage = Array.from({ length: zoneCols * zoneRows }, () => 0);
  const shapeTypes: ScanningShapeType[] = [
    "circle",
    "square",
    "triangle",
    "hexagon",
  ];
  const count = rand(params.minShapes, params.maxShapes);

  for (let i = 0; i < count; i += 1) {
    const size = rand(params.minSize, params.maxSize);
    const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    const halfWidth = size / 2;

    const triangleTopMargin = Math.ceil((size * Math.sqrt(3)) / 3);
    const triangleBottomMargin = Math.ceil((size * Math.sqrt(3)) / 6);
    const minY =
      type === "triangle" ? triangleTopMargin : Math.ceil(halfWidth);
    const maxY =
      type === "triangle"
        ? Math.floor(SCANNING_SHAPE_CANVAS_HEIGHT - triangleBottomMargin)
        : Math.floor(SCANNING_SHAPE_CANVAS_HEIGHT - halfWidth);
    const minX = Math.ceil(halfWidth);
    const maxX = Math.floor(SCANNING_SHAPE_CANVAS_WIDTH - halfWidth);

    if (minX > maxX || minY > maxY) {
      continue;
    }

    const zoneWidth = (maxX - minX) / zoneCols;
    const zoneHeight = (maxY - minY) / zoneRows;
    const orderedZones = shuffle(
      Array.from({ length: zoneCols * zoneRows }, (_, index) => index),
    ).sort((a, b) => zoneUsage[a] - zoneUsage[b]);

    for (let attempt = 0; attempt < 100; attempt += 1) {
      const zoneIndex = orderedZones[attempt % orderedZones.length];
      const zoneCol = zoneIndex % zoneCols;
      const zoneRow = Math.floor(zoneIndex / zoneCols);
      const zoneMinX = Math.max(
        minX,
        Math.floor(minX + zoneCol * zoneWidth),
      );
      const zoneMaxX = Math.min(
        maxX,
        Math.floor(minX + (zoneCol + 1) * zoneWidth),
      );
      const zoneMinY = Math.max(
        minY,
        Math.floor(minY + zoneRow * zoneHeight),
      );
      const zoneMaxY = Math.min(
        maxY,
        Math.floor(minY + (zoneRow + 1) * zoneHeight),
      );
      const x = rand(zoneMinX, Math.max(zoneMinX, zoneMaxX));
      const y = rand(zoneMinY, Math.max(zoneMinY, zoneMaxY));
      const digits = String(rand(10, 99));
      const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const clueKey = `${type}:${digits}`;

      if (!noCollision(x, y, size, shapes) || usedClues.has(clueKey)) {
        continue;
      }

      usedClues.add(clueKey);
      shapes.push({
        id: `s${id}_shape_${i}`,
        shape: type,
        digits,
        letter,
        rotation: rand(0, 359),
        x,
        y,
        size,
      });
      zoneUsage[zoneIndex] += 1;
      break;
    }
  }

  const answerShapes = [...shapes]
    .sort(() => Math.random() - 0.5)
    .slice(0, SCANNING_SHAPE_ANSWERS_PER_SECTION);

  return { id, shapes, answerShapes };
}

export function generateScanningShapeSections(
  sectionCount: number,
  difficulty: string,
): ScanningShapeSection[] {
  const params = DIFFICULTY_PARAMS[difficulty] ?? DIFFICULTY_PARAMS.mixed;

  return Array.from({ length: sectionCount }, (_, index) =>
    generateSection(index + 1, params),
  );
}

export function generateScanningShapeQuiz(
  mode: "learn" | "real",
  difficulty: "easy" | "medium" | "hard" | "mixed",
  sectionCount: number,
  timeLimit: number | null,
): ScanningShapeQuizResponse {
  return {
    mode,
    difficulty,
    sectionCount,
    timeLimit,
    sections: generateScanningShapeSections(sectionCount, difficulty),
  };
}
