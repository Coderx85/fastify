import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { users } from '../../lib/store.js';

interface LoginBody {
  email: string
  password: string
}

interface AuthContext {
  user?: { id: number; email: string }
  isAuthenticated: boolean
}

// Simple password hashing (for demo only)
const hashPassword = (password: string): string => Buffer.from(password).toString('base64')
const verifyPassword = (password: string, hash: string): boolean => hashPassword(password) === hash

export default async function loginRoute(fastify: FastifyInstance) {
  fastify.post<{ Body: LoginBody }>('/', async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    const { email, password } = request.body

    // Validate input
    if (!email || !password) {
      reply.status(400)
      return { status: 'error', message: 'Email and password required' }
    }

    // Find user
    const user = users.get(email)
    if (!user) {
      reply.status(401)
      return { status: 'error', message: 'Invalid credentials' }
    }

    // Verify password
    if (!verifyPassword(password, user.password)) {
      reply.status(401)
      return { status: 'error', message: 'Invalid credentials' }
    }

    // Return success with auth token
    const authContext: AuthContext = {
      user: { id: user.id, email: user.email },
      isAuthenticated: true
    }

    return {
      status: 'success',
      message: 'Login successful',
      data: {
        token: Buffer.from(JSON.stringify(authContext)).toString('base64'),
        user: { id: user.id, email: user.email }
      }
    }
  })
}