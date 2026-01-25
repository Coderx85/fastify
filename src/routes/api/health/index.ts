import { FastifyInstance } from 'fastify'

export default async function healthRoute(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  })
}
