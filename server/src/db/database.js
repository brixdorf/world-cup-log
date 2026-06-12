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

  // Ensure the data directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  _db = new Database(dbPath);

  // WAL mode: allows reads while a write is in progress (better for concurrent HTTP requests)
  _db.pragma("journal_mode = WAL");

  // Enforce foreign key constraints (SQLite disables them by default)
  _db.pragma("foreign_keys = ON");

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
      match_id           INTEGER PRIMARY KEY REFERENCES matches(id),
      highlights_watched INTEGER NOT NULL DEFAULT 0,
      full_match_watched INTEGER NOT NULL DEFAULT 0,
      note               TEXT,
      highlights_at      TEXT,
      full_match_at      TEXT,
      updated_at         TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return _db;
}

function getDb() {
  if (!_db) throw new Error("DB not initialised — call initDb() first");
  return _db;
}

module.exports = { initDb, getDb };
