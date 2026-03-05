import { neon, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzleWs } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";
import { config } from "@/lib/config";

// Check if DATABASE_URL is configured
if (!config.DATABASE_URL) {
  console.error("DATABASE_URL is not configured!");
}

// Lazy-loaded database instances to avoid initialization errors in serverless environments
let _db: ReturnType<typeof drizzle> | null = null;
let _dbPool: ReturnType<typeof drizzleWs> | null = null;

// HTTP driver – fast for single, non-interactive queries
export function getDb() {
  if (!_db) {
    const sql = neon(config.DATABASE_URL);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

// WebSocket (pooled) driver – supports interactive transactions
export function getDbPool() {
  if (!_dbPool) {
    const pool = new Pool({ connectionString: config.DATABASE_URL });
    _dbPool = drizzleWs(pool, { schema });
  }
  return _dbPool;
}

// Backward compatibility exports
export const db = new Proxy({} as any, {
  get: (target, prop) => {
    return getDb()[prop as keyof typeof _db];
  },
});

export const dbPool = new Proxy({} as any, {
  get: (target, prop) => {
    return getDbPool()[prop as keyof typeof _dbPool];
  },
});
