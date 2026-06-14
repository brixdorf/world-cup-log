"use strict";

const express = require("express");
const { requireAuth } = require("../middleware/auth");

function makeRouter(db) {
  const router = express.Router();

  // GET /api/export — download personal layer as JSON (auth-gated)
  router.get("/export", requireAuth, (req, res) => {
    const rows = db.prepare("SELECT * FROM personal").all();

    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      personal: rows.map((r) => ({
        matchId: r.match_id,
        highlightsWatched: Boolean(r.highlights_watched),
        extendedHighlightsWatched: Boolean(r.extended_highlights_watched),
        fullMatchWatched: Boolean(r.full_match_watched),
        note: r.note,
        highlightsAt: r.highlights_at,
        extendedHighlightsAt: r.extended_highlights_at,
        fullMatchAt: r.full_match_at,
        updatedAt: r.updated_at,
      })),
    };

    res.json(payload);
  });

  // POST /api/import — restore from exported JSON (idempotent, auth-gated)
  // Backward-compatible: missing extendedHighlightsWatched/extendedHighlightsAt
  // in older export files is treated as 0/null — the row is still imported correctly.
  router.post("/import", requireAuth, (req, res) => {
    const { personal } = req.body || {};
    if (!Array.isArray(personal)) {
      return res
        .status(400)
        .json({ error: 'Body must have a "personal" array' });
    }

    const checkMatch = db.prepare("SELECT id FROM matches WHERE id = ?");

    const upsert = db.prepare(`
      INSERT INTO personal
        (match_id, highlights_watched, extended_highlights_watched, full_match_watched,
         note, highlights_at, extended_highlights_at, full_match_at, updated_at)
      VALUES
        (@matchId, @hl, @ehl, @fm, @note, @hlAt, @ehlAt, @fmAt, @updatedAt)
      ON CONFLICT(match_id) DO UPDATE SET
        highlights_watched          = excluded.highlights_watched,
        extended_highlights_watched = excluded.extended_highlights_watched,
        full_match_watched          = excluded.full_match_watched,
        note                        = excluded.note,
        highlights_at               = excluded.highlights_at,
        extended_highlights_at      = excluded.extended_highlights_at,
        full_match_at               = excluded.full_match_at,
        updated_at                  = excluded.updated_at
    `);

    let imported = 0;
    let skipped = 0;

    db.transaction((items) => {
      for (const item of items) {
        if (!checkMatch.get(item.matchId)) {
          skipped++;
          continue;
        }
        upsert.run({
          matchId: item.matchId,
          hl: item.highlightsWatched ? 1 : 0,
          ehl: item.extendedHighlightsWatched ? 1 : 0, // 0 when field absent (old export)
          fm: item.fullMatchWatched ? 1 : 0,
          note: item.note || null,
          hlAt: item.highlightsAt || null,
          ehlAt: item.extendedHighlightsAt || null, // null when field absent (old export)
          fmAt: item.fullMatchAt || null,
          updatedAt: item.updatedAt || new Date().toISOString(),
        });
        imported++;
      }
    })(personal);

    res.json({ ok: true, imported, skipped });
  });

  return router;
}

module.exports = makeRouter;
