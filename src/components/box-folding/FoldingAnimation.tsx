"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  BoxFoldingFaceName,
  BoxFoldingFaceOrientation,
  BoxFoldingView,
} from "@/types";

type Direction = "above" | "below" | "left" | "right";

interface FoldNode {
  faceIndex: number;
  directionFromParent?: Direction;
  children: FoldNode[];
}

const ORIENTATION_DEGREES: Record<BoxFoldingFaceOrientation, number> = {
  A: 0,
  B: 90,
  C: 180,
  D: 270,
};

function TransparentDebugOverlay({
  faceIndex,
  faceName,
  orientation,
}: {
  faceIndex: number;
  faceName: BoxFoldingFaceName;
  orientation: BoxFoldingFaceOrientation;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 opacity-50">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b bg-red-500/45 px-1 text-[6px] font-black uppercase leading-tight text-white">
        head
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t bg-blue-600/45 px-1 text-[6px] font-black uppercase leading-tight text-white">
        bottom
      </div>
      <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r bg-emerald-600/45 px-1 text-[6px] font-black uppercase leading-tight text-white">
        left
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 rounded-l bg-amber-400/45 px-1 text-[6px] font-black uppercase leading-tight text-zinc-950">
        right
      </div>
      <div className="absolute left-1 top-1 rounded bg-zinc-950/35 px-1 py-0.5 text-[7px] font-black uppercase leading-none text-white">
        #{faceIndex}
      </div>
      <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 rounded bg-white/45 px-1 py-0.5 text-center text-[8px] font-black uppercase leading-tight text-zinc-950 shadow-sm">
        {faceName}
        <span className="ml-1 text-[6px] text-zinc-700">
          {orientation}/{ORIENTATION_DEGREES[orientation]}°
        </span>
      </div>
    </div>
  );
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function buildFoldTree(pattern: number[][]): FoldNode {
  const positions = new Map<number, { row: number; col: number }>();
  const nodes = new Map<number, FoldNode>();

  pattern.forEach((row, rowIndex) => {
    row.forEach((faceIndex, colIndex) => {
      if (faceIndex === 0) return;
      positions.set(faceIndex, { row: rowIndex, col: colIndex });
      nodes.set(faceIndex, { faceIndex, children: [] });
    });
  });

  const root = nodes.get(1) ?? nodes.get(Math.min(...nodes.keys()));
  if (!root) return { faceIndex: 1, children: [] };

  const positionToFace = new Map(
    [...positions.entries()].map(([faceIndex, position]) => [
      `${position.row},${position.col}`,
      faceIndex,
    ]),
  );
  const queue = [root.faceIndex];
  const visited = new Set(queue);
  const directions: { row: number; col: number; name: Direction }[] = [
    { row: -1, col: 0, name: "above" },
    { row: 1, col: 0, name: "below" },
    { row: 0, col: -1, name: "left" },
    { row: 0, col: 1, name: "right" },
  ];

  while (queue.length > 0) {
    const currentFaceIndex = queue.shift()!;
    const currentPosition = positions.get(currentFaceIndex);
    const currentNode = nodes.get(currentFaceIndex);
    if (!currentPosition || !currentNode) continue;

    for (const direction of directions) {
      const childFaceIndex = positionToFace.get(
        `${currentPosition.row + direction.row},${currentPosition.col + direction.col}`,
      );
      if (!childFaceIndex || visited.has(childFaceIndex)) continue;

      const childNode = nodes.get(childFaceIndex);
      if (!childNode) continue;

      childNode.directionFromParent = direction.name;
      currentNode.children.push(childNode);
      visited.add(childFaceIndex);
      queue.push(childFaceIndex);
    }
  }

  return root;
}

function childGroupTransform(direction: Direction, progress: number, half: number) {
  const angle = 90 * progress;

  if (direction === "above") {
    return `translate3d(0, ${-half}px, 0) rotateX(${angle}deg) translate3d(0, ${-half}px, 0)`;
  }
  if (direction === "below") {
    return `translate3d(0, ${half}px, 0) rotateX(${-angle}deg) translate3d(0, ${half}px, 0)`;
  }
  if (direction === "left") {
    return `translate3d(${-half}px, 0, 0) rotateY(${-angle}deg) translate3d(${-half}px, 0, 0)`;
  }

  return `translate3d(${half}px, 0, 0) rotateY(${angle}deg) translate3d(${half}px, 0, 0)`;
}

export default function FoldingAnimation({
  pattern,
  images,
  faceAssignments,
  faceOrientations,
  interactive = false,
}: {
  pattern: number[][];
  images: Record<number, string>;
  faceAssignments: Record<number, BoxFoldingFaceName>;
  faceOrientations: Record<number, BoxFoldingFaceOrientation>;
  interactive?: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{
    pointerId: number;
    x: number;
    y: number;
    tiltX: number;
    tiltY: number;
  } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const cellSize = 54;
  const cubeHalf = cellSize / 2;
  const foldTree = useMemo(() => buildFoldTree(pattern), [pattern]);

  // Scale that fits the flat net (progress=0) within the 260×192 container.
  // Interpolates up to the normal cube scale (0.88) as progress→1.
  const netFitScale = useMemo(() => {
    const rows = pattern.length;
    const cols = pattern[0]?.length ?? 1;
    return Math.min(
      (260 * 0.85) / (cols * cellSize),
      (192 * 0.85) / (rows * cellSize),
      0.88,
    );
  }, [pattern, cellSize]);
  const effectiveScale = netFitScale + (0.88 - netFitScale) * progress;

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const animateTo = (target: number) => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const start = performance.now();
    const duration = 950;
    const initial = progressRef.current;

    const animate = (now: number) => {
      const raw = Math.min((now - start) / duration, 1);
      const next = initial + (target - initial) * easeOutCubic(raw);
      progressRef.current = next;
      setProgress(next);

      if (raw < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">
          Fold Preview
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => animateTo(1)}
            className="rounded-lg bg-[#4F12A6] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-violet-700 active:scale-95"
          >
            Flip
          </button>
          <button
            type="button"
            onClick={() => animateTo(0)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 transition hover:bg-zinc-100 active:scale-95 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-200"
          >
            Deflip
          </button>
        </div>
      </div>

      <div
        className={`relative mx-auto h-48 w-full max-w-[260px] overflow-hidden rounded-lg bg-white dark:bg-black/20 ${
          interactive ? "cursor-grab touch-none active:cursor-grabbing" : ""
        }`}
        style={{ perspective: "720px" }}
        onPointerDown={(event) => {
          if (!interactive) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragStart({
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            tiltX: tilt.x,
            tiltY: tilt.y,
          });
        }}
        onPointerMove={(event) => {
          if (!interactive || !dragStart || event.pointerId !== dragStart.pointerId) return;
          setTilt({
            x: Math.max(-80, Math.min(80, dragStart.tiltX - (event.clientY - dragStart.y) * 0.45)),
            y: dragStart.tiltY + (event.clientX - dragStart.x) * 0.45,
          });
        }}
        onPointerUp={() => setDragStart(null)}
        onPointerCancel={() => setDragStart(null)}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transformStyle: "preserve-3d",
            transform: `scale(${effectiveScale}) rotateX(${tilt.x - 45 * progress}deg) rotateY(${tilt.y - 45 * progress}deg)`,
          }}
        >
          <FoldFaceNode
            node={foldTree}
            images={images}
            faceAssignments={faceAssignments}
            faceOrientations={faceOrientations}
            progress={progress}
            cellSize={cellSize}
            cubeHalf={cubeHalf}
            imageRotations={{}}
          />
        </div>
      </div>
    </div>
  );
}

export function FoldedCubeSnapshot({
  pattern,
  images,
  faceAssignments,
  faceOrientations,
  view,
  imageRotations = {},
  compact = false,
  interactive = false,
  className,
  cubeScale,
}: {
  pattern: number[][];
  images: Record<number, string>;
  faceAssignments: Record<number, BoxFoldingFaceName>;
  faceOrientations: Record<number, BoxFoldingFaceOrientation>;
  view?: Pick<BoxFoldingView, "rotX" | "rotY">;
  imageRotations?: Record<number, number>;
  compact?: boolean;
  interactive?: boolean;
  className?: string;
  cubeScale?: number;
}) {
  const cellSize = compact ? 28 : 54;
  const cubeHalf = cellSize / 2;
  const foldTree = useMemo(() => buildFoldTree(pattern), [pattern]);
  const [tilt, setTilt] = useState({
    x: view?.rotX ?? -45,
    y: view?.rotY ?? -45,
  });
  const [dragStart, setDragStart] = useState<{
    pointerId: number;
    x: number;
    y: number;
    tiltX: number;
    tiltY: number;
  } | null>(null);
  const activeTilt = interactive ? tilt : { x: view?.rotX ?? -45, y: view?.rotY ?? -45 };

  const activeScale = cubeScale ?? (compact ? 0.62 : 0.92);
  const heightClass = className ?? (compact ? "h-[72px]" : "h-56");
  const bare = className !== undefined;

  return (
    <div
      className={`${heightClass} flex items-center justify-center overflow-hidden ${
        bare ? "" : "rounded-xl bg-[radial-gradient(circle_at_50%_35%,rgba(79,18,166,0.10),transparent_55%)] dark:bg-[radial-gradient(circle_at_50%_35%,rgba(251,191,36,0.10),transparent_55%)]"
      } ${interactive ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
      style={{ perspective: compact ? "520px" : "720px" }}
      onPointerDown={(event) => {
        if (!interactive) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragStart({
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          tiltX: tilt.x,
          tiltY: tilt.y,
        });
      }}
      onPointerMove={(event) => {
        if (!interactive || !dragStart || event.pointerId !== dragStart.pointerId) return;
        setTilt({
          x: Math.max(-80, Math.min(80, dragStart.tiltX - (event.clientY - dragStart.y) * 0.45)),
          y: dragStart.tiltY + (event.clientX - dragStart.x) * 0.45,
        });
      }}
      onPointerUp={() => setDragStart(null)}
      onPointerCancel={() => setDragStart(null)}
    >
      <div
        className="relative"
        style={{
          transformStyle: "preserve-3d",
          transform: `scale(${activeScale}) rotateX(${activeTilt.x}deg) rotateY(${activeTilt.y}deg) translateZ(${cubeHalf}px)`,
        }}
      >
        <FoldFaceNode
          node={foldTree}
          images={images}
          faceAssignments={faceAssignments}
          faceOrientations={faceOrientations}
          progress={1}
          cellSize={cellSize}
          cubeHalf={cubeHalf}
          imageRotations={imageRotations}
        />
      </div>
    </div>
  );
}

function FoldFaceNode({
  node,
  images,
  faceAssignments,
  faceOrientations,
  imageRotations,
  progress,
  cellSize,
  cubeHalf,
}: {
  node: FoldNode;
  images: Record<number, string>;
  faceAssignments: Record<number, BoxFoldingFaceName>;
  faceOrientations: Record<number, BoxFoldingFaceOrientation>;
  imageRotations: Record<number, number>;
  progress: number;
  cellSize: number;
  cubeHalf: number;
}) {
  const faceName = faceAssignments[node.faceIndex];
  const wrapperTransform = node.directionFromParent
    ? childGroupTransform(node.directionFromParent, progress, cubeHalf)
    : "translate3d(0, 0, 0)";

  return (
    <div
      className="absolute left-0 top-0"
      style={{
        transformStyle: "preserve-3d",
        transform: wrapperTransform,
      }}
    >
      <div
        className="absolute flex items-center justify-center border border-zinc-300 bg-white shadow-[inset_0_0_10px_rgba(15,23,42,0.10)] dark:border-zinc-700 dark:bg-zinc-900"
        style={{
          width: cellSize,
          height: cellSize,
          marginLeft: -cellSize / 2,
          marginTop: -cellSize / 2,
          backfaceVisibility: "hidden",
        }}
      >
        <img
          src={images[node.faceIndex]}
          alt=""
          className="h-[58%] w-[58%] object-contain"
          draggable={false}
          style={{ transform: `rotate(${imageRotations[node.faceIndex] ?? 0}deg)` }}
        />
        <TransparentDebugOverlay
          faceIndex={node.faceIndex}
          faceName={faceName}
          orientation={faceOrientations[node.faceIndex]}
        />
      </div>

      {node.children.map((child) => (
        <FoldFaceNode
          key={child.faceIndex}
          node={child}
          images={images}
          faceAssignments={faceAssignments}
          faceOrientations={faceOrientations}
          imageRotations={imageRotations}
          progress={progress}
          cellSize={cellSize}
          cubeHalf={cubeHalf}
        />
      ))}
    </div>
  );
}
