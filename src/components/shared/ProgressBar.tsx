interface ProgressBarProps {
  current: number;
  total: number;
  score?: number; // Optional score for real mode
  compact?: boolean; // Use compact style for sidebar
}

export default function ProgressBar({ current, total, score, compact = false }: ProgressBarProps) {
  const progress = (current / total) * 100;

  return (
    <div className={compact ? "w-full" : "mb-6"}>
      {!compact && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Question {current} of {total}
          </span>
          {score !== undefined && (
            <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
              Score: {score}%
            </span>
          )}
        </div>
      )}
      
      <div className={`w-full overflow-hidden rounded-full ${compact ? "h-2.5 bg-violet-100 dark:bg-zinc-800 mb-2.5" : "h-2 bg-zinc-200 dark:bg-zinc-800"}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ease-in-out ${compact ? "bg-violet-700 dark:bg-violet-500" : "bg-violet-600 dark:bg-violet-500"}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {compact && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] sm:text-xs font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
            PROGRESS: {Math.round(progress)}% COMPLETE
          </span>
          <span className="text-xs sm:text-sm font-bold text-violet-700 dark:text-violet-400">
            {current} of {total}
          </span>
        </div>
      )}
    </div>
  );
}
