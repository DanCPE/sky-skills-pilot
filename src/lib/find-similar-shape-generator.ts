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
const DIRECTION_EPSILON = 0.98;
const BOUNDS_EPSILON = 0.01;
const OPTION_LABELS = ["A", "B", "C", "D", "E"];

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

function polygonBounds(polygons: Polygon[]) {
  const points = polygons.flat();
  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}

function hasMatchingBounds(a: Polygon[], b: Polygon[]) {
  const aBounds = polygonBounds(a);
  const bBounds = polygonBounds(b);
  return (
    Math.abs(aBounds.minX - bBounds.minX) <= BOUNDS_EPSILON &&
    Math.abs(aBounds.minY - bBounds.minY) <= BOUNDS_EPSILON &&
    Math.abs(aBounds.maxX - bBounds.maxX) <= BOUNDS_EPSILON &&
    Math.abs(aBounds.maxY - bBounds.maxY) <= BOUNDS_EPSILON
  );
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

function findBoundaryEdges(polygons: Polygon[]) {
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

  return [...edgeMap.values()]
    .filter((references) => references.length === 1)
    .map((references) => references[0]);
}

function normalizeVector(vector: JigsawPoint) {
  const length = Math.hypot(vector.x, vector.y);
  if (length <= POINT_EPSILON) return null;
  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

function boundaryTangentAtPoint(
  point: JigsawPoint,
  boundaryEdges: EdgeReference[],
) {
  const directions = boundaryEdges
    .flatMap((edge) => {
      const candidates: JigsawPoint[] = [];
      if (samePoint(edge.a, point)) {
        candidates.push({ x: edge.b.x - edge.a.x, y: edge.b.y - edge.a.y });
      }
      if (samePoint(edge.b, point)) {
        candidates.push({ x: edge.a.x - edge.b.x, y: edge.a.y - edge.b.y });
      }
      return candidates;
    })
    .map(normalizeVector)
    .filter((direction): direction is JigsawPoint => Boolean(direction));

  if (directions.length === 0) return null;
  if (directions.length === 1) return directions[0];

  for (let i = 0; i < directions.length; i++) {
    for (let j = i + 1; j < directions.length; j++) {
      const dot = directions[i].x * directions[j].x + directions[i].y * directions[j].y;
      if (Math.abs(dot) >= DIRECTION_EPSILON) {
        return directions[i];
      }
    }
  }

  return null;
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

function getMagnitudeRange(difficulty: FindSimilarShapeQuestion["difficulty"]) {
  if (difficulty === "easy") return { min: 0.42, max: 0.62 };
  if (difficulty === "medium") return { min: 0.24, max: 0.38 };
  return { min: 0.14, max: 0.24 };
}

function mutationMagnitude(difficulty: FindSimilarShapeQuestion["difficulty"]) {
  const range = getMagnitudeRange(difficulty);
  return range.min + Math.random() * (range.max - range.min);
}

function tiltedBoundaryMutation(
  correctPolygons: Polygon[],
  difficulty: FindSimilarShapeQuestion["difficulty"],
  attempt: number,
) {
  const mutated = clonePolygons(correctPolygons);
  const internalEdges = findInternalEdges(correctPolygons);
  const boundaryEdges = findBoundaryEdges(correctPolygons);
  const candidates = shuffle(internalEdges)
    .map((references) => references[0])
    .map((edge) => ({
      edge,
      tangentA: boundaryTangentAtPoint(edge.a, boundaryEdges),
      tangentB: boundaryTangentAtPoint(edge.b, boundaryEdges),
    }))
    .filter(({ tangentA, tangentB }) => tangentA || tangentB);

  const candidate = candidates[0];
  if (!candidate) return null;

  const direction = Math.random() < 0.5 ? -1 : 1;
  const magnitude = mutationMagnitude(difficulty) * (1.55 + (attempt % 3) * 0.22);

  if (candidate.tangentA) {
    moveMatchingVertices(mutated, [candidate.edge.a], {
      x: candidate.tangentA.x * magnitude * direction,
      y: candidate.tangentA.y * magnitude * direction,
    });
  }

  if (candidate.tangentB) {
    moveMatchingVertices(mutated, [candidate.edge.b], {
      x: candidate.tangentB.x * magnitude * -direction,
      y: candidate.tangentB.y * magnitude * -direction,
    });
  }

  return mutated;
}

function createFindSimilarOptions(
  correctPolygons: Polygon[],
  correctOptionId: string,
  difficulty: FindSimilarShapeQuestion["difficulty"],
  sameOutlineDistractors: Polygon[][],
) {
  const accepted = new Set([roundedKey(correctPolygons)]);
  const distractors: JigsawOption[] = [];

  for (let attempt = 0; distractors.length < 1 && attempt < 12; attempt++) {
    const polygons = tiltedBoundaryMutation(correctPolygons, difficulty, attempt);
    if (!polygons) continue;
    if (!hasMatchingBounds(correctPolygons, polygons)) continue;
    const key = roundedKey(polygons);
    if (accepted.has(key)) continue;
    accepted.add(key);
    distractors.push({
      id: crypto.randomUUID(),
      label: "A",
      polygons,
    });
  }

  for (const polygons of sameOutlineDistractors) {
    if (distractors.length >= 4) break;
    if (!hasMatchingBounds(correctPolygons, polygons)) continue;
    const key = roundedKey(polygons);
    if (accepted.has(key)) continue;
    accepted.add(key);
    distractors.push({
      id: crypto.randomUUID(),
      label: "A",
      polygons: clonePolygons(polygons),
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
      const sameOutlineDistractors = question.options
        .filter((option) => option.id !== question.correctOptionId)
        .map((option) => option.polygons);
      const correctOptionId = crypto.randomUUID();
      const options = createFindSimilarOptions(
        targetPolygons,
        correctOptionId,
        question.difficulty,
        sameOutlineDistractors,
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
    timeLimit: mode === "real" ? count * 14 : undefined,
  };
}
