import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export default async function healthRoute(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  })
}
