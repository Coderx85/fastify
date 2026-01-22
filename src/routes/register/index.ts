import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { users, userState } from '../../lib/store.js';

interface RegisterBody {
  email: string
  password: string
}

// Simple password hashing (for demo only)
const hashPassword = (password: string): string => Buffer.from(password).toString('base64')

export default async function registerRoute(fastify: FastifyInstance) {
  fastify.post<{ Body: RegisterBody }>('/', async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    const { email, password } = request.body

    // Validate input
    if (!email || !password) {
      reply.status(400)
      return { status: 'error', message: 'Email and password required' }
    }

    // Check if user exists
    if (users.has(email)) {
      reply.status(409)
      return { status: 'error', message: 'User already exists' }
    }

    // Create user
    const userId = userState.idCounter++
    const hashedPassword = hashPassword(password)
    users.set(email, { id: userId, email, password: hashedPassword })

    // Return success with user data
    return {
      status: 'success',
      message: 'User registered successfully',
      data: { id: userId, email }
    }
  })
}