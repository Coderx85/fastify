# Feature: Fix Logging Configuration

## Phase 1: Setup
- [X] T001 Verify `pino-pretty` is installed as a dev dependency in `package.json`

## Phase 2: Foundational
- [X] T002 Verify `src/index.ts` exists and contains logger configuration

## Phase 3: Fix Environment-Aware Logging
**Goal**: Ensure the application starts correctly in all environments by configuring the logger transport dynamically.

- [X] T003 [US1] Update `src/index.ts` to define `isProduction` constant based on `NODE_ENV`
- [X] T004 [US1] Implement conditional transport logic in `src/index.ts` to use `pino-pretty` only in non-production environments

## Phase 4: Polish & Verification
- [X] T005 Verify server starts in development mode (`npm run dev` - verified via direct tsx execution)
- [X] T006 Verify server starts in production mode (simulate by setting `NODE_ENV=production`)
- [X] T007 Fix `dev` script in `package.json` to use `tsx` (was failing with "Cannot find module")

## Dependencies
US1 (Fix Logging) -> Polish

## Implementation Strategy
Direct fix in `src/index.ts` to resolve the production crash caused by missing `pino-pretty` dependency.
