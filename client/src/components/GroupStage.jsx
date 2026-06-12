import MatchCard from "./MatchCard";

function formatGroup(raw) {
  // "GROUP_A" → "Group A"
  return raw ? raw.replace("GROUP_", "Group ") : raw;
}

export default function GroupStage({ matches, isLoggedIn, onUpdate }) {
  if (!matches.length) return null;

  // Build: { GROUP_A: { 1: [...], 2: [...], 3: [...] }, GROUP_B: ... }
  const byGroup = {};
  for (const m of matches) {
    const g = m.group_name || "UNKNOWN";
    const d = m.matchday || 1;
    if (!byGroup[g]) byGroup[g] = {};
    if (!byGroup[g][d]) byGroup[g][d] = [];
    byGroup[g][d].push(m);
  }

  const groups = Object.keys(byGroup).sort();
  const dayLabel = (d) => `Matchday ${d}`;

  return (
    <section id="group-stage" className="scroll-mt-36 space-y-10">
      <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">
        Group Stage
      </h2>

      {groups.map((group) => {
        const days = Object.keys(byGroup[group]).sort((a, b) => a - b);
        return (
          <div key={group} className="space-y-5">
            <h3 className="font-display text-base font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {formatGroup(group)}
            </h3>

            {days.map((day) => (
              <div key={day} className="space-y-3">
                <p className="text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-widest pl-0.5">
                  {dayLabel(day)}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {byGroup[group][day].map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      isLoggedIn={isLoggedIn}
                      onUpdate={onUpdate}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </section>
  );
}
