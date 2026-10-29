# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `bun run dev` — Next.js dev server (logs scoped by `DEBUG=app:*`)
- `bun run build` / `bun run start` — Turbopack build (do not add webpack config)
- `bun run test` — Vitest in watch mode; use `bunx vitest run` for a single pass, `bunx vitest run src/lib/otp.test.ts` for one file
- `bun run coverage` — tests with coverage
- `bun run lint` / `bun run lint:fix` — oxlint
- `bun run format` / `bun run format:check` — oxfmt
- `bun run db:migrate` — run pending umzug migrations (baseline creates all tables)
- `bun run db:sync-catalog` — sync the code-defined permission catalog and assign the first user as owner
- `bun run db:seed` — migrate + catalog sync + seed on `./database.sqlite`; no `sync({ force: true })`, safe to re-run
- `bun run build:db-tools` — bundle `scripts/db-tools.ts` to `dist/db-tools.cjs` for the deploy host

Package manager is Bun (`bun.lock`); hooks run via `bunx`.

## Architecture

- Next.js 16 + React 19, all app source under `src/`. Middleware lives in `src/proxy.ts` (Next 16 replacement for `middleware.ts`); path alias `@/*` → `src/*`.
- Database is Sequelize 6 (SQLite at `./database.sqlite`, configured in `src/lib/sequelize.ts`, associations in `src/models/index.ts`). Schema is managed by umzug migrations in `src/migrations/` (run through `src/lib/migrator.ts`; executed names are recorded in the `sequelize_meta` table). `db:seed` is migrate + catalog sync + seed — it no longer calls `sync({ force: true })`.
- Auth is next-auth v4 with database sessions and a custom Sequelize adapter (`src/services/auth/adapter-sequelize.ts`).
- Authorization uses CASL 7; query conversion lives in `src/lib/casl.ts` (`rulesToCondition`, not the removed `rulesToQuery`).
- Form validation bridges zod 4 and antd via `src/zod/`; shared UI is antd 6 with SCSS modules.

## Gotchas

- `next-env.d.ts` is generated; never edit or commit it.
- DB-backed tests (`src/models/*.test.ts`, `src/actions/*.test.ts`) read the local `database.sqlite`. Leave the DB alone: report schema/missing-table failures rather than reseeding, and never run `db:seed` without explicit confirmation.
- `next.config.ts` sets `typescript.ignoreBuildErrors`; run `bunx tsc --noEmit` to catch type errors the build hides.
- `src/lib/otp.ts` derives secrets as SHA-256 → Base32 because otplib 13 rejects raw identifiers.
- Turbopack requires `:global(.class)` (function form) in SCSS modules; Lightning CSS rejects the space form.

## Git

- Commit directly to `master`; no feature branches or PRs unless asked.
- Conventional commit messages are enforced by commitlint (`type: subject`, e.g. `chore: remove tsx and ts-node`).
- Pre-commit runs lint-staged (`oxlint --fix` + `oxfmt` on staged files).
