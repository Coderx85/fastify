import * as schema from "./schema";
import { config } from "@/lib/config";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/node-postgres";

// Check if DATABASE_URL is configured
if (!config.DATABASE_URL) {
  console.error("DATABASE_URL is not configured!");
}

const pool = new Pool({ connectionString: config.DATABASE_URL });

export const db = drizzle(pool, { schema });