# Feature Tasks: Database Persistence Layer

**Branch**: `001-db-drizzle-pglite` | **Spec**: [spec.md](specs/001-db-drizzle-pglite/spec.md) | **Plan**: [plan.md](specs/001-db-drizzle-pglite/plan.md)

This file breaks down the implementation of the Database Persistence Layer feature into actionable tasks, organized by execution phase.

## Phase 1: Setup

These tasks set up the project dependencies and configuration.

- [ ] T001 Install required npm packages: `pnpm install drizzle-orm pglite`
- [ ] T002 Install development dependencies: `pnpm install -D drizzle-kit vitest`
- [ ] T003 Create Drizzle Kit configuration file in `src/db/drizzle.config.ts`

## Phase 2: Foundational Layer

These tasks create the core database schema and connection logic.

- [ ] T004 Create the database schema for users and posts in `src/db/schema.ts`
- [ ] T005 Create the Fastify plugin to initialize the database connection in `src/db/index.ts`
- [ ] T006 Integrate the database plugin into the main Fastify server in `src/server.ts`

## Phase 3: User Story 1 - Application Data Persistence

**Goal**: As a developer, I want the application to be able to save and retrieve data from a database so that information is not lost when the server restarts.

**Independent Test**: Can be tested by restarting the server and verifying that previously created data is still available through an API endpoint or a direct database query.

- [ ] T007 [US1] Refactor the user registration route to use the database in `src/routes/api/auth/register/handler.ts`
- [ ] T008 [US1] Refactor the user login route to retrieve user data from the database in `src/routes/api/auth/login/handler.ts`
- [ ] T009 [US1] Refactor the users API to perform CRUD operations on the database in `src/routes/api/users/index.ts`
- [ ] T010 [US1] Refactor the posts API to fetch posts from the database in `src/routes/api/posts/index.ts`
- [ ] T011 [US1] Remove the in-memory store logic from `src/lib/store.ts`

## Dependencies

- **User Story 1** depends on the completion of the **Foundational Layer**.
- The **Foundational Layer** depends on the completion of the **Setup** phase.

## Parallel Execution

- Within Phase 1, `T001` and `T002` can be run in parallel.
- Within Phase 3, tasks `T007`, `T008`, `T009`, and `T010` are largely independent and can be worked on in parallel after the foundational layer is complete.

## Implementation Strategy

The implementation will follow the phased approach outlined above. The MVP is the completion of all tasks, as this feature is foundational. Once all tasks are complete, the application will have a functioning persistence layer.
