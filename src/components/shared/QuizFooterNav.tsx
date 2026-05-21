"use client";

interface QuizFooterNavProps {
  onExit: () => void;
  /** Show Previous button when provided */
  onPrevious?: () => void;
  previousDisabled?: boolean;
  /** Show Skip button when provided */
  onSkip?: () => void;
  /** Show Next button when provided */
  onNext?: () => void;
  nextDisabled?: boolean;
}

export default function QuizFooterNav({
  onExit,
  onPrevious,
  previousDisabled = false,
  onSkip,
  onNext,
  nextDisabled = false,
}: QuizFooterNavProps) {
  const hasRightButtons = onSkip || onNext;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-1 gap-3">
        {/* Exit */}
        <button
          onClick={onExit}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-200 hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Exit
        </button>

        {/* Previous */}
        {onPrevious && (
          <button
            onClick={onPrevious}
            disabled={previousDisabled}
            className="rounded-xl border border-[#E0E0E0] bg-white px-8 py-3 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            Previous
          </button>
        )}

        {/* Spacer */}
        {hasRightButtons && <div className="flex-1" />}

        {/* Skip */}
        {onSkip && (
          <button
            onClick={onSkip}
            className="rounded-xl border border-[#E0E0E0] bg-white px-10 py-3 text-sm font-bold text-zinc-700 transition-all hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            Skip
          </button>
        )}

        {/* Next */}
        {onNext && (
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className="rounded-xl bg-[#4F12A6] px-12 py-3 text-sm font-bold text-white shadow-lg shadow-[#4F12A6]/20 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
