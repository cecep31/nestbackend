# Repository Guidelines

## Project Structure & Module Organization
Nest source lives under `src/`, with feature modules grouped in `src/v1`, shared helpers in `src/common`, and adapters such as Prisma clients in `src/db`. Request filters, configuration, and glue code stay in `src/filters`, `src/config`, and `src/prisma.service.ts`. Database schema and migration assets reside in `prisma/`, while compiled output goes to `dist/`. Keep e2e scenarios in `test/` and unit specs beside implementations as `*.spec.ts`. Long-form docs like `README.md` and `api_doc.md` remain at the repo root for quick discovery.

## Build, Test, and Development Commands
- `bun install`: install dependencies before running builds or tests.
- `bun run start:dev`: start the Nest dev server with live reload (`nest start --watch`).
- `bun run build`: transpile TypeScript to `dist/` via `nest build`.
- `bun run start:prod`: execute the compiled server (`node dist/src/main`).
- `bun run lint`: run ESLint with autofix across `src`, `apps`, `libs`, and `test`.
- `bun run test` / `test:watch` / `test:cov` / `test:e2e`: run Jest suites, watch mode, coverage, or end-to-end specs (`test/jest-e2e.json`).

## Coding Style & Naming Conventions
Follow the ESLint setup with `@typescript-eslint` rules, two-space indentation, single quotes, and trailing commas. Prefer strongly typed DTOs and avoid `any`; justify unavoidable cases with comments. Export modules, providers, and DTOs with descriptive PascalCase names (`PostsModule`, `CreatePostDto`), keep files in kebab-case, and place shared interfaces or guards inside `src/common`. Configuration tokens should use UPPER_SNAKE_CASE and live in dedicated config modules.

## Testing Guidelines
Jest drives both unit and e2e coverage. Co-locate unit specs as `*.spec.ts` near their sources and mirror controller/service names inside `describe` blocks. Use `bun run test:cov` to monitor meaningful coverage and investigate regressions reported under `coverage/`. End-to-end tests boot the Nest app against the Prisma connection; point `.env` to a disposable database before running `bun run test:e2e`.

## Commit & Pull Request Guidelines
Use Conventional Commits (`feat(api): ...`, `build(deps): ...`) with imperative summaries under 80 characters. Scope each change to a single concern and explain risky migrations or schema updates in the body. Pull requests should outline purpose, link issues, attach `bun run test` output (and coverage deltas when relevant), and include schema or API screenshots when contracts change.

## Security & Configuration Tips
Never commit `.env`; document new secrets in `.env.example` instead and load sensitive values from the platform secret manager. Generate and review Prisma migrations locally (`bunx prisma migrate dev`), watching for destructive statements. Gate new environment variables through feature flags in `src/config`, and keep AI/agent credentials referenced in `CLAUDE.md`, `GEMINI.md`, or `QWEN.md` outside the repo.
