import * as schema from "./schema";
import { config } from "@/lib/config";
import { neon, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzleWs } from "drizzle-orm/neon-serverless";

// Check if DATABASE_URL is configured
if (!config.DATABASE_URL) {
  console.error("DATABASE_URL is not configured!");
}

export async function db() {
  const sql = neon(config.DATABASE_URL);
  return drizzle(sql, { schema });
}

export async function dbPool() {
  const pool = new Pool({ connectionString: config.DATABASE_URL });
  return drizzleWs(pool, { schema });
}

// // Lazy database initialization - defer until first use
// let dbInstance: any = null;
// let dbPoolInstance: any = null;

// // Initialize the HTTP database client
// export async function initDb() {
//   if (dbInstance) return dbInstance;

//   const sql = neon(config.DATABASE_URL);
//   dbInstance = drizzle(sql, { schema });
//   return dbInstance;
// }

// // Initialize the WebSocket/pooled database client
// export async function initDbPool() {
//   if (dbPoolInstance) return dbPoolInstance;

//   const { Pool } = await import("@neondatabase/serverless");
//   const { drizzle: drizzleWs } = await import("drizzle-orm/neon-serverless");

//   const pool = new Pool({ connectionString: config.DATABASE_URL });
//   dbPoolInstance = drizzleWs(pool, { schema });
//   return dbPoolInstance;
// }

// // Synchronous getters (for backward compatibility with sync code)
// export function getDb() {
//   if (!dbInstance) {
//     // Fallback for sync calls - this shouldn't happen in normal operation
//     console.warn("Database not initialized, returning null");
//     return null;
//   }
//   return dbInstance;
// }

// export function getDbPool() {
//   if (!dbPoolInstance) {
//     console.warn("Database pool not initialized, returning null");
//     return null;
//   }
//   return dbPoolInstance;
// }

// // Export lazy-initialized instances for backward compatibility
// export const db = {
//   // Proxy pattern - methods will be called through async functions
//   async query(...args: any[]) {
//     const instance = await initDb();
//     return (instance as any).query(...args);
//   },
//   async select(...args: any[]) {
//     const instance = await initDb();
//     return (instance as any).select(...args);
//   },
//   async insert(...args: any[]) {
//     const instance = await initDb();
//     return (instance as any).insert(...args);
//   },
//   async update(...args: any[]) {
//     const instance = await initDb();
//     return (instance as any).update(...args);
//   },
//   async delete(...args: any[]) {
//     const instance = await initDb();
//     return (instance as any).delete(...args);
//   },
//   async batch(...args: any[]) {
//     const instance = await initDb();
//     return (instance as any).batch(...args);
//   },
//   async transaction(...args: any[]) {
//     const instance = await initDb();
//     return (instance as any).transaction(...args);
//   },
// } as any;

// export const dbPool = {
//   async query(...args: any[]) {
//     const instance = await initDbPool();
//     return (instance as any).query(...args);
//   },
//   async select(...args: any[]) {
//     const instance = await initDbPool();
//     return (instance as any).select(...args);
//   },
//   async insert(...args: any[]) {
//     const instance = await initDbPool();
//     return (instance as any).insert(...args);
//   },
//   async update(...args: any[]) {
//     const instance = await initDbPool();
//     return (instance as any).update(...args);
//   },
//   async delete(...args: any[]) {
//     const instance = await initDbPool();
//     return (instance as any).delete(...args);
//   },
//   async batch(...args: any[]) {
//     const instance = await initDbPool();
//     return (instance as any).batch(...args);
//   },
//   async transaction(...args: any[]) {
//     const instance = await initDbPool();
//     return (instance as any).transaction(...args);
//   },
// } as any;
