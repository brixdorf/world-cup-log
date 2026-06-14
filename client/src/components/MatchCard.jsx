import { useState, useRef, useEffect } from "react";

function formatTime(utcDate) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(utcDate));
}

function formatDate(utcDate) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
  }).format(new Date(utcDate));
}

const LIVE_STATUSES = new Set(["IN_PLAY", "PAUSED"]);
const DONE_STATUSES = new Set(["FINISHED"]);

function TeamCrest({ src, name }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) return null;
  return (
    <img
      src={src}
      alt={name || ""}
      onError={() => setErrored(true)}
      className="w-4 h-4 object-contain flex-shrink-0"
    />
  );
}

export default function MatchCard({ match, isLoggedIn, onUpdate }) {
  const {
    id,
    utc_date,
    status,
    stage,
    home_team,
    away_team,
    home_crest,
    away_crest,
    score_home,
    score_away,
    winner,
    highlights_watched,
    extended_highlights_watched,
    full_match_watched,
    note,
  } = match;

  const isLive = LIVE_STATUSES.has(status);
  const isFinished = DONE_STATUSES.has(status);

  const homeName = home_team || (stage !== "GROUP_STAGE" ? "TBD" : "?");
  const awayName = away_team || (stage !== "GROUP_STAGE" ? "TBD" : "?");

  const [editing, setEditing] = useState(false);
  const [noteText, setNoteText] = useState(note || "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setNoteText(note || "");
  }, [note]);

  function startEdit() {
    if (!isLoggedIn) return;
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function commitNote() {
    const trimmed = noteText.trim();
    if (trimmed === (note || "")) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onUpdate(id, { note: trimmed });
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function handleNoteKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitNote();
    }
    if (e.key === "Escape") {
      setNoteText(note || "");
      setEditing(false);
    }
  }

  async function toggleHighlights() {
    await onUpdate(id, { highlights_watched: !highlights_watched });
  }
  async function toggleExtended() {
    await onUpdate(id, {
      extended_highlights_watched: !extended_highlights_watched,
    });
  }
  async function toggleFullMatch() {
    await onUpdate(id, { full_match_watched: !full_match_watched });
  }

  const cardBorder = isLive
    ? "border-green-400/50 dark:border-green-600/40"
    : "border-gray-200 dark:border-neutral-800";

  return (
    <article
      className={`rounded-xl border p-3 space-y-2 bg-white dark:bg-neutral-900 transition-colors ${cardBorder}`}
    >
      {/* Date · time · status */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <span>
          {formatDate(utc_date)} · {formatTime(utc_date)}
        </span>
        {isFinished && (
          <span className="text-gray-400 dark:text-gray-600 font-medium">
            · FT
          </span>
        )}
        {isLive && (
          <span className="inline-flex items-center gap-1 text-green-500 font-semibold">
            ·{" "}
            <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-green-500" />{" "}
            LIVE
          </span>
        )}
      </div>

      {/* Teams + score */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          <span
            className={[
              "text-sm font-medium truncate text-right",
              isFinished && winner === "AWAY_TEAM"
                ? "text-gray-400 dark:text-gray-600"
                : "text-gray-900 dark:text-gray-100",
            ].join(" ")}
          >
            {homeName}
          </span>
          <TeamCrest src={home_crest} name={homeName} />
        </div>

        <div className="tabular font-display font-bold shrink-0 w-12 text-center">
          {isFinished || isLive ? (
            <span
              className={`text-base ${isLive ? "text-green-500" : "text-gray-900 dark:text-gray-100"}`}
            >
              {score_home ?? 0}
              <span className="text-gray-300 dark:text-neutral-700 mx-0.5">
                –
              </span>
              {score_away ?? 0}
            </span>
          ) : (
            <span className="text-xs font-normal text-gray-400 dark:text-gray-600">
              vs
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <TeamCrest src={away_crest} name={awayName} />
          <span
            className={[
              "text-sm font-medium truncate",
              isFinished && winner === "HOME_TEAM"
                ? "text-gray-400 dark:text-gray-600"
                : "text-gray-900 dark:text-gray-100",
            ].join(" ")}
          >
            {awayName}
          </span>
        </div>
      </div>

      {/* Controls — only for finished matches */}
      {isFinished && (
        <>
          {/* flex-wrap lets three checkboxes reflow on narrow cards */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-0.5">
            <label
              className={`flex items-center gap-1.5 text-xs select-none ${isLoggedIn ? "cursor-pointer" : "opacity-50"}`}
            >
              <input
                type="checkbox"
                checked={highlights_watched}
                onChange={isLoggedIn ? toggleHighlights : undefined}
                disabled={!isLoggedIn}
                className="w-3.5 h-3.5 accent-green-500"
              />
              <span className="text-gray-600 dark:text-gray-400">
                Highlights
              </span>
            </label>

            <label
              className={`flex items-center gap-1.5 text-xs select-none ${isLoggedIn ? "cursor-pointer" : "opacity-50"}`}
            >
              <input
                type="checkbox"
                checked={extended_highlights_watched}
                onChange={isLoggedIn ? toggleExtended : undefined}
                disabled={!isLoggedIn}
                className="w-3.5 h-3.5 accent-green-500"
              />
              <span className="text-gray-600 dark:text-gray-400">
                Extended Highlights
              </span>
            </label>

            <label
              className={`flex items-center gap-1.5 text-xs select-none ${isLoggedIn ? "cursor-pointer" : "opacity-50"}`}
            >
              <input
                type="checkbox"
                checked={full_match_watched}
                onChange={isLoggedIn ? toggleFullMatch : undefined}
                disabled={!isLoggedIn}
                className="w-3.5 h-3.5 accent-green-500"
              />
              <span className="text-gray-600 dark:text-gray-400">
                Full Match
              </span>
            </label>
          </div>

          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={noteText}
              maxLength={280}
              onChange={(e) => setNoteText(e.target.value)}
              onBlur={commitNote}
              onKeyDown={handleNoteKey}
              placeholder="Add a note…"
              className="w-full text-xs bg-gray-50 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-md px-2.5 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            />
          ) : (
            <div
              onClick={startEdit}
              title={isLoggedIn ? "Click to edit note" : undefined}
              className={[
                "text-xs min-h-[1.25rem]",
                isLoggedIn ? "cursor-text" : "",
                note
                  ? "text-gray-600 dark:text-gray-400"
                  : "text-gray-400 dark:text-gray-600 italic",
              ].join(" ")}
            >
              {saving ? "Saving…" : note || (isLoggedIn ? "Add a note…" : "")}
            </div>
          )}
        </>
      )}
    </article>
  );
}
