"use client";

import React from "react";

interface CompassCircleProps {
  children: React.ReactNode;
  size?: "sm" | "lg";
  className?: string;
}

export default function CompassCircle({
  children,
  size = "lg",
  className = "",
}: CompassCircleProps) {
  const containerSize = size === "lg" ? "w-48 h-48" : "w-16 h-16";
  const labelOffset = size === "lg" ? "top-2" : "top-0";
  const fontSize = size === "lg" ? "text-xs" : "text-[8px]";
  const tickSize = size === "lg" ? "h-4" : "h-1.5";

  // Generate 16 ticks (every 22.5 degrees)
  const ticks = Array.from({ length: 16 }, (_, i) => i * 22.5);

  return (
    <div className={`relative rounded-full border-2 border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950/50 ${containerSize} ${className}`}>
      {/* Compass Ticks */}
      <div className="absolute inset-0">
        {ticks.map((deg) => (
          <div
            key={deg}
            className="absolute w-full h-full"
            style={{ transform: `rotate(${deg}deg)` }}
          >
            <div
              className={`mx-auto ${tickSize} ${
                deg % 90 === 0
                  ? "w-1 bg-white"
                  : deg % 45 === 0
                  ? "w-0.5 bg-zinc-300 dark:bg-zinc-400"
                  : "w-px bg-zinc-200 dark:bg-zinc-700"
              }`}
            ></div>
          </div>
        ))}
      </div>

      {/* Central Crosshair Grid */}
      <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
        <div className="absolute w-[95%] h-px bg-white"></div>
        <div className="absolute h-[95%] w-px bg-white"></div>
        <div className="absolute w-[95%] h-px bg-white rotate-45"></div>
        <div className="absolute w-[95%] h-px bg-white -rotate-45"></div>
      </div>

      <div className="relative z-10 w-full h-full flex items-center justify-center p-2">
        {children}
      </div>
    </div>
  );
}
