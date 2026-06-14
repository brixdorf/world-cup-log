"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { fetchAndStoreMatches } = require("../services/footballData");

function computeStreaks(db) {
  // All distinct IST dates where any watch type was marked — union of all three date columns
  const rows = db.prepare(`
    SELECT highlights_at          AS date FROM personal
      WHERE highlights_watched = 1 AND highlights_at IS NOT NULL
    UNION
    SELECT extended_highlights_at AS date FROM personal
      WHERE extended_highlights_watched = 1 AND extended_highlights_at IS NOT NULL
    UNION
    SELECT full_match_at          AS date FROM personal
      WHERE full_match_watched = 1 AND full_match_at IS NOT NULL
    ORDER BY date ASC
  `).all();

  const dates = [...new Set(rows.map((r) => r.date))].sort();

  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round(
      (new Date(dates[i] + "T00:00:00Z") -
        new Date(dates[i - 1] + "T00:00:00Z")) /
        86400000,
    );
    if (diff === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  const fmt = { timeZone: "Asia/Kolkata" };
  const todayIST = new Intl.DateTimeFormat("en-CA", fmt).format(new Date());
  const yesterdayIST = new Intl.DateTimeFormat("en-CA", fmt).format(
    new Date(Date.now() - 86400000),
  );

  const lastDate = dates[dates.length - 1];
  let current = 0;

  if (lastDate === todayIST || lastDate === yesterdayIST) {
    current = 1;
    for (let i = dates.length - 2; i >= 0; i--) {
      const diff = Math.round(
        (new Date(dates[i + 1] + "T00:00:00Z") -
          new Date(dates[i] + "T00:00:00Z")) /
          86400000,
      );
      if (diff === 1) current++;
      else break;
    }
  }

  return { currentStreak: current, longestStreak: longest };
}

function makeRouter(db) {
  const router = express.Router();

  // GET /api/matches — all matches joined with personal layer
  router.get("/", (req, res) => {
    const rows = db.prepare(`
      SELECT
        m.id, m.utc_date, m.status, m.stage, m.group_name, m.matchday,
        m.home_team, m.away_team, m.home_crest, m.away_crest,
        m.score_home, m.score_away, m.winner, m.last_fetched,
        COALESCE(p.highlights_watched,          0) AS highlights_watched,
        COALESCE(p.extended_highlights_watched,  0) AS extended_highlights_watched,
        COALESCE(p.full_match_watched,           0) AS full_match_watched,
        p.note,
        p.updated_at AS personal_updated_at
      FROM matches m
      LEFT JOIN personal p ON p.match_id = m.id
      ORDER BY m.utc_date ASC
    `).all();

    const matches = rows.map((r) => ({
      ...r,
      highlights_watched:          Boolean(r.highlights_watched),
      extended_highlights_watched: Boolean(r.extended_highlights_watched),
      full_match_watched:          Boolean(r.full_match_watched),
    }));

    res.json(matches);
  });

  // GET /api/matches/dashboard — progress stats
  router.get("/dashboard", (req, res) => {
    const total    = db.prepare(`SELECT COUNT(*) AS n FROM matches`).get().n;
    const finished = db.prepare(`SELECT COUNT(*) AS n FROM matches WHERE status = 'FINISHED'`).get().n;

    // "Highlights watched": count a match once if highlights OR extended highlights seen
    const hlWatched = db.prepare(`
      SELECT COUNT(*) AS n FROM personal
      WHERE highlights_watched = 1 OR extended_highlights_watched = 1
    `).get().n;

    const fmWatched = db.prepare(
      `SELECT COUNT(*) AS n FROM personal WHERE full_match_watched = 1`,
    ).get().n;

    // "To Watch": finished matches with none of the three watch types ticked
    const toWatch = db.prepare(`
      SELECT COUNT(*) AS n
      FROM matches m
      LEFT JOIN personal p ON p.match_id = m.id
      WHERE m.status = 'FINISHED'
        AND COALESCE(p.highlights_watched,          0) = 0
        AND COALESCE(p.extended_highlights_watched,  0) = 0
        AND COALESCE(p.full_match_watched,           0) = 0
    `).get().n;

    // Overall completion: distinct finished matches where any watch type is ticked
    const watchedOverall = db.prepare(`
      SELECT COUNT(DISTINCT p.match_id) AS n
      FROM personal p JOIN matches m ON m.id = p.match_id
      WHERE m.status = 'FINISHED'
        AND (p.highlights_watched = 1 OR p.extended_highlights_watched = 1 OR p.full_match_watched = 1)
    `).get().n;

    const groupFinished = db.prepare(
      `SELECT COUNT(*) AS n FROM matches WHERE status = 'FINISHED' AND stage = 'GROUP_STAGE'`,
    ).get().n;

    const groupWatched = db.prepare(`
      SELECT COUNT(DISTINCT p.match_id) AS n
      FROM personal p JOIN matches m ON m.id = p.match_id
      WHERE m.stage = 'GROUP_STAGE' AND m.status = 'FINISHED'
        AND (p.highlights_watched = 1 OR p.extended_highlights_watched = 1 OR p.full_match_watched = 1)
    `).get().n;

    const knockoutFinished = db.prepare(
      `SELECT COUNT(*) AS n FROM matches WHERE status = 'FINISHED' AND stage != 'GROUP_STAGE'`,
    ).get().n;

    const knockoutWatched = db.prepare(`
      SELECT COUNT(DISTINCT p.match_id) AS n
      FROM personal p JOIN matches m ON m.id = p.match_id
      WHERE m.stage != 'GROUP_STAGE' AND m.status = 'FINISHED'
        AND (p.highlights_watched = 1 OR p.extended_highlights_watched = 1 OR p.full_match_watched = 1)
    `).get().n;

    const pct = (num, denom) =>
      denom === 0 ? 0 : Math.round((num / denom) * 100);

    const { currentStreak, longestStreak } = computeStreaks(db);

    res.json({
      totalMatches:          total,
      finishedMatches:       finished,
      highlightsWatched:     hlWatched,
      fullMatchWatched:      fmWatched,
      toWatch,
      overallCompletionPct:  pct(watchedOverall,   finished),
      groupCompletionPct:    pct(groupWatched,      groupFinished),
      knockoutCompletionPct: pct(knockoutWatched,   knockoutFinished),
      currentStreak,
      longestStreak,
    });
  });

  // POST /api/matches/refresh — manual trigger (auth-gated)
  router.post("/refresh", requireAuth, async (req, res) => {
    const count = await fetchAndStoreMatches(db);
    res.json({ ok: true, count });
  });

  return router;
}

module.exports = makeRouter;
