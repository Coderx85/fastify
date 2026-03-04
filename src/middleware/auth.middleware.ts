import { db } from "@/db";
import { usersTable } from "@/db/schema";
import type { FastifyReply, FastifyRequest } from "fastify";

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    return;
  } catch (error) {
    console.error("Authentication error:", error);
    return reply.status(401).send({ error: "Unauthorized" });
  }
}

export async function getUser() {
  try {
    const [user] = await db.select().from(usersTable).limit(1);

    if (!user) {
      throw new Error("No user found", {
        cause: { code: "NOT_FOUND" },
      });
    }

    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error("Failed to fetch user");
  }
}
