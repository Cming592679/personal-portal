import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { getDataPath } from './data-dir';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = getDataPath('portal.db');
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    -- Career Quadrant
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      quadrant TEXT DEFAULT 'career' CHECK(quadrant IN ('mental','career','body','spirit')),
      status TEXT DEFAULT 'todo' CHECK(status IN ('todo','doing','done')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
      project_id INTEGER,
      due_date TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS task_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      task_title TEXT DEFAULT '',
      action TEXT NOT NULL CHECK(action IN ('created','status_change','note_update','deleted')),
      old_value TEXT DEFAULT '',
      new_value TEXT DEFAULT '',
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active','archived','completed')),
      color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      amount REAL NOT NULL,
      category TEXT DEFAULT 'other',
      note TEXT DEFAULT '',
      date TEXT NOT NULL
    );

    -- Mental Quadrant
    CREATE TABLE IF NOT EXISTS observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      who TEXT DEFAULT '',
      scenario TEXT DEFAULT '',
      problem TEXT NOT NULL,
      workaround TEXT DEFAULT '',
      willingness_to_pay TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    -- Physical Quadrant
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quadrant TEXT DEFAULT 'body' CHECK(quadrant IN ('mental','career','body','spirit')),
      frequency TEXT DEFAULT 'daily' CHECK(frequency IN ('daily','weekly')),
      target INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL REFERENCES habits(id),
      date TEXT NOT NULL,
      value INTEGER DEFAULT 1,
      UNIQUE(habit_id, date)
    );

    CREATE TABLE IF NOT EXISTS exercise_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      duration_min INTEGER DEFAULT 0,
      note TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS energy_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      level INTEGER NOT NULL CHECK(level BETWEEN 1 AND 5),
      note TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS body_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      weight REAL,
      sleep_hours REAL,
      note TEXT DEFAULT ''
    );

    -- Spirit Quadrant
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      tags TEXT DEFAULT '',
      birthday TEXT,
      last_contact TEXT,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS contact_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL REFERENCES contacts(id),
      date TEXT NOT NULL,
      summary TEXT DEFAULT ''
    );

    -- Cross-Quadrant
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('weekly','monthly')),
      period_start TEXT NOT NULL,
      keep_text TEXT DEFAULT '',
      problem_text TEXT DEFAULT '',
      try_text TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    -- Activity / Daily
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      task_id INTEGER,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  // Migration: add quadrant column to tasks if missing
  try { db.exec("ALTER TABLE tasks ADD COLUMN quadrant TEXT DEFAULT 'career' CHECK(quadrant IN ('mental','career','body','spirit'))"); } catch {}
  // Migration: add sort_order for drag-and-drop reordering
  try { db.exec("ALTER TABLE tasks ADD COLUMN sort_order INTEGER DEFAULT 0"); } catch {}
  // Migration: add updated_at / completed_at for task log tracking
  try { db.exec("ALTER TABLE tasks ADD COLUMN updated_at TEXT"); } catch {}
  try { db.exec("ALTER TABLE tasks ADD COLUMN completed_at TEXT"); } catch {}

  // Seed default habits if none exist
  const habitCount = db.prepare('SELECT COUNT(*) as count FROM habits').get() as { count: number };
  if (habitCount.count === 0) {
    const insert = db.prepare('INSERT INTO habits (name, quadrant, frequency, target) VALUES (?, ?, ?, ?)');
    insert.run('运动', 'body', 'daily', 1);
    insert.run('阅读', 'mental', 'daily', 1);
    insert.run('健康饮食', 'body', 'daily', 1);
    insert.run('早睡', 'body', 'daily', 1);
    insert.run('早起', 'body', 'daily', 1);
    insert.run('冥想', 'body', 'daily', 1);
  }
}
