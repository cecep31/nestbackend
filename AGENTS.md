# Repository Guidelines

## Project Structure & Module Organization
Nest code lives in `src/`, with feature modules grouped under `src/v1`, shared helpers under `src/common`, and adapters like database clients in `src/db`. Request filters, configs, and Prisma glue code (`src/filters`, `src/config`, `src/prisma.service.ts`) stay colocated to simplify dependency graphs. Database schemas and migrations reside in `prisma/` (`schema.prisma`, `prisma.config.ts`), while compiled artifacts go to `dist/`. Keep long-form docs (e.g., `README.md`, `api_doc.md`, agent guides) in the repo root so contributors can discover them quickly.

## Build, Test, and Development Commands
- `bun install` (or `npm install`): install dependencies before any build.
- `bun run start:dev`: start the Nest dev server with live reload via `nest start --watch`.
- `bun run build`: transpile TypeScript into `dist/` with `nest build`.
- `bun run start:prod`: run the compiled server (`node dist/src/main`).
- `bun run lint`: execute ESLint across `src`, `apps`, `libs`, and `test` folders with autofix enabled.
- `bun run test`, `test:watch`, `test:cov`, `test:e2e`: run Jest unit suites, watch mode, coverage, or end-to-end specs (`test/jest-e2e.json`).

## Coding Style & Naming Conventions
TypeScript sources use ESLint with `@typescript-eslint` recommended + project service aware type-checking. Favor 2-space indentation, single quotes, and trailing commas that align with Nest defaults. Export modules, providers, and DTOs with descriptive PascalCase names (`PostsModule`, `CreatePostDto`), while files use kebab-case (`create-post.dto.ts`). Avoid `any`; when needed, document why in code comments and add `@typescript-eslint/no-floating-promises` compliant `await`s. Keep configuration tokens in UPPER_SNAKE_CASE and place shared interfaces in `src/common`.

## Testing Guidelines
Unit tests co-locate next to implementations as `*.spec.ts`, while scenario tests sit in `test/app.e2e-spec.ts`. Use Jest's `describe`/`it` naming to mirror the API surface (`describe('ConversationsController')`). Target meaningful coverage with `bun run test:cov`; investigate gaps reported under `coverage/`. For e2e, boot the Nest application with the same Prisma connection as prod but point `.env` to a disposable database to avoid clobbering real data.

## Commit & Pull Request Guidelines
Commits follow Conventional Commits as seen in history (`feat(api): ...`, `build(deps): ...`). Scope your change to one concern, write imperative summaries under 80 chars, and add context in the body when touching data models or migrations. Pull requests should include: purpose summary, linked issue or ticket, test evidence (`bun run test` output, coverage deltas), and screenshots for any API contract or schema docs updated. Request reviewers who own the affected module and mention breaking changes in a dedicated section.

## Security & Configuration Tips
Never commit `.env` files; rely on `.env.example` for placeholders and document new keys there. Prisma migrations should be generated locally (`bunx prisma migrate dev`) and reviewed for destructive operations. When dealing with AI/agent credentials referenced in `CLAUDE.md`, `GEMINI.md`, or `QWEN.md`, store secrets in the platform’s secret manager rather than the repo, and gate any new environment variables through feature flags in `src/config`.
