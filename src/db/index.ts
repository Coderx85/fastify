import { neon, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzleWs } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";
import { config } from "@/lib/config";

// Check if DATABASE_URL is configured
if (!config.DATABASE_URL) {
  console.error("DATABASE_URL is not configured!");
}

// HTTP driver – fast for single, non-interactive queries
const sql = neon(config.DATABASE_URL);
export const db = drizzle(sql, { schema });

// WebSocket (pooled) driver – supports interactive transactions
const pool = new Pool({ connectionString: config.DATABASE_URL });
export const dbPool = drizzleWs(pool, { schema });
