import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// Database path: /data/trello-clone.db in production, trello-clone.db locally
const dbPath = process.env.DATABASE_PATH ?? 'trello-clone.db';
const sqlite = new Database(dbPath);
export { sqlite };
export const db = drizzle(sqlite, { schema });

// Initialize database with schema
export function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      deleted_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL REFERENCES boards(id),
      title TEXT NOT NULL,
      description TEXT,
      position REAL NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL REFERENCES lists(id),
      title TEXT NOT NULL,
      position REAL NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
    CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id);
    CREATE INDEX IF NOT EXISTS idx_cards_list_id ON cards(list_id);
  `);
}

// Initialize on module load
initializeDatabase();
