interface ProgressBarProps {
  current: number;
  total: number;
  score?: number; // Optional score for practice mode
}

export default function ProgressBar({ current, total, score }: ProgressBarProps) {
  const progress = (current / total) * 100;

  return (
    <div className="mb-6">
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
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-violet-600 transition-all duration-300 ease-in-out dark:bg-violet-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
