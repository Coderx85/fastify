# [PROJECT_NAME] Constitution

<!-- Example: Spec Constitution, TaskFlow Constitution, etc. -->

## Core Principles

### [PRINCIPLE_1_NAME]

- Use pnpm for package management.
<!-- Example: I. Library-First -->

[PRINCIPLE_1_DESCRIPTION]
use file based approach for making routes.

```bash
  src/
    routes/
      healthz/
        index.ts
        handlers.ts
        index.test.ts
      users/
        index.ts
        handlers.ts
        index.test.ts
```

### [PRINCIPLE_2_NAME]

<!-- Example: II. Route Structure & Organization -->

Define each route in its own folder with the following structure:

[PRINCIPLE_2_DESCRIPTION]

- `index.ts`: defines the route path and method, and exports the handler functions.
- `handlers.ts`: contains the actual logic for handling requests.
- `index.test.ts`: includes tests for the route handlers.

### [PRINCIPLE_3_NAME]

<!-- Example: III. Type Safety & Validation -->

```bash
  src/
    schemas/
      users.ts
      products.ts
    routes/
      users/
        index.ts
      products/
        index.ts
```

[PRINCIPLE_3_DESCRIPTION]

<!-- Example:  -->

- for making and types safe api calls.
- use zod schema for request and response validation.
- import zod schema from `schemas` folder top any `routes/*/index.ts`.
- schemas should be defined in `src/schemas` folder.
- schema file name should be same as route folder name.
- example: for `src/routes/users/index.ts`, import schema from `src/schemas/users.ts`.

<!-- Example: TDD mandatory: Tests written → User approved → Tests fail → Then implement; Red-Green-Refactor cycle strictly enforced -->

### [PRINCIPLE_4_NAME]

<!-- Example: IV. Integration Testing -->

- Make integration tests for each route in its own test file `index.test.ts` inside route folder.
- Use vitest for testing framework.

[PRINCIPLE_4_DESCRIPTION]

<!-- Example: Focus areas requiring integration tests: New library contract tests, Contract changes, Inter-service communication, Shared schemas -->

- Integration tests should cover all possible scenarios for each route.
- Tests should be run in CI/CD pipeline before merging any PR.

### [PRINCIPLE_5_NAME]

<!-- Example: V. Observability, VI. Versioning & Breaking Changes, VII. Simplicity -->

[PRINCIPLE_5_DESCRIPTION]

<!-- Example: Text I/O ensures debuggability; Structured logging required; Or: MAJOR.MINOR.BUILD format; Or: Start simple, YAGNI principles -->

## [SECTION_2_NAME]

<!-- Example: Additional Constraints, Security Requirements, Performance Standards, etc. -->

[SECTION_2_CONTENT]

<!-- Example: Technology stack requirements, compliance standards, deployment policies, etc. -->

## [SECTION_3_NAME]

<!-- Example: Development Workflow, Review Process, Quality Gates, etc. -->

[SECTION_3_CONTENT]

<!-- Example: Code review requirements, testing gates, deployment approval process, etc. -->

## Governance

<!-- Example: Constitution supersedes all other practices; Amendments require documentation, approval, migration plan -->

[GOVERNANCE_RULES]

<!-- Example: All PRs/reviews must verify compliance; Complexity must be justified; Use [GUIDANCE_FILE] for runtime development guidance -->

**Version**: [CONSTITUTION_VERSION] | **Ratified**: [RATIFICATION_DATE] | **Last Amended**: [LAST_AMENDED_DATE]

<!-- Example: Version: 2.1.1 | Ratified: 2025-06-13 | Last Amended: 2025-07-16 -->
