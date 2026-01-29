# Gemini Context: Fastify Project

This file serves as the primary context source for the Gemini AI agent working on this project. It outlines the project structure, technology stack, conventions, and operational guidelines.

## 1. Project Overview

This is a **Fastify** web server application written in **TypeScript**.
It provides a RESTful API with:

- **Authentication**: Registration and Login (currently in-memory).
- **Users API**: CRUD operations for user data.
- **Posts API**: Read-only blog posts.
- **Health Check**: System status endpoint.
- **Dashboard**: A server-side rendered HTML dashboard at `/dashboard` and `/`.

## 2. Technology Stack

- **Runtime**: Node.js
- **Framework**: [Fastify](https://fastify.dev/) (v5.6.1)
- **Language**: TypeScript (v5.8.3)
- **Module System**: ES Modules (`type: "module"` in `package.json`)

## 3. Project Structure

- `server.ts`: The main entry point. Currently contains all logic (routes, handlers, in-memory database, types).
- `package.json`: Dependency management.
- `tsconfig.json`: TypeScript configuration.
- `.gemini/`: Gemini agent configuration and context.

## 4. Key Conventions

- **Architecture**: Currently a monolith in `server.ts`. Future refactoring should aim to modularize routes and controllers.
- **Data Persistence**: Currently uses in-memory `Map` and arrays. _Note: Data is lost on server restart._
- **Authentication**: Custom implementation using simple base64 hashing (for demo purposes only).
- **Styling**: Server-side rendered HTML uses inline CSS within template literals.

## 5. Development Workflow

### Running the Server

Since `package.json` currently lacks a `scripts` section, the server is likely run using a TypeScript executor or by compiling first.
_Recommended approach:_

1.  Install dependencies: `npm install`
2.  Run with a TS loader (if available) or compile:
    ```bash
    npx tsc && node dist/server.js
    # OR if tsx/ts-node is available globally:
    # tsx server.ts
    ```

### Testing

- **Manual Testing**: Use the Dashboard at `/dashboard` which contains interactive "Test" buttons for APIs.
- **API Clients**: curl, Postman, or similar tools can be used against `http://localhost:3000`.

## 6. Future Roadmap / Tasks

- [ ] **Modularization**: Split `server.ts` into separate files for routes, plugins, and types.
- [ ] **Scripts**: Add `start`, `dev`, and `build` scripts to `package.json`.
- [ ] **Persistence**: Replace in-memory storage with a real database (e.g., SQLite, PostgreSQL).
- [ ] **Security**: Replace base64 hashing with robust hashing (e.g., bcrypt/argon2) and implement proper JWT handling.

## Recent Changes

- 007-payment-gateway: Added TypeScript 5.8.3 + Fastify 5.6.1, Drizzle ORM, PGlite

## Active Technologies
