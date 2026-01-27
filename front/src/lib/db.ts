import { createClient, type Client } from '@libsql/client';

let db: Client | null = null;

export function getDb(): Client {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error('Database URL not configured. Set TURSO_DATABASE_URL or DATABASE_URL environment variable.');
    }

    db = createClient({
      url,
      authToken,
    });
  }
  return db;
}

export async function initializeDatabase(): Promise<void> {
  const client = getDb();

  // Create workout templates table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS workout_templates (
      id TEXT PRIMARY KEY,
      sport TEXT NOT NULL,
      name TEXT NOT NULL,
      steps TEXT NOT NULL,
      rpe INTEGER NOT NULL DEFAULT 5,
      notes TEXT,
      estimated_load REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT
    )
  `);

  // Create scheduled workouts table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS scheduled_workouts (
      scheduled_id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      workout_id TEXT,
      sport TEXT NOT NULL,
      name TEXT NOT NULL,
      steps TEXT NOT NULL,
      rpe INTEGER NOT NULL DEFAULT 5,
      notes TEXT,
      estimated_load REAL,
      created_at TEXT NOT NULL
    )
  `);

  // Create index on date for faster calendar queries
  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_date ON scheduled_workouts(date)
  `);

  // Create user zones table for custom HR, pace, and power zones
  await client.execute(`
    CREATE TABLE IF NOT EXISTS user_zones (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      type TEXT NOT NULL,
      zones TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, type)
    )
  `);
}

// Check if database is configured
export function isDatabaseConfigured(): boolean {
  return !!(process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL);
}
