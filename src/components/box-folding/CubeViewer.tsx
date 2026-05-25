"use client";

import { useState } from "react";
import type {
  BoxFoldingCube,
  BoxFoldingFaceName,
  BoxFoldingView,
} from "@/types";

const FACE_TRANSFORMS: Record<BoxFoldingFaceName, string> = {
  front: "translateZ(var(--cube-half))",
  back: "rotateY(180deg) translateZ(var(--cube-half))",
  right: "rotateY(90deg) translateZ(var(--cube-half))",
  left: "rotateY(-90deg) translateZ(var(--cube-half))",
  top: "rotateX(90deg) translateZ(var(--cube-half))",
  bottom: "rotateX(-90deg) translateZ(var(--cube-half))",
};

const ORIENTATION_DEGREES = {
  A: 0,
  B: 90,
  C: 180,
  D: 270,
};

const FACE_NAMES = ["front", "back", "top", "bottom", "left", "right"] as const;

function relativeRotationDegrees(
  current: keyof typeof ORIENTATION_DEGREES,
  baseline?: keyof typeof ORIENTATION_DEGREES,
) {
  if (!baseline) return ORIENTATION_DEGREES[current];
  return (ORIENTATION_DEGREES[current] - ORIENTATION_DEGREES[baseline] + 360) % 360;
}

function TransparentDebugOverlay({
  faceName,
  compact,
}: {
  faceName: BoxFoldingFaceName;
  compact: boolean;
}) {
  const edgeClass = compact ? "text-[6px]" : "text-[8px]";
  const centerClass = compact ? "text-[9px]" : "text-[11px]";

  return (
    <div className="pointer-events-none absolute inset-0 z-10 opacity-50">
      <div className={`absolute left-1/2 top-0 -translate-x-1/2 rounded-b bg-red-500/45 px-1 font-black uppercase leading-tight text-white ${edgeClass}`}>
        head
      </div>
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t bg-blue-600/45 px-1 font-black uppercase leading-tight text-white ${edgeClass}`}>
        bottom
      </div>
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-r bg-emerald-600/45 px-1 font-black uppercase leading-tight text-white ${edgeClass}`}>
        left
      </div>
      <div className={`absolute right-0 top-1/2 -translate-y-1/2 rounded-l bg-amber-400/45 px-1 font-black uppercase leading-tight text-zinc-950 ${edgeClass}`}>
        right
      </div>
      <div className={`absolute inset-x-1 top-1/2 -translate-y-1/2 rounded bg-white/45 px-1 py-0.5 text-center font-black uppercase leading-tight text-zinc-950 shadow-sm ${centerClass}`}>
        {faceName}
      </div>
    </div>
  );
}

export default function CubeViewer({
  cube,
  view,
  compact = false,
  interactive = false,
  showAllFaces = false,
  baseOrientationsByImage,
  className = "",
}: {
  cube: BoxFoldingCube;
  view: BoxFoldingView;
  compact?: boolean;
  interactive?: boolean;
  showAllFaces?: boolean;
  baseOrientationsByImage?: Record<string, keyof typeof ORIENTATION_DEGREES>;
  className?: string;
}) {
  const sizeClass = compact ? "h-32" : "h-56 sm:h-64";
  const cubeSize = compact ? "80px" : "132px";
  const [tilt, setTilt] = useState({ x: view.rotX, y: view.rotY });
  const [dragStart, setDragStart] = useState<{
    pointerId: number;
    x: number;
    y: number;
    tiltX: number;
    tiltY: number;
  } | null>(null);
  const activeTilt = interactive ? tilt : { x: view.rotX, y: view.rotY };

  return (
    <div
      className={`flex ${sizeClass} items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_35%,rgba(79,18,166,0.10),transparent_55%)] dark:bg-[radial-gradient(circle_at_50%_35%,rgba(251,191,36,0.10),transparent_55%)] ${
        interactive ? "cursor-grab touch-none active:cursor-grabbing" : ""
      } ${className}`}
      style={{ perspective: compact ? "520px" : "760px" }}
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
          x: Math.max(-85, Math.min(85, dragStart.tiltX - (event.clientY - dragStart.y) * 0.45)),
          y: dragStart.tiltY + (event.clientX - dragStart.x) * 0.45,
        });
      }}
      onPointerUp={() => setDragStart(null)}
      onPointerCancel={() => setDragStart(null)}
    >
      <div
        className="relative"
        style={{
          width: cubeSize,
          height: cubeSize,
          transformStyle: "preserve-3d",
          transform: `rotateX(${activeTilt.x}deg) rotateY(${activeTilt.y}deg)`,
          ["--cube-half" as string]: `calc(${cubeSize} / 2)`,
        }}
      >
        {FACE_NAMES.map((faceName) => {
          const isVisible = showAllFaces || view.visibleFaces.includes(faceName);
          return (
            <div
              key={faceName}
              className={`absolute inset-0 flex items-center justify-center border border-zinc-300 bg-white shadow-[inset_0_0_16px_rgba(15,23,42,0.10)] dark:border-zinc-700 dark:bg-zinc-900 ${
                isVisible ? "opacity-100" : "opacity-25"
              }`}
              style={{
                transform: FACE_TRANSFORMS[faceName],
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
              }}
            >
              <img
                src={cube.faces[faceName]}
                alt=""
                className="h-[58%] w-[58%] object-contain"
                draggable={false}
                style={{
                  transform: `rotate(${relativeRotationDegrees(
                    cube.orientations[faceName],
                    baseOrientationsByImage?.[cube.faces[faceName]],
                  )}deg)`,
                }}
              />
              <TransparentDebugOverlay faceName={faceName} compact={compact} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
