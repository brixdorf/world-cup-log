function StatChip({ label, value, sub, valueColor, subColor }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-4 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 w-full">
      <span
        className={`font-display text-3xl font-bold tabular leading-none ${valueColor ?? "text-gray-900 dark:text-gray-100"}`}
      >
        {value}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">
        {label}
      </span>
      {sub && (
        <span
          className={`text-[11px] mt-0.5 ${subColor ?? "text-gray-400 dark:text-gray-600"}`}
        >
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
    toWatch,
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

      {/*
        5 chips: grid-cols-2 on mobile (2+2, with Streak spanning both cols on row 3),
        grid-cols-5 on sm+ (all in one row).
      */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatChip
          label="Matches played"
          value={finishedMatches}
          sub={
            finishedMatches < totalMatches
              ? `of ${totalMatches}`
              : "Tournament Complete"
          }
          subColor={
            finishedMatches === totalMatches
              ? "text-green-600 dark:text-green-400"
              : undefined
          }
        />
        <StatChip
          label="To Watch"
          value={toWatch}
          valueColor="text-red-500 dark:text-red-400"
        />
        <StatChip
          label="Highlights watched"
          value={highlightsWatched}
          valueColor="text-green-600 dark:text-green-400"
        />
        <StatChip
          label="Full matches watched"
          value={fullMatchWatched}
          valueColor="text-green-600 dark:text-green-400"
        />
        {/* Streak spans both columns on mobile so it fills the row cleanly */}
        <div className="col-span-2 sm:col-span-1">
          <StatChip
            label="Streak"
            value={currentStreak}
            valueColor="text-accent"
            sub={`Best ${longestStreak}`}
          />
        </div>
      </div>

      {/* Progress bars */}
      <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 space-y-4">
        <ProgressRow label="Overall completion" pct={overallCompletionPct} />
        <ProgressRow label="Group stage" pct={groupCompletionPct} />
        <ProgressRow label="Knockout rounds" pct={knockoutCompletionPct} />
      </div>

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
