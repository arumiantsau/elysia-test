import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import * as schema from './schema'
import path from 'node:path'
import fs from 'node:fs'

let db: ReturnType<typeof drizzle> | null = null

export const createDatabase = async () => {
  if (db) return db

  // Ensure data directory exists
  const dataDir = path.resolve(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const dbPath = path.resolve(dataDir, 'database.sqlite')
  
  // Use Bun's built-in SQLite instead of better-sqlite3
  const sqlite = new Database(dbPath)
  
  db = drizzle(sqlite, { schema })
  
  // Run migrations automatically
  const migrationsDir = path.resolve(__dirname, 'migrations')
  if (fs.existsSync(migrationsDir)) {
    await migrate(db, { migrationsFolder: migrationsDir })
  }
  
  return db
}

export const createTestDatabase = async () => {
  // Create unique test database path using timestamp and random string
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  const testDir = path.resolve(process.cwd(), 'data', 'test')
  
  // Ensure test directory exists
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true })
  }
  
  const testDbPath = path.resolve(testDir, `test-${timestamp}-${random}.sqlite`)
  
  // Create test database instance
  const sqlite = new Database(testDbPath)
  const testDb = drizzle(sqlite, { schema })
  
  // Run migrations on test database
  const migrationsDir = path.resolve(__dirname, 'migrations')
  if (fs.existsSync(migrationsDir)) {
    await migrate(testDb, { migrationsFolder: migrationsDir })
  }
  
  return testDb
}

export const cleanupTestDatabase = (testDb: ReturnType<typeof drizzle>) => {
  try {
    // Close the database connection
    if (testDb && typeof testDb === 'object' && 'run' in testDb) {
      const dbWithSession = testDb as { _: { session?: { close?: () => void } } }
      dbWithSession._.session?.close?.()
    }
  } catch (error) {
    console.warn('Warning: Could not properly close test database:', error)
  }
}

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call createDatabase() first.')
  }
  return db
}

export type DrizzleDatabase = ReturnType<typeof createDatabase>