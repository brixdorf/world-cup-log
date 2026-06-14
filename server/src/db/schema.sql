-- Match data from football-data.org. Disposable: always re-fetchable.
-- Upserted on each scheduled refresh; only status/score columns change mid-tournament.
CREATE TABLE
  IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY, -- football-data.org match ID
    utc_date TEXT NOT NULL, -- ISO 8601 UTC  e.g. "2026-06-13T14:00:00Z"
    status TEXT NOT NULL, -- SCHEDULED | TIMED | IN_PLAY | PAUSED | FINISHED | ...
    stage TEXT NOT NULL, -- GROUP_STAGE | LAST_32 | LAST_16 | QUARTER_FINALS | ...
    group_name TEXT, -- "GROUP_A" … "GROUP_L" — NULL for knockout rounds
    matchday INTEGER, -- 1, 2, 3 within group stage — NULL for knockout
    home_team TEXT, -- NULL when knockout opponent is undecided
    away_team TEXT,
    home_crest TEXT, -- SVG URL from the API
    away_crest TEXT,
    score_home INTEGER, -- NULL until the match is played
    score_away INTEGER,
    winner TEXT, -- HOME_TEAM | AWAY_TEAM | DRAW | NULL
    last_fetched TEXT NOT NULL -- ISO 8601 UTC — when this row was last written
  );

-- My personal layer. Irreplaceable. Keyed by football-data.org match ID.
-- Each column group is updated independently via ON CONFLICT ... DO UPDATE SET
-- so toggling one checkbox never touches the others or the note.
CREATE TABLE
  IF NOT EXISTS personal (
    match_id                    INTEGER PRIMARY KEY REFERENCES matches (id),
    highlights_watched          INTEGER NOT NULL DEFAULT 0,
    extended_highlights_watched INTEGER NOT NULL DEFAULT 0, -- "extended highlights" third watch type
    full_match_watched          INTEGER NOT NULL DEFAULT 0,
    note                        TEXT,
    highlights_at               TEXT, -- IST date "YYYY-MM-DD" set when ticked ON, cleared when OFF
    extended_highlights_at      TEXT, -- same — used solely for streak computation, never displayed
    full_match_at               TEXT, -- same
    updated_at                  TEXT NOT NULL DEFAULT (datetime ('now'))
  );
