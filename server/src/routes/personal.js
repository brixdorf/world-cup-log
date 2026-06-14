"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");

function getISTDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date(),
  );
}

function makeRouter(db) {
  const router = express.Router();

  // One prepared statement per updatable field group.
  // Each only touches its own columns — toggling one checkbox never overwrites another.

  const stmtHighlights = db.prepare(`
    INSERT INTO personal (match_id, highlights_watched, highlights_at, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(match_id) DO UPDATE SET
      highlights_watched = excluded.highlights_watched,
      highlights_at      = excluded.highlights_at,
      updated_at         = excluded.updated_at
  `);

  const stmtExtended = db.prepare(`
    INSERT INTO personal (match_id, extended_highlights_watched, extended_highlights_at, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(match_id) DO UPDATE SET
      extended_highlights_watched = excluded.extended_highlights_watched,
      extended_highlights_at      = excluded.extended_highlights_at,
      updated_at                  = excluded.updated_at
  `);

  const stmtFullMatch = db.prepare(`
    INSERT INTO personal (match_id, full_match_watched, full_match_at, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(match_id) DO UPDATE SET
      full_match_watched = excluded.full_match_watched,
      full_match_at      = excluded.full_match_at,
      updated_at         = excluded.updated_at
  `);

  const stmtNote = db.prepare(`
    INSERT INTO personal (match_id, note, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(match_id) DO UPDATE SET
      note       = excluded.note,
      updated_at = excluded.updated_at
  `);

  const stmtGet = db.prepare(`
    SELECT highlights_watched, extended_highlights_watched, full_match_watched,
           note, highlights_at, extended_highlights_at, full_match_at, updated_at
    FROM personal WHERE match_id = ?
  `);

  // PATCH /api/personal/:matchId
  router.patch("/:matchId", requireAuth, (req, res) => {
    const matchId = parseInt(req.params.matchId, 10);
    if (!Number.isFinite(matchId)) {
      return res.status(400).json({ error: "Invalid match ID" });
    }

    const match = db
      .prepare("SELECT id FROM matches WHERE id = ?")
      .get(matchId);
    if (!match) return res.status(404).json({ error: "Match not found" });

    const body = req.body || {};
    const istDate = getISTDate();

    if ("highlights_watched" in body) {
      const val = body.highlights_watched ? 1 : 0;
      stmtHighlights.run(matchId, val, val ? istDate : null);
    }

    if ("extended_highlights_watched" in body) {
      const val = body.extended_highlights_watched ? 1 : 0;
      stmtExtended.run(matchId, val, val ? istDate : null);
    }

    if ("full_match_watched" in body) {
      const val = body.full_match_watched ? 1 : 0;
      stmtFullMatch.run(matchId, val, val ? istDate : null);
    }

    if ("note" in body) {
      const note =
        typeof body.note === "string" ? body.note.trim() || null : null;
      stmtNote.run(matchId, note);
    }

    const row = stmtGet.get(matchId) || {
      highlights_watched: 0,
      extended_highlights_watched: 0,
      full_match_watched: 0,
      note: null,
      highlights_at: null,
      extended_highlights_at: null,
      full_match_at: null,
      updated_at: null,
    };

    res.json({
      ...row,
      highlights_watched: Boolean(row.highlights_watched),
      extended_highlights_watched: Boolean(row.extended_highlights_watched),
      full_match_watched: Boolean(row.full_match_watched),
    });
  });

  return router;
}

module.exports = makeRouter;
