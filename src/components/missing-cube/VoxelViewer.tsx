"use client";

import { useMemo, useState } from "react";
import type { CubeCell, MissingCubePiece } from "@/types";

interface VoxelViewerProps {
  parts: MissingCubePiece[];
  yaw?: number;
  pitch?: number;
  className?: string;
  compact?: boolean;
  interactive?: boolean;
  opacity?: number;
  shellSize?: number;
  assemblyProgress?: number;
}

const PART_COLORS = [
  ["#7c3aed", "#6d28d9", "#4c1d95"],
  ["#0891b2", "#0e7490", "#164e63"],
  ["#f59e0b", "#d97706", "#92400e"],
  ["#16a34a", "#15803d", "#14532d"],
];

const FACE_DEFS = [
  {
    corners: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    normal: [-1, 0, 0],
    neighbor: { x: -1, y: 0, z: 0 },
    shade: 0,
  },
  {
    corners: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 1],
    ],
    normal: [1, 0, 0],
    neighbor: { x: 1, y: 0, z: 0 },
    shade: 0,
  },
  {
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
    normal: [0, -1, 0],
    neighbor: { x: 0, y: -1, z: 0 },
    shade: 1,
  },
  {
    corners: [
      [0, 1, 0],
      [1, 1, 0],
      [1, 1, 1],
      [0, 1, 1],
    ],
    normal: [0, 1, 0],
    neighbor: { x: 0, y: 1, z: 0 },
    shade: 1,
  },
  {
    corners: [
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
    normal: [0, 0, -1],
    neighbor: { x: 0, y: 0, z: -1 },
    shade: 2,
  },
  {
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
    normal: [0, 0, 1],
    neighbor: { x: 0, y: 0, z: 1 },
    shade: 2,
  },
] as const;

function cellKey(cell: CubeCell) {
  return `${cell.x},${cell.y},${cell.z}`;
}

function rotatePoint(
  point: [number, number, number],
  yawDeg: number,
  pitchDeg: number,
  rollDeg = 0,
): [number, number, number] {
  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;
  const roll = (rollDeg * Math.PI) / 180;
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosX = Math.cos(pitch);
  const sinX = Math.sin(pitch);
  const cosZ = Math.cos(roll);
  const sinZ = Math.sin(roll);

  const x1 = point[0] * cosY - point[2] * sinY;
  const z1 = point[0] * sinY + point[2] * cosY;
  const y2 = point[1] * cosX - z1 * sinX;
  const z2 = point[1] * sinX + z1 * cosX;
  const x3 = x1 * cosZ - y2 * sinZ;
  const y3 = x1 * sinZ + y2 * cosZ;

  return [x3, y3, z2];
}

function nudgeAwayFromFlatYaw(yaw: number) {
  const normalized = ((yaw % 360) + 360) % 360;
  const nearestCardinal = Math.round(normalized / 90) * 90;
  const distance = Math.abs(normalized - nearestCardinal);

  if (distance > 8 && Math.abs(distance - 360) > 8) return yaw;
  return yaw + (normalized >= nearestCardinal ? 12 : -12);
}

function keepObliqueRotation(rotation: { yaw: number; pitch: number }) {
  const pitchSign = rotation.pitch < 0 ? -1 : 1;
  const pitchMagnitude = Math.abs(rotation.pitch);

  return {
    yaw: nudgeAwayFromFlatYaw(rotation.yaw),
    pitch: pitchSign * Math.max(25, Math.min(65, pitchMagnitude)),
  };
}

function getPartCenter(part: MissingCubePiece): [number, number, number] {
  const minX = Math.min(...part.cells.map((cell) => cell.x));
  const maxX = Math.max(...part.cells.map((cell) => cell.x + 1));
  const minY = Math.min(...part.cells.map((cell) => cell.y));
  const maxY = Math.max(...part.cells.map((cell) => cell.y + 1));
  const minZ = Math.min(...part.cells.map((cell) => cell.z));
  const maxZ = Math.max(...part.cells.map((cell) => cell.z + 1));
  return [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
}

function transformPartPoint(
  part: MissingCubePiece,
  point: [number, number, number],
  assemblyProgress: number,
) {
  const center = getPartCenter(part);
  const offset = part.displayOffset ?? { x: 0, y: 0, z: 0 };
  const localRotation = part.displayRotation ?? { yaw: 0, pitch: 0, roll: 0 };
  const separation = 1 - assemblyProgress;
  const rotated = rotatePoint(
    [point[0] - center[0], point[1] - center[1], point[2] - center[2]],
    localRotation.yaw * separation,
    localRotation.pitch * separation,
    localRotation.roll * separation,
  );

  return [
    rotated[0] + center[0] + offset.x * separation,
    rotated[1] + center[1] + offset.y * separation,
    rotated[2] + center[2] + offset.z * separation,
  ] as [number, number, number];
}

function isShellFace(cell: CubeCell, neighbor: CubeCell, shellSize?: number) {
  if (!shellSize) return false;
  const next = {
    x: cell.x + neighbor.x,
    y: cell.y + neighbor.y,
    z: cell.z + neighbor.z,
  };

  return (
    next.x < 0 ||
    next.y < 0 ||
    next.z < 0 ||
    next.x >= shellSize ||
    next.y >= shellSize ||
    next.z >= shellSize
  );
}

export default function VoxelViewer({
  parts,
  yaw = 45,
  pitch = 45,
  className = "",
  compact = false,
  interactive = true,
  opacity = 0.78,
  shellSize,
  assemblyProgress = 0,
}: VoxelViewerProps) {
  const [dragRotation, setDragRotation] = useState<{
    yaw: number;
    pitch: number;
  } | null>(null);
  const [dragStart, setDragStart] = useState<{
    x: number;
    y: number;
    yaw: number;
    pitch: number;
  } | null>(null);
  const rotation = dragRotation ?? keepObliqueRotation({ yaw, pitch });

  const renderData = useMemo(() => {
    const allCorners = parts.flatMap((part) =>
      part.cells.flatMap((cell) =>
        [
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
          [1, 1, 0],
          [1, 0, 1],
          [0, 1, 1],
          [1, 1, 1],
        ].map((corner) =>
          transformPartPoint(part, [
            cell.x + corner[0],
            cell.y + corner[1],
            cell.z + corner[2],
          ], assemblyProgress),
        ),
      ),
    );
    const minX = Math.min(...allCorners.map((point) => point[0]));
    const maxX = Math.max(...allCorners.map((point) => point[0]));
    const minY = Math.min(...allCorners.map((point) => point[1]));
    const maxY = Math.max(...allCorners.map((point) => point[1]));
    const minZ = Math.min(...allCorners.map((point) => point[2]));
    const maxZ = Math.max(...allCorners.map((point) => point[2]));
    const center: [number, number, number] = [
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2,
    ];
    const faces: {
      points: [number, number][];
      depth: number;
      color: string;
      shellFace: boolean;
    }[] = [];

    parts.forEach((part, partIndex) => {
      const partKeys = new Set(part.cells.map(cellKey));
      part.cells.forEach((cell) => {
        FACE_DEFS.forEach((face) => {
          const next = {
            x: cell.x + face.neighbor.x,
            y: cell.y + face.neighbor.y,
            z: cell.z + face.neighbor.z,
          };
          if (partKeys.has(cellKey(next))) return;

          const localRotation = part.displayRotation ?? { yaw: 0, pitch: 0, roll: 0 };
          const separation = 1 - assemblyProgress;
          const localNormal = rotatePoint(
            face.normal as [number, number, number],
            localRotation.yaw * separation,
            localRotation.pitch * separation,
            localRotation.roll * separation,
          );
          const normal = rotatePoint(
            localNormal,
            rotation.yaw,
            rotation.pitch,
          );
          if (normal[2] < -0.05) return;

          const rotated = face.corners.map((corner) =>
            rotatePoint(
              [
                ...transformPartPoint(part, [
                  cell.x + corner[0],
                  cell.y + corner[1],
                  cell.z + corner[2],
                ], assemblyProgress).map((value, axis) => value - center[axis]) as [
                  number,
                  number,
                  number,
                ],
              ],
              rotation.yaw,
              rotation.pitch,
            ),
          );
          faces.push({
            points: rotated.map((point) => [point[0], -point[1]]),
            depth: rotated.reduce((sum, point) => sum + point[2], 0) / rotated.length,
            color: PART_COLORS[partIndex % PART_COLORS.length][face.shade],
            shellFace: isShellFace(cell, face.neighbor, shellSize),
          });
        });
      });
    });

    const sortedFaces = faces.sort((a, b) => a.depth - b.depth);
    const points = sortedFaces.flatMap((face) => face.points);
    const minPx = Math.min(...points.map((point) => point[0]));
    const maxPx = Math.max(...points.map((point) => point[0]));
    const minPy = Math.min(...points.map((point) => point[1]));
    const maxPy = Math.max(...points.map((point) => point[1]));
    const pad = 0.8;

    return {
      faces: sortedFaces,
      viewBox: `${minPx - pad} ${minPy - pad} ${maxPx - minPx + pad * 2} ${maxPy - minPy + pad * 2}`,
    };
  }, [parts, rotation.pitch, rotation.yaw, shellSize, assemblyProgress]);

  return (
    <div
      className={`relative select-none rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-950 ${className}`}
      onPointerDown={(event) => {
        if (!interactive) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragStart({
          x: event.clientX,
          y: event.clientY,
          yaw: rotation.yaw,
          pitch: rotation.pitch,
        });
      }}
      onPointerMove={(event) => {
        if (!interactive) return;
        if (!dragStart) return;
        setDragRotation(keepObliqueRotation({
          yaw: dragStart.yaw + (event.clientX - dragStart.x) * 0.45,
          pitch: dragStart.pitch - (event.clientY - dragStart.y) * 0.35,
        }));
      }}
      onPointerUp={() => interactive && setDragStart(null)}
      onPointerCancel={() => interactive && setDragStart(null)}
    >
      <svg
        className={compact ? "h-32 w-full" : "h-72 w-full"}
        viewBox={renderData.viewBox}
        role="img"
        aria-label="Tiltable cube model"
      >
        {renderData.faces.map((face, index) => (
          <polygon
            key={`${index}-${face.depth}`}
            points={face.points.map((point) => point.join(",")).join(" ")}
            fill={face.color}
            fillOpacity={opacity}
            stroke={face.shellFace ? "rgba(252, 211, 77, 0.9)" : "none"}
            strokeWidth={face.shellFace ? 0.035 : 0}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {interactive && (
        <div className="pointer-events-none absolute bottom-2 right-3 rounded-md bg-black/55 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          Drag to tilt
        </div>
      )}
    </div>
  );
}
