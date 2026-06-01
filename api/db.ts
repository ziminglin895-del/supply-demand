import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let db: Database.Database

export function getDb(): Database.Database {
  if (db) return db

  db = new Database(path.join(__dirname, '..', 'data.db'))

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('supply', 'demand')),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      ip_name TEXT NOT NULL DEFAULT '',
      time_start TEXT NOT NULL DEFAULT '',
      time_end TEXT NOT NULL DEFAULT '',
      contact TEXT NOT NULL DEFAULT '',
      ai_tags TEXT NOT NULL DEFAULT '[]',
      ai_summary TEXT NOT NULL DEFAULT '',
      ai_entities TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'matched', 'closed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supply_id INTEGER NOT NULL,
      demand_id INTEGER NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      reason TEXT NOT NULL DEFAULT '',
      match_details TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'rejected')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (supply_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (demand_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `)

  try { db.exec(`ALTER TABLE posts ADD COLUMN city TEXT NOT NULL DEFAULT ''`) } catch {}
  try { db.exec(`ALTER TABLE posts ADD COLUMN latitude REAL NOT NULL DEFAULT 0`) } catch {}
  try { db.exec(`ALTER TABLE posts ADD COLUMN longitude REAL NOT NULL DEFAULT 0`) } catch {}
  try { db.exec(`ALTER TABLE matches ADD COLUMN distance_km REAL NOT NULL DEFAULT 0`) } catch {}

  db.exec(`CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_posts_ip_name ON posts(ip_name)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_posts_city ON posts(city)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_matches_supply_id ON matches(supply_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_matches_demand_id ON matches(demand_id)`)

  return db
}

export default getDb