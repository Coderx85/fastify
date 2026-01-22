import { FastifyInstance } from 'fastify';

export default async function dashboardRoute(fastify: FastifyInstance) {
  fastify.get("/", async function (request, reply) {
    reply.type("text/html");
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
            <h2>🔐 Auth API</h2>
            <p>User authentication endpoints</p>
            <div class="endpoint"><span class="method post">POST</span>/auth/register</div>
            <div class="endpoint"><span class="method post">POST</span>/auth/login</div>
            <button onclick="testRegister()">Test Register</button>
            <button onclick="testLogin()">Test Login</button>
          </div>

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
    <script>
      function testRegister() {
        const email = prompt('Enter email:') || 'test' + Date.now() + '@example.com'
        const password = prompt('Enter password:') || 'password123'
        fetch('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        }).then(r => r.json()).then(d => alert(JSON.stringify(d, null, 2)))
      }
      function testLogin() {
        const email = prompt('Enter email:') || 'test@example.com'
        const password = prompt('Enter password:') || 'password123'
        fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        }).then(r => r.json()).then(d => alert(JSON.stringify(d, null, 2)))
      }
    </script>
    `;
  });
}
