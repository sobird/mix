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
- `bun run db:sync-catalog` — sync the code-defined permission and menu catalogs, then assign the first user as owner
- `bun run db:seed` — migrate + catalog sync + seed on `./database.sqlite`; idempotent; see Gotchas
- `bun run build:db-tools` — bundle `scripts/db-tools.ts` to `dist/db-tools.cjs` for the deploy host

Package manager is Bun (`bun.lock`); hooks run via `bunx`.

## Architecture

- Next.js 16 + React 19, all app source under `src/`. Middleware lives in `src/proxy.ts` (Next 16 replacement for `middleware.ts`); path alias `@/*` → `src/*`.
- Database is Sequelize 6 (SQLite at `./database.sqlite`, configured in `src/lib/sequelize.ts`, associations in `src/models/index.ts`). Schema is managed by umzug migrations in `src/migrations/` (run through `src/lib/migrator.ts`; executed names are recorded in the `sequelize_meta` table). `db:seed` is migrate + catalog sync + seed — it no longer calls `sync({ force: true })`.
- The dashboard layout (`src/app/dashboard/layout.tsx`) is an async RSC: it resolves the session user, then builds the sidebar from the global `menus` catalog merged with per-user `user_menu_preferences`, filtered by the CASL ability (`isAllowed`, strict — conditional grants do not reveal a menu).
- Dashboard/admin mutations (role/user/permission/menu) go through services (`src/services/{role,user,permission,menu,menu-preferences}.ts`); server actions keep zod validation, `revalidatePath`/`redirect`, and translate `ForbiddenError`/`NotFoundError` into action state. The public sign-up flow still calls `User.signUp` directly, and the next-auth adapter writes `User` rows through the model.
- Experimental routes live in `examples/routes/` and are excluded from tsconfig, oxlint, and oxfmt; the old `src/components/with-auth` HOC is gone.
- Auth is next-auth v4 with database sessions and a custom Sequelize adapter (`src/services/auth/adapter-sequelize.ts`).
- Runtime config is validated at startup: `src/lib/env.ts` parses the environment with zod and `src/instrumentation.ts` calls it when the server boots, so a production process missing `AUTH_SECRET`/`NEXTAUTH_URL` or incomplete mail settings fails immediately. `LOG_LEVEL` (`error|warn|info|debug`) sets log verbosity — strict in `env.ts` (an invalid value refuses to start) and lenient in `src/lib/logger.ts` (falls back to `info` in production, `debug` elsewhere, so Sequelize only logs SQL at `debug`).
- `/api/health` is the deploy liveness probe: it returns 503 when the database is unreachable, and `scripts/deploy.sh` repoints `current`, reloads pm2, then probes `/api/health` and rolls back to the previous release if it does not answer 200.
- Operations: `scripts/backup.sh` is the cron entry point for database snapshots, and restore steps live in `docs/operations.md`. Snapshots are pooled by purpose — `$APP_ROOT/backups/` holds manual/scheduled backups (keep 30) while `$APP_ROOT/backups/migrations/` holds pre-migration snapshots (keep 5) so migration pruning never trims daily backups.
- Authorization uses CASL 7; query conversion lives in `src/lib/casl.ts` (`toAccessQuery`, not the removed `rulesToCondition`). `isAllowed` lives in `src/services/ability/check.ts` and is re-exported from `src/services/ability/index.ts`.
- Form validation bridges zod 4 and antd via `src/zod/`; shared UI is antd 6 with SCSS modules.

## Testing

- Test files are named after the module under test (`src/services/user.ts` → `src/services/user.test.ts`); group multiple concerns with `describe` instead of splitting into topic-named files, and split only when a module's tests grow unwieldy.

## Gotchas

- `next-env.d.ts` is generated; never edit or commit it.
- DB-backed tests (`src/models/*.test.ts`, `src/actions/*.test.ts`) use an in-memory SQLite: `tests/setup.ts` mocks `@/lib/sequelize` (via `src/lib/__mocks__/sequelize.ts`) and repoints `storage` to `:memory:` before any connection is opened, so they never read the local `./database.sqlite`. Never touch `./database.sqlite` for tests and never run `db:seed` without asking: it writes to `./database.sqlite` (migrate + catalog sync + seed; idempotent, but re-running rewrites builtin-role grants and upgrades menus) — report schema/missing-table failures rather than reseeding.
- `next.config.ts` sets `typescript.ignoreBuildErrors`; run `bunx tsc --noEmit` to catch type errors the build hides.
- `src/lib/otp.ts` derives secrets as SHA-256 → Base32 because otplib 13 rejects raw identifiers.
- Turbopack requires `:global(.class)` (function form) in SCSS modules; Lightning CSS rejects the space form.

## Git

- Commit directly to `master`; no feature branches or PRs unless asked.
- Conventional commit messages are enforced by commitlint (`type: subject`, e.g. `chore: remove tsx and ts-node`).
- Pre-commit runs lint-staged (`oxlint --fix` + `oxfmt --no-error-on-unmatched-pattern` on staged files).
