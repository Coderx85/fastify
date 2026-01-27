import { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { posts, users } from "@/db/schema";
import { sendSuccess } from "@/lib/response";

export default async function postsRoute(fastify: FastifyInstance) {
  fastify.get("/", async (request, reply) => {
    const { db } = request.server;
    
    const allPosts = await db.select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      author: users.name,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id));

    sendSuccess(allPosts, "Posts retrieved successfully", reply, 200);
  });
}