---
name: verify
description: Run the full check suite for this repo — oxlint, oxfmt check, tsc --noEmit, and a single-pass Vitest run. Use before reporting work complete or after multi-file changes.
---

Run these checks in order from the repo root and report each result faithfully:

1. `bunx oxlint` — lint
2. `bunx oxfmt --check` — formatting
3. `bunx tsc --noEmit` — types (the Next build ignores type errors, so this is the only type gate)
4. `bunx vitest run` — tests in a single pass (the `test` script is watch mode)

Notes:

- DB-backed tests read `./database.sqlite`. If failures are missing-table/schema errors, report them as environment issues. Do not run `bun run db:seed`; it wipes local data.
- Stop and fix real failures before saying the work is verified. If a check cannot run, say so explicitly.
