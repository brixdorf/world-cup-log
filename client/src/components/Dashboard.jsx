function StatChip({ label, value, sub }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-4 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 flex-1 min-w-0">
      <span className="font-display text-3xl font-bold tabular leading-none text-gray-900 dark:text-gray-100">
        {value}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">
        {label}
      </span>
      {sub && (
        <span className="text-[11px] text-accent font-medium mt-0.5">
          {sub}
        </span>
      )}
    </div>
  );
}

function ProgressRow({ label, pct }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {label}
        </span>
        <span className="text-sm font-medium tabular text-gray-900 dark:text-gray-100">
          {pct}%
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard({ stats }) {
  if (!stats) return null;

  const {
    totalMatches,
    finishedMatches,
    highlightsWatched,
    fullMatchWatched,
    overallCompletionPct,
    groupCompletionPct,
    knockoutCompletionPct,
    currentStreak,
    longestStreak,
  } = stats;

  return (
    <section className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">
        My Journey
      </h2>

      {/* Stat chips */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        <StatChip
          label="Total matches"
          value={totalMatches}
          sub={`${finishedMatches} played`}
        />
        <StatChip label="Highlights watched" value={highlightsWatched} />
        <StatChip label="Full matches" value={fullMatchWatched} />
        <StatChip
          label="Streak"
          value={currentStreak}
          sub={
            currentStreak > 0
              ? `Best ${longestStreak}`
              : `Best ${longestStreak}`
          }
        />
      </div>

      {/* Progress bars */}
      <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 space-y-4">
        <ProgressRow label="Overall completion" pct={overallCompletionPct} />
        <ProgressRow label="Group stage" pct={groupCompletionPct} />
        <ProgressRow label="Knockout rounds" pct={knockoutCompletionPct} />
      </div>

      {/* Streak callout */}
      {longestStreak > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {currentStreak > 0 ? (
            <>
              Current streak:{" "}
              <span className="text-accent font-semibold">
                {currentStreak} {currentStreak === 1 ? "day" : "days"}
              </span>{" "}
              &mdash; longest:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {longestStreak} {longestStreak === 1 ? "day" : "days"}
              </span>
            </>
          ) : (
            <>
              Longest streak:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {longestStreak} {longestStreak === 1 ? "day" : "days"}
              </span>
            </>
          )}
        </p>
      )}
    </section>
  );
}
