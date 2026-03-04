# Copilot Instructions for Fastify E‑commerce Backend

This document helps any AI coding agent become productive quickly in this repository. You’ll find the big‑picture architecture, common patterns, developer workflows, and project‑specific conventions used throughout the codebase.

---

## 1. High‑level architecture

- **Fastify server** (`src/server.ts`) registers `routes/` via `@fastify/autoload`; each subfolder is an area of the API (`api`, `webhooks`, `checkout`, etc.).
- **Modules** (under `src/modules`) encapsulate business logic with a fixed structure:
  - `*.definition.ts` – types/interfaces (service & controller) and errors.
  - `*.service.ts` – implementation of the I\*Service interface.
  - any provider‑specific code lives alongside (e.g. `razorpay.service.ts`, `polar.service.ts`).
  - `index.ts` exports the public API of the module.
- **Routes** call controllers which in turn use service methods.
  - API routes use `routes/api/<feature>/index.ts` + `handler.ts` for logic; tests sit beside them (`index.spec.ts`).
  - Webhook routes are under `routes/webhooks` and simply forward to controller methods.
- **Schema** directory (`src/schema`) contains zod schemas used for request/response validation. Drizzle‑Zod helpers generate DB schemas (see `db/schema.ts`).
- **DB layer** uses Drizzle ORM with `src/db/schema.ts` defining tables and enums. Migrations are managed via `drizzle-kit` (see `drizzle.config.ts`).
- **Helpers** in `src/lib` provide cross‑cutting utilities (`response.ts`, `config.ts`, etc.).

Data flow example for a checkout: client POSTs to `/api/payment/initiate` → route schema validates → handler calls `paymentService.initiatePayment` → service chooses provider (Polar/Razorpay) → provider creates intent + returns metadata.

## 2. Module & service development workflow

Follow the workflow documented in `.github/instructions/workflow.instructions.md` when adding new features. Key points:

1. **Create module folder** under `src/modules/<feature>`. Use the `order`, `product`, or `payment` modules as templates.
2. **Write unit tests first** (`*.spec.ts`), mocking any external modules (database, other services).
3. Define interfaces & custom errors in `*.definition.ts`.
4. Implement business logic in `*.service.ts` and update module `index.ts` exports.
5. For API endpoints, also create `routes/api/<feature>` with `handler.ts`, `index.ts` and corresponding schema under `src/schema`.
6. Write route tests in `routes/api/<feature>/index.spec.ts`, mocking the module services.

Edge cases and multiple provider support are common in this codebase; tests should cover at least three edge cases per endpoint.

---

## 3. Project‑specific conventions

- **Response helpers**: use `sendSuccess`/`sendError` from `src/lib/response.ts` to standardize output. They accept `reply` as the last argument.
- **Type exports**: modules expose types via `export * from "./<file>"` patterns in `src/modules/<feature>/index.ts`.
- **Schema naming**: request/response schemas are named like `createOrderSchema`, `initiatePaymentSchema`; use zod + `successResponseSchema` helper from `src/types/api.ts`.
- **Configuration**: read from `src/lib/config.ts` using `zod` defaults; environment variables control DB and payment provider keys.
- **Tests**: use `vitest` with `assert` helper for route assertions (see product and payment tests). Use `app.inject()` from a server built with `buildServer()` (in `src/server.ts`). Reset mocks with `vi.clearAllMocks()` and close the server after each test.
- **Mock data**: put reusable constants in `test/*.test-helper.ts` files.

---

## 4. Common developer workflows

- **Install**: `npm install` (pnpm or yarn may work but repo uses npm). Dependencies include Fastify, Drizzle, Vitest.
- **Dev server**: `npm run dev` starts Fastify with hot reload; listens on `PORT` (default 3000).
- **Database**: start local Postgres via `docker-compose up -d` (see `docker-compose.yaml`). Migrate with `npm run db -- migrate:up` or `npm run db -- migrate:down`.
- **Tests**: `npm test` runs Vitest; individual files can be executed with `npm test -- path/to/file`.
- **Build**: `npm run build` compiles for production; `npm run build:vercel` adds serverless bundle.
- **Lint**: ESLint config in `eslint.config.ts`; run via `npm run lint` (if defined).

Debugging: breakpoints can be placed in TS source when running via `npm run dev`; Fastify logs to console.

---

## 5. Integration points & external dependencies

- **Payment providers**:
  - _Razorpay_: logic in `src/modules/payment/razorpay.service.ts` and `routes/api/payment/razorpay` files. Webhook signature checked via `RAZORPAY_WEBHOOK_SECRET`.
  - _Polar_: wrapper lives in `src/modules/payment/polar.service.ts`; webhook route `routes/webhooks/payment/polar.ts` receives validated payload.
- **Auth**: JWT based simple auth under `src/routes/api/auth`/`src/modules/users`; add middleware at route level when needed.
- **Bruno collection** (`bruno/` folder) contains ready‑to‑run HTTP requests used during development/testing.

---

## 6. Adding new features or endpoints

1. Add schema in `src/schema/<feature>.schema.ts` using `zod`. New types should be exported at bottom (e.g. `export type CreateOrderInput = z.infer<...>`).
2. Create route `routes/api/<feature>/index.ts` and `handler.ts` (controller style). Use the `ZodTypeProvider` pattern for validation.
3. Update `src/routes/index.ts` for any manual route registration if needed (autoload covers most).
4. Update tests accordingly.
5. Update README if endpoint is public; keep API reference section consistent.

---

## 7. Useful file references

- `src/modules/**` – business logic
- `src/routes/api/**` – HTTP endpoints and tests
- `src/schema/**` – validation schemas and DTOs
- `src/db/schema.ts` – Drizzle table definitions
- `.github/instructions/workflow.instructions.md` – detailed module/API workflow
- `README.md` – overall project description and example commands

---

## 8. Do's & don'ts for AI agents

- **Do** follow existing naming conventions exactly (`camelCase`, `PascalCase`, `snake_case` for DB columns).
- **Do** run `npm test` after making changes; failing tests often specify the missing implementation or incorrect schema.
- **Do** consult adjacent folders (e.g. look at `orders` when implementing similar functionality).
- **Do not** introduce runtime dependencies; new code should go into modules and routes, not stray scripts.
- **Do not** modify generated files like migrations manually unless necessary; use `drizzle-kit` commands.

---

If any part of the workflow or conventions isn't clear, ask for clarification before proceeding. Happy coding! Within this file, try to keep updates concise and close to the patterns described above.
