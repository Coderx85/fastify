import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { config } from "@/lib/config";

// Check if DATABASE_URL is configured
if (!config.DATABASE_URL) {
  console.error("DATABASE_URL is not configured!");
}

const sql = neon(config.DATABASE_URL);
export const db = drizzle(sql, { schema });
