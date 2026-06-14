import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

// Must stay in sync with the id= attributes on GroupStage / KnockoutStage sections
const STAGES = [
  { key: "GROUP_STAGE",    label: "Group Stage",    id: "group-stage"         },
  { key: "LAST_32",        label: "Round of 32",    id: "round-of-32"         },
  { key: "LAST_16",        label: "Round of 16",    id: "round-of-16"         },
  { key: "QUARTER_FINALS", label: "Quarter-finals", id: "quarter-finals"      },
  { key: "SEMI_FINALS",    label: "Semi-finals",    id: "semi-finals"         },
  { key: "THIRD_PLACE",    label: "3rd Place",      id: "third-place-playoff" },
  { key: "FINAL",          label: "Final",          id: "final"               },
];

const FILTERS = [
  { value: "all",     label: "All"       },
  { value: "played",  label: "Watched"   },
  { value: "towatch", label: "Unwatched" },
];

export default function StageNav({ matches, filter, onFilterChange }) {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 320);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const presentStages = new Set(matches.map((m) => m.stage));
  const visibleStages = STAGES.filter((s) => presentStages.has(s.key));

  function jumpTo(id) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <nav className="sticky top-14 z-30 bg-gray-50/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4">
          {/* Stage jump chips — horizontal scroll on mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar">
            {visibleStages.map((stage) => (
              <button
                key={stage.key}
                onClick={() => jumpTo(stage.id)}
                className="flex-shrink-0 text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-accent hover:text-white dark:hover:bg-accent dark:hover:text-white transition-colors"
              >
                {stage.label}
              </button>
            ))}
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-0.5 pb-2">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onFilterChange(value)}
                className={[
                  "text-xs px-3 py-1 rounded-full transition-colors",
                  filter === value
                    ? "bg-accent text-white font-medium"
                    : "text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-50 p-2.5 rounded-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all hover:shadow-xl"
        >
          <ArrowUp size={15} />
        </button>
      )}
    </>
  );
}
