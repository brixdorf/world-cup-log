"use strict";

const API_BASE = "https://api.football-data.org/v4";

const upsertSql = `
  INSERT INTO matches
    (id, utc_date, status, stage, group_name, matchday,
     home_team, away_team, home_crest, away_crest,
     score_home, score_away, winner, last_fetched)
  VALUES
    (@id, @utc_date, @status, @stage, @group_name, @matchday,
     @home_team, @away_team, @home_crest, @away_crest,
     @score_home, @score_away, @winner, @last_fetched)
  ON CONFLICT(id) DO UPDATE SET
    status       = excluded.status,
    stage        = excluded.stage,
    group_name   = excluded.group_name,
    matchday     = excluded.matchday,
    home_team    = excluded.home_team,
    away_team    = excluded.away_team,
    home_crest   = excluded.home_crest,
    away_crest   = excluded.away_crest,
    score_home   = excluded.score_home,
    score_away   = excluded.score_away,
    winner       = excluded.winner,
    last_fetched = excluded.last_fetched
`;

function mapMatch(m, now) {
  return {
    id: m.id,
    utc_date: m.utcDate,
    status: m.status,
    stage: m.stage,
    group_name: m.group ?? null,
    matchday: m.matchday ?? null,
    home_team: m.homeTeam?.name ?? null,
    away_team: m.awayTeam?.name ?? null,
    home_crest: m.homeTeam?.crest ?? null,
    away_crest: m.awayTeam?.crest ?? null,
    score_home: m.score?.fullTime?.home ?? null,
    score_away: m.score?.fullTime?.away ?? null,
    winner: m.score?.winner ?? null,
    last_fetched: now,
  };
}

async function fetchAndStoreMatches(db) {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) throw new Error("FOOTBALL_DATA_API_KEY is not set");

  const res = await fetch(`${API_BASE}/competitions/WC/matches`, {
    headers: { "X-Auth-Token": apiKey },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`football-data.org ${res.status}: ${body}`);
  }

  const data = await res.json();
  const now = new Date().toISOString();

  const stmt = db.prepare(upsertSql);

  // db.transaction wraps all rows in one commit — much faster than 104 individual inserts
  db.transaction((matches) => {
    for (const m of matches) stmt.run(mapMatch(m, now));
  })(data.matches);

  return data.matches.length;
}

function hasLiveMatches(db) {
  const row = db
    .prepare(
      `SELECT 1 FROM matches WHERE status IN ('IN_PLAY','PAUSED') LIMIT 1`,
    )
    .get();
  return Boolean(row);
}

function hasSoonMatches(db) {
  // Any match starting within the next 90 minutes
  const soon = new Date(Date.now() + 90 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  const row = db
    .prepare(
      `SELECT 1 FROM matches
     WHERE status IN ('SCHEDULED','TIMED')
       AND utc_date BETWEEN ? AND ?
     LIMIT 1`,
    )
    .get(now, soon);
  return Boolean(row);
}

module.exports = { fetchAndStoreMatches, hasLiveMatches, hasSoonMatches };
