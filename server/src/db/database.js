"use strict";

const path = require("path");
const Database = require("better-sqlite3");
const fs = require("fs");

let _db = null;

function initDb() {
  if (_db) return _db;

  const dbPath =
    process.env.DB_PATH ||
    path.join(__dirname, "..", "..", "data", "worldcuplog.db");

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  _db = new Database(dbPath);

  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  // Initial schema — includes all columns for fresh installs
  _db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id           INTEGER PRIMARY KEY,
      utc_date     TEXT    NOT NULL,
      status       TEXT    NOT NULL,
      stage        TEXT    NOT NULL,
      group_name   TEXT,
      matchday     INTEGER,
      home_team    TEXT,
      away_team    TEXT,
      home_crest   TEXT,
      away_crest   TEXT,
      score_home   INTEGER,
      score_away   INTEGER,
      winner       TEXT,
      last_fetched TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS personal (
      match_id                    INTEGER PRIMARY KEY REFERENCES matches(id),
      highlights_watched          INTEGER NOT NULL DEFAULT 0,
      extended_highlights_watched INTEGER NOT NULL DEFAULT 0,
      full_match_watched          INTEGER NOT NULL DEFAULT 0,
      note                        TEXT,
      highlights_at               TEXT,
      extended_highlights_at      TEXT,
      full_match_at               TEXT,
      updated_at                  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Additive migration for existing databases that predate the extended_highlights columns.
  // PRAGMA table_info returns one row per column; we check by name and only ALTER if absent.
  // Running this on a fresh DB (where CREATE TABLE already includes the columns) is a no-op.
  const existingCols = _db.pragma("table_info(personal)").map((c) => c.name);

  if (!existingCols.includes("extended_highlights_watched")) {
    _db.exec(
      "ALTER TABLE personal ADD COLUMN extended_highlights_watched INTEGER NOT NULL DEFAULT 0",
    );
  }
  if (!existingCols.includes("extended_highlights_at")) {
    _db.exec("ALTER TABLE personal ADD COLUMN extended_highlights_at TEXT");
  }

  return _db;
}

function getDb() {
  if (!_db) throw new Error("DB not initialised — call initDb() first");
  return _db;
}

module.exports = { initDb, getDb };
