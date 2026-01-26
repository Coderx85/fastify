# Research: Drizzle ORM and PGlite Integration

**Date**: 2026-01-26
**Feature**: Database Persistence Layer

This document outlines the decisions and best practices for integrating Drizzle ORM with PGlite in the Fastify application.

## 1. Core Technology Choices

### Decision

-   **ORM/Query Builder**: Drizzle ORM will be used for all database interactions.
-   **Database Engine**: PGlite will be used as the in-process PostgreSQL database engine.

### Rationale

-   This stack was explicitly requested in the feature's input description.
-   **Drizzle ORM** provides a lightweight, type-safe query builder that aligns well with the existing TypeScript and Zod-based architecture.
-   **PGlite** offers a simple, zero-setup, in-process PostgreSQL database, which is ideal for local development and a self-contained application without the need for an external database server.

### Alternatives Considered

-   **SQLite with better-sqlite3**: Another excellent in-process database, but PGlite provides PostgreSQL compatibility, which is a more powerful and feature-rich SQL dialect.
-   **TypeORM or Prisma**: More feature-rich, "heavyweight" ORMs. Drizzle was chosen for its focus on performance and keeping the query layer closer to SQL.

## 2. Best Practices and Implementation Strategy

### A. Database Connection Management

-   **Connection Singleton**: A single, shared instance of the PGlite database client will be created and managed. This instance will be initialized once when the application starts.
-   **Fastify Plugin**: A Fastify plugin will be created to encapsulate the database initialization and attach the Drizzle ORM instance to the Fastify server instance (`fastify.decorate('db', drizzleInstance)`). This makes the database instance available in all route handlers via `request.server.db`.
-   **Graceful Shutdown**: The application's shutdown hook will be used to safely close the database connection when the server is stopped.

### B. Schema Definition

-   **Schema File**: A central schema file (`src/db/schema.ts`) will define all database tables, columns, and relationships using Drizzle's schema-building functions.
-   **Zod Integration**: Where possible, Drizzle's Zod integration (`createInsertSchema`, `createSelectSchema`) will be used to automatically generate Zod schemas from the database table definitions. This ensures that API validation stays in sync with the database schema. These generated schemas can be used in the Fastify route definitions.

### C. Migrations

-   **Initial Approach**: For the initial implementation, the schema will be created by running a script that drops and recreates tables on application startup (in a development environment).
-   **Future-Proofing**: The project will use `drizzle-kit` for managing schema migrations. A `drizzle.config.ts` file will be created. While automated migrations won't be run on every startup in production, the tooling will be in place to generate and apply SQL migration files as the schema evolves. This is a critical practice for managing production database changes without data loss.

### D. Data Access Layer

-   A dedicated directory (`src/db` or similar) will house all database-related code:
    -   `src/db/index.ts`: The Fastify plugin for DB connection.
    -   `src/db/schema.ts`: Drizzle table definitions.
    -   `src/db/drizzle.config.ts`: Configuration for `drizzle-kit`.