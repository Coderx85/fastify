import Fastify from 'fastify'

const fastify = Fastify({ logger: true })

// Declare a route
fastify.get('/', async function handler (request, reply) {
  reply.type('text/html')
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fastify on Vercel</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: linear-gradient(135deg, #000 0%, #111 100%);
          color: #fff;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          text-align: center;
          max-width: 600px;
          padding: 2rem;
        }
        .logo {
          width: 120px;
          height: 120px;
          border-radius: 12px;
          margin: 0 auto 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.5rem;
        }
        h1 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: white;
        }
        p {
          font-size: 1.125rem;
          color: #888;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-top: 2rem;
        }
        .feature {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
          backdrop-filter: blur(10px);
        }
        .feature h3 {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .feature a {
          font-size: 1rem;
          color: white;
          margin: 0;
          text-decoration: none;
        }
        .feature a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <img src="https://api-frameworks.vercel.sh/framework-logos/fastify-dark.svg" alt="Fastify logo" class="logo" />
        <h1>Welcome to Fastify</h1>
        <p>A fast and low overhead web framework running on Vercel</p>
        <div class="features">
          <div class="feature">
            <a href="https://vercel.com/docs/frameworks/backend/fastify" target="_blank" rel="noreferrer">Vercel docs</a>
          </div>
          <div class="feature">
            <a href="https://fastify.dev" target="_blank" rel="noreferrer">Fastify docs</a>
          </div>
        </div>
      </div>
    </body>
    </html>
    `
})

// Dashboard page
fastify.get('/dashboard', async function (request, reply) {
  reply.type('text/html')
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Dashboard</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 2rem;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          color: white;
          margin-bottom: 2rem;
          font-size: 2.5rem;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
        }
        .card:hover {
          transform: translateY(-5px);
        }
        .card h2 {
          color: #667eea;
          margin-bottom: 1rem;
          font-size: 1.5rem;
        }
        .card p {
          color: #666;
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        .endpoint {
          background: #f5f5f5;
          padding: 0.75rem;
          border-radius: 6px;
          margin: 0.5rem 0;
          font-family: monospace;
          font-size: 0.9rem;
          color: #333;
        }
        .method {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-weight: bold;
          margin-right: 0.5rem;
          font-size: 0.85rem;
        }
        .get { background: #61affe; color: white; }
        .post { background: #49cc90; color: white; }
        button {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          margin-top: 1rem;
          transition: background 0.3s ease;
        }
        button:hover {
          background: #764ba2;
        }
        .status {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-size: 0.85rem;
          margin-top: 1rem;
        }
        .status.healthy {
          background: #d4edda;
          color: #155724;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 API Dashboard</h1>
        <div class="grid">
          <div class="card">
            <h2>👥 Users API</h2>
            <p>Manage user data with these endpoints</p>
            <div class="endpoint"><span class="method get">GET</span>/api/users</div>
            <div class="endpoint"><span class="method get">GET</span>/api/users/:id</div>
            <div class="endpoint"><span class="method post">POST</span>/api/users</div>
            <button onclick="fetch('/api/users').then(r => r.json()).then(d => alert(JSON.stringify(d, null, 2)))">
              Test GET /api/users
            </button>
          </div>

          <div class="card">
            <h2>📝 Posts API</h2>
            <p>Retrieve blog posts and articles</p>
            <div class="endpoint"><span class="method get">GET</span>/api/posts</div>
            <button onclick="fetch('/api/posts').then(r => r.json()).then(d => alert(JSON.stringify(d, null, 2)))">
              Test GET /api/posts
            </button>
          </div>

          <div class="card">
            <h2>💚 Health Check</h2>
            <p>Monitor server status and uptime</p>
            <div class="endpoint"><span class="method get">GET</span>/api/health</div>
            <button onclick="fetch('/api/health').then(r => r.json()).then(d => alert(JSON.stringify(d, null, 2)))">
              Test GET /api/health
            </button>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
})

// Dummy APIs
fastify.get('/api/users', async function (request, reply) {
  return {
    status: 'success',
    data: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
    ]
  }
})

fastify.get<{ Params: { id: string } }>('/api/users/:id', async function (request, reply) {
  const { id } = request.params
  return {
    status: 'success',
    data: { id: parseInt(id), name: 'John Doe', email: 'john@example.com' }
  }
})

fastify.post<{ Body: { name: string; email: string } }>('/api/users', async function (request, reply) {
  const { name, email } = request.body
  return {
    status: 'created',
    data: { id: 4, name, email }
  }
})

fastify.get('/api/posts', async function (request, reply) {
  return {
    status: 'success',
    data: [
      { id: 1, title: 'First Post', content: 'Hello World', author: 'John' },
      { id: 2, title: 'Second Post', content: 'Fastify is awesome', author: 'Jane' }
    ]
  }
})

fastify.get('/api/health', async function (request, reply) {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }
})

fastify.listen({ port: 3000 })
