import fp from "fastify-plugin";
import { PGlite } from "@electric-sql/pglite";
import { drizzle, PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";

export type DbClient = PgliteDatabase<typeof schema>;

declare module "fastify" {
  interface FastifyInstance {
    db: DbClient;
  }
}

export default fp(async (fastify, opts) => {
  const pglite = new PGlite();
  await pglite.waitReady;

  const db = drizzle(pglite, { schema });

  fastify.decorate("db", db);

  fastify.addHook("onClose", async (instance) => {
    await pglite.close();
  });
}, { name: "drizzle" });