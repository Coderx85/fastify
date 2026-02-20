# Fastify — E‑commerce Backend Service

A production‑style e‑commerce backend built with Fastify, Drizzle (Postgres/Neon), and first‑class integrations for payments (Polar + Razorpay). Implements products, orders, checkout, user auth, subscriptions, webhooks and test helpers so you can run a complete store locally or deploy to Vercel.

---

## 🚀 Quick overview

- Languages & framework: `TypeScript`, `Fastify`.
- Database: `Postgres` (Drizzle ORM + migrations). Works with Neon or local Postgres.
- Payments: Polar (sandbox/production) + Razorpay (server + client checkout flows).
- Tests: `vitest` (unit + route tests included).
- API collection: `bruno/` (ready-to-run requests).

---

## ✅ Features

- Product CRUD (`/api/products`)
- Order lifecycle + order-product join (`/api/order`)
- Provider‑agnostic checkout (`/api/payment/intent`) — Polar or Razorpay
- Razorpay: create order, verify signature, webhook handling
- Polar: checkout sessions, subscriptions, webhook handlers
- User auth (register / login) and subscription access checks
- DB schema + migrations (Drizzle)

---

## ▶️ Getting started (local)

Prerequisites: Node 18+, npm (or pnpm), Docker (optional for local DB).

1. Install dependencies

   ```bash
   npm install
   ```

2. Start a local database (optional but recommended)

   ```bash
   docker-compose up -d
   # example local Postgres connection: postgres://postgres:postgres@localhost:5432/postgres
   ```

3. Configure environment variables
   - Copy `.env.development.example` → `.env.development` (or create your own)
   - Required: `DATABASE_URL` (Neon or Postgres). Optional for payments: `POLAR_*`, `RAZORPAY_*`

4. Run development server

   ```bash
   npm run dev
   # server listens on PORT from config (default: 3000)
   ```

5. Run migrations

   ```bash
   npm run db -- migrate:up    # uses drizzle-kit (see drizzle.config.ts)
   ```

6. Run tests

   ```bash
   npm test
   ```

---

## 📋 Important environment variables

- `PORT` — HTTP port (default: `3000`)
- `DATABASE_URL` — Postgres/Neon connection (required for DB-backed mode)

Polar (optional)

- `POLAR_ACCESS_TOKEN`, `POLAR_ORGANIZATION_ID`, `POLAR_PRODUCT_ID`, `POLAR_WEBHOOK_SECRET`, `POLAR_SERVER` (`sandbox`|`production`)

Razorpay (optional)

- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_CURRENCY`

Checkout URLs

- `SUCCESS_URL`, `RETURN_URL` — used by checkout providers for redirects

(See `src/lib/config.ts` for full list and default values.)

---

## 🔌 API reference — main endpoints

Base path: `/api`

- Products
  - GET `/api/products` — list products
  - POST `/api/products` — create product
  - GET `/api/products/:id` — get product
  - PUT `/api/products/:id` — update product
  - DELETE `/api/products/:id` — delete product

- Orders
  - POST `/api/order` — create order with products
  - GET `/api/order` — list orders (filters supported)
  - GET `/api/order/:orderId` — get order + items
  - PUT `/api/order/:orderId` — update order (status, address)
  - DELETE `/api/order/:orderId` — delete order
  - POST `/api/order/:orderId/products` — add product to order
  - DELETE `/api/order/:orderId/products/:productId` — remove product

- Payments / Checkout
  - POST `/api/payment/intent` — provider‑agnostic checkout (Polar or Razorpay)
  - Razorpay routes: `/api/payment/razorpay/checkout`, `/api/payment/razorpay/verify`, `/api/payment/razorpay/webhook`
  - Polar routes: `/api/payment/polar/*` (checkout, customers, subscriptions, webhooks)

- Auth / Users
  - POST `/api/auth/register`
  - POST `/api/auth/login`
  - User endpoints under `/api/users`

- Webhooks
  - `/api/webhooks/polar` — Polar webhook receiver
  - `/api/payment/razorpay/webhook` — Razorpay webhook

- Misc
  - GET `/health` — health check

---

## Examples (curl)

Create a product

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Blue T-Shirt","description":"Nice tee","price":2500,"category":"Clothing"}'
```

Create an order

```bash
curl -X POST http://localhost:3000/api/order \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"shippingAddress":"123 Main St","products":[{"productId":101,"quantity":1}]}'
```

Create a Razorpay intent for an order

```bash
curl -X POST http://localhost:3000/api/payment/intent \
  -H "Content-Type: application/json" \
  -d '{"orderId":1,"provider":"razorpay","customerName":"Test","customerEmail":"a@b.com"}'
```

---

## 💳 Payment providers

- Polar: hosted checkout, subscriptions, webhooks. See `src/modules/payment/polar*` and `.doc/payment-workflow.md` for details.
- Razorpay: server API + client checkout implemented in `src/modules/payment/razorpay.service.ts` and `src/routes/api/payment/razorpay`.

Use sandbox/test keys for local testing.

---

## 🧪 Tests & samples

- Run unit & route tests: `npm test` (uses `.env.development`)
- Sample HTML checkout flows in `sample/` (Razorpay example included)
- API collection: `bruno/` (import into Bruno or Postman)

---

## 📦 Deployment

- Vercel: `npm run build:vercel` prepares the serverless bundle.
- Standard build: `npm run build` then `npm start`.

---

## 🛠️ Developer notes & next steps

- Auth is basic — add JWT/session roles for production
- Add inventory & stock checks before confirming orders
- Add background workers for long-running tasks (emails, refunds)
- Add rate limiting, monitoring and input sanitization for production

---

## 🙋‍♂️ Contributing

PRs welcome. Please add tests for new features and update API docs.

---

## ⚖️ License

No license specified in repository. Add a `LICENSE` file if you want to publish this project.

---

If you want, I can add example Postman/Insomnia export or a seed script next. 🔧
