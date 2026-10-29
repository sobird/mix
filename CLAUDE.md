# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `bun run dev` — Next.js dev server (logs scoped by `DEBUG=app:*`)
- `bun run build` / `bun run start` — Turbopack build (do not add webpack config)
- `bun run test` — Vitest in watch mode; use `bunx vitest run` for a single pass, `bunx vitest run src/lib/otp.test.ts` for one file
- `bun run coverage` — tests with coverage
- `bun run lint` / `bun run lint:fix` — oxlint
- `bun run format` / `bun run format:check` — oxfmt
- `bun run db:migrate` — run pending umzug migrations (`001-baseline` creates all tables, `002-menu-preferences` reshapes menus)
- `bun run db:sync-catalog` — sync the code-defined permission catalog and assign the first user as owner
- `bun run db:seed` — migrate + catalog sync + seed on `./database.sqlite`; no `sync({ force: true })`, safe to re-run
- `bun run build:db-tools` — bundle `scripts/db-tools.ts` to `dist/db-tools.cjs` for the deploy host

Package manager is Bun (`bun.lock`); hooks run via `bunx`.

## Architecture

- Next.js 16 + React 19, all app source under `src/`. Middleware lives in `src/proxy.ts` (Next 16 replacement for `middleware.ts`); path alias `@/*` → `src/*`.
- Database is Sequelize 6 (SQLite at `./database.sqlite`, configured in `src/lib/sequelize.ts`, associations in `src/models/index.ts`). Schema is managed by umzug migrations in `src/migrations/` (run through `src/lib/migrator.ts`; executed names are recorded in the `sequelize_meta` table). `db:seed` is migrate + catalog sync + seed — it no longer calls `sync({ force: true })`.
- The dashboard layout (`src/app/dashboard/layout.tsx`) is an async RSC: it resolves the session user, then builds the sidebar from the global `menus` catalog merged with per-user `user_menu_preferences`, filtered by the CASL ability (`isAllowed`, strict — conditional grants do not reveal a menu).
- Mutations go through services (`src/services/{role,user,permission,menu,menu-preferences}.ts`); server actions keep zod validation, `revalidatePath`/`redirect`, and translate `ForbiddenError`/`NotFoundError` into action state.
- Experimental routes live in `examples/routes/` and are excluded from tsconfig, oxlint, and oxfmt; the old `src/components/with-auth` HOC is gone.
- Auth is next-auth v4 with database sessions and a custom Sequelize adapter (`src/services/auth/adapter-sequelize.ts`).
- Authorization uses CASL 7; query conversion lives in `src/lib/casl.ts` (`rulesToCondition`, not the removed `rulesToQuery`).
- Form validation bridges zod 4 and antd via `src/zod/`; shared UI is antd 6 with SCSS modules.

## Gotchas

- `next-env.d.ts` is generated; never edit or commit it.
- DB-backed tests (`src/models/*.test.ts`, `src/actions/*.test.ts`) read the local `database.sqlite`. Leave the DB alone: report schema/missing-table failures rather than reseeding. `db:seed` writes to `./database.sqlite` (migrate + catalog sync + seed; idempotent but destructive to local data) — get explicit confirmation before running it.
- `next.config.ts` sets `typescript.ignoreBuildErrors`; run `bunx tsc --noEmit` to catch type errors the build hides.
- `src/lib/otp.ts` derives secrets as SHA-256 → Base32 because otplib 13 rejects raw identifiers.
- Turbopack requires `:global(.class)` (function form) in SCSS modules; Lightning CSS rejects the space form.

## Git

- Commit directly to `master`; no feature branches or PRs unless asked.
- Conventional commit messages are enforced by commitlint (`type: subject`, e.g. `chore: remove tsx and ts-node`).
- Pre-commit runs lint-staged (`oxlint --fix` + `oxfmt --no-error-on-unmatched-pattern` on staged files).
