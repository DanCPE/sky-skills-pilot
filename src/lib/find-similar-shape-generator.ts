import { generateJigsawQuiz, type JigsawDifficulty } from "@/lib/jigsaw-generator";
import type {
  JigsawOption,
  JigsawPoint,
  FindSimilarShapeQuestion,
  FindSimilarShapeQuizResponse,
} from "@/types";

export type FindSimilarShapeDifficulty = JigsawDifficulty;

type Polygon = JigsawPoint[];
type EdgeReference = {
  polygonIndex: number;
  startIndex: number;
  endIndex: number;
  a: JigsawPoint;
  b: JigsawPoint;
};

const POINT_EPSILON = 0.001;
const OPTION_LABELS = ["A", "B", "C", "D", "E"];

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

function pointKey(point: JigsawPoint) {
  return `${point.x.toFixed(3)},${point.y.toFixed(3)}`;
}

function edgeKey(a: JigsawPoint, b: JigsawPoint) {
  const first = pointKey(a);
  const second = pointKey(b);
  return first < second ? `${first}|${second}` : `${second}|${first}`;
}

function samePoint(a: JigsawPoint, b: JigsawPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y) <= POINT_EPSILON;
}

function clonePolygons(polygons: Polygon[]) {
  return polygons.map((polygon) =>
    polygon.map((point) => ({
      x: point.x,
      y: point.y,
    })),
  );
}

function roundedKey(polygons: Polygon[]) {
  return polygons
    .map((polygon) =>
      polygon
        .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
        .join("|"),
    )
    .sort()
    .join("::");
}

function findInternalEdges(polygons: Polygon[]) {
  const edgeMap = new Map<string, EdgeReference[]>();

  polygons.forEach((polygon, polygonIndex) => {
    polygon.forEach((point, startIndex) => {
      const endIndex = (startIndex + 1) % polygon.length;
      const next = polygon[endIndex];
      const key = edgeKey(point, next);
      const references = edgeMap.get(key) ?? [];
      references.push({
        polygonIndex,
        startIndex,
        endIndex,
        a: point,
        b: next,
      });
      edgeMap.set(key, references);
    });
  });

  return [...edgeMap.values()].filter((references) => references.length > 1);
}

function moveMatchingVertices(
  polygons: Polygon[],
  originalPoints: JigsawPoint[],
  delta: JigsawPoint,
) {
  polygons.forEach((polygon) => {
    polygon.forEach((point) => {
      if (originalPoints.some((originalPoint) => samePoint(point, originalPoint))) {
        point.x += delta.x;
        point.y += delta.y;
      }
    });
  });
}

function moveSingleVertex(polygons: Polygon[], originalPoint: JigsawPoint, delta: JigsawPoint) {
  polygons.forEach((polygon) => {
    polygon.forEach((point) => {
      if (samePoint(point, originalPoint)) {
        point.x += delta.x;
        point.y += delta.y;
      }
    });
  });
}

function getMagnitudeRange(difficulty: FindSimilarShapeQuestion["difficulty"]) {
  if (difficulty === "easy") return { min: 0.42, max: 0.62 };
  if (difficulty === "medium") return { min: 0.24, max: 0.38 };
  return { min: 0.14, max: 0.24 };
}

function mutationMagnitude(difficulty: FindSimilarShapeQuestion["difficulty"]) {
  const range = getMagnitudeRange(difficulty);
  return range.min + Math.random() * (range.max - range.min);
}

function mutateFromCorrect(
  correctPolygons: Polygon[],
  difficulty: FindSimilarShapeQuestion["difficulty"],
  attempt: number,
) {
  const mutated = clonePolygons(correctPolygons);
  const internalEdges = findInternalEdges(correctPolygons);
  const magnitude = mutationMagnitude(difficulty) * (1 + (attempt % 3) * 0.18);
  const direction = Math.random() < 0.5 ? -1 : 1;

  if (internalEdges.length > 0) {
    const references = randomItem(internalEdges);
    const { a, b } = references[0];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const normal = {
      x: (-dy / length) * magnitude * direction,
      y: (dx / length) * magnitude * direction,
    };

    if (difficulty === "hard" || Math.random() < 0.72) {
      moveMatchingVertices(mutated, [a, b], normal);
    } else {
      moveSingleVertex(mutated, randomItem([a, b]), normal);
    }

    return mutated;
  }

  const points = correctPolygons.flat();
  const point = randomItem(points);
  const angle = Math.random() * Math.PI * 2;
  moveSingleVertex(mutated, point, {
    x: Math.cos(angle) * magnitude,
    y: Math.sin(angle) * magnitude,
  });
  return mutated;
}

function createFindSimilarOptions(
  correctPolygons: Polygon[],
  correctOptionId: string,
  difficulty: FindSimilarShapeQuestion["difficulty"],
) {
  const accepted = new Set([roundedKey(correctPolygons)]);
  const distractors: JigsawOption[] = [];

  for (let attempt = 0; distractors.length < 4 && attempt < 80; attempt++) {
    const polygons = mutateFromCorrect(correctPolygons, difficulty, attempt);
    const key = roundedKey(polygons);
    if (accepted.has(key)) continue;
    accepted.add(key);
    distractors.push({
      id: crypto.randomUUID(),
      label: "A",
      polygons,
    });
  }

  while (distractors.length < 4) {
    const polygons = mutateFromCorrect(correctPolygons, difficulty, distractors.length + 80);
    distractors.push({
      id: crypto.randomUUID(),
      label: "A",
      polygons,
    });
  }

  return shuffle<JigsawOption>([
    {
      id: correctOptionId,
      label: "A",
      polygons: correctPolygons,
    },
    ...distractors,
  ]).map((option, index) => ({
    ...option,
    label: OPTION_LABELS[index],
  }));
}

export function generateFindSimilarShapeQuiz(
  count: number,
  mode: "learn" | "real",
  difficulty: FindSimilarShapeDifficulty = "mixed",
): FindSimilarShapeQuizResponse {
  const baseQuiz = generateJigsawQuiz(count, mode, difficulty);
  const questions: FindSimilarShapeQuestion[] = baseQuiz.questions.map(
    (question) => {
      const correct = question.options.find(
        (option) => option.id === question.correctOptionId,
      );
      const targetPolygons = clonePolygons(
        correct?.polygons ?? question.options[0]?.polygons ?? [],
      );
      const correctOptionId = crypto.randomUUID();
      const options = createFindSimilarOptions(
        targetPolygons,
        correctOptionId,
        question.difficulty,
      );

      return {
        id: question.id,
        prompt: "Find the answer choice that exactly matches the target shape.",
        difficulty: question.difficulty,
        targetFamily: question.targetFamily,
        targetPolygons,
        options,
        correctOptionId,
        explanation:
          "The correct choice has the exact same outer shape and internal boundary positions as the target. Distractors are near matches with one small boundary or point shifted.",
      };
    },
  );

  return {
    questions,
    mode,
    timeLimit: mode === "real" ? count * 20 : undefined,
  };
}
