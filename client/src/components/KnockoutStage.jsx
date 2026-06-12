import MatchCard from "./MatchCard";

const STAGE_ORDER = [
  "LAST_32",
  "LAST_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
];

const STAGE_LABELS = {
  LAST_32: "Round of 32",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-finals",
  SEMI_FINALS: "Semi-finals",
  THIRD_PLACE: "Third Place Playoff",
  FINAL: "Final",
};

// Matches id= attributes in StageNav.jsx
const STAGE_IDS = {
  LAST_32: "round-of-32",
  LAST_16: "round-of-16",
  QUARTER_FINALS: "quarter-finals",
  SEMI_FINALS: "semi-finals",
  THIRD_PLACE: "third-place-playoff",
  FINAL: "final",
};

function gridClass(count) {
  if (count <= 2) return "grid-cols-1";
  if (count <= 4) return "grid-cols-1 sm:grid-cols-2";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
}

export default function KnockoutStage({ matches, isLoggedIn, onUpdate }) {
  if (!matches.length) return null;

  const byStage = {};
  for (const m of matches) {
    if (!byStage[m.stage]) byStage[m.stage] = [];
    byStage[m.stage].push(m);
  }

  const stages = STAGE_ORDER.filter((s) => byStage[s]?.length);

  return (
    <section className="space-y-10">
      <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">
        Knockout Stage
      </h2>

      {stages.map((stage) => {
        const stageMatches = byStage[stage].sort(
          (a, b) => new Date(a.utc_date) - new Date(b.utc_date),
        );
        return (
          <div
            key={stage}
            id={STAGE_IDS[stage] || stage.toLowerCase()}
            className="scroll-mt-36 space-y-3"
          >
            <h3 className="font-display text-base font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {STAGE_LABELS[stage] || stage}
            </h3>
            <div className={`grid gap-3 ${gridClass(stageMatches.length)}`}>
              {stageMatches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  isLoggedIn={isLoggedIn}
                  onUpdate={onUpdate}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
