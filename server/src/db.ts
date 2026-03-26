import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(__dirname, "..", "data", "storm_reports.db");

// Ensure data directory exists
import fs from "fs";
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS hail_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT,
    size INTEGER,
    location TEXT,
    county TEXT,
    state TEXT,
    lat REAL,
    lon REAL,
    comments TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS wind_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT,
    speed INTEGER,
    location TEXT,
    county TEXT,
    state TEXT,
    lat REAL,
    lon REAL,
    comments TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_hail_date ON hail_reports(date);
  CREATE INDEX IF NOT EXISTS idx_hail_state ON hail_reports(state);
  CREATE INDEX IF NOT EXISTS idx_wind_date ON wind_reports(date);
  CREATE INDEX IF NOT EXISTS idx_wind_state ON wind_reports(state);
`);

export default db;
