import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

interface CreateUserBody {
  name: string
  email: string
}

export default async function usersRoute(fastify: FastifyInstance) {
  // GET /api/users
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      status: 'success',
      data: [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
      ]
    }
  })

  // GET /api/users/:id
  fastify.get<{ Params: { id: string } }>('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params
    return {
      status: 'success',
      data: { id: parseInt(id), name: 'John Doe', email: 'john@example.com' }
    }
  })

  // POST /api/users
  fastify.post<{ Body: CreateUserBody }>('/', async (request: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply) => {
    const { name, email } = request.body
    return {
      status: 'created',
      data: { id: 4, name, email }
    }
  })
}
