import fp from "fastify-plugin";
import { PGlite } from "@electric-sql/pglite";
import { drizzle, PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";

export const db = drizzle(new PGlite(), { schema });
