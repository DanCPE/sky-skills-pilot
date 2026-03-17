"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface TimerProps {
  timeLimit: number; // Total time in seconds
  onTimeUp: () => void;
  isPaused?: boolean;
}

export default function Timer({
  timeLimit,
  onTimeUp,
  isPaused = false,
}: TimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  const timeLimitRef = useRef(timeLimit);

  // Keep refs in sync
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    timeLimitRef.current = timeLimit;
  }, [timeLimit]);

  // Reset timer when timeLimit changes
  useEffect(() => {
    setTimeRemaining(timeLimit);
  }, [timeLimit]);

  // Memoized cleanup function
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Timer interval - only depends on isPaused
  useEffect(() => {
    // Clear any existing interval
    clearTimer();

    // Don't start if paused
    if (isPaused) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          onTimeUpRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [isPaused, clearTimer]);

  // Format time as MM:SS
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // Determine color based on time remaining
  const getTimeColor = () => {
    const ratio = timeRemaining / timeLimit;
    if (ratio > 0.4) {
      return "text-green-600 dark:text-green-400";
    } else if (ratio > 0.2) {
      return "text-yellow-600 dark:text-yellow-400";
    } else {
      return "text-red-600 dark:text-red-400";
    }
  };

  return (
    <div className="mb-6 flex flex-col items-center gap-2 rounded-lg bg-zinc-100 px-4 dark:bg-zinc-800">
      <div className="flex items-center gap-2">
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Time Remaining
        </span>
      </div>
      <span
        className={`text-2xl font-bold font-[family-name:var(--font-space-grotesk)] ${getTimeColor()}`}
      >
        {formattedTime}
      </span>
    </div>
  );
}
