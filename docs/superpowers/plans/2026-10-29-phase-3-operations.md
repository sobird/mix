# Phase 3 可运维性 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 启动即校验环境变量，用数据库探活替代宽泛的 4xx 健康检查，补齐日志分级、定时备份与恢复演练。

**Architecture:** `src/lib/env.ts` 用 zod 解析环境变量，由 `src/instrumentation.ts` 在 Node 运行时启动时触发；`/api/health` 查询数据库并返回 200/503，`deploy.sh` 只接受 200；`db-tools.cjs` 增加 `restore` 与备份保留策略，`scripts/backup.sh` 交给 cron 调用。

**Tech Stack:** Next.js 16（instrumentation / Route Handler）、zod 4、Sequelize 6 + SQLite、log4js、Bash、Vitest。

**Spec:** `docs/superpowers/specs/2026-10-29-architecture-baseline-design.md`

## Global Constraints

- Phase 0–2 已交付；服务器只有 node，部署脚本保持 Bash + `shellcheck`。
- 不新增依赖：`zod`、`log4js` 已在 `package.json`。
- 环境校验只在服务端启动时发生；不得让 `next build` 因缺少运行时密钥而失败。
- 数据库测试只用内存库；备份/恢复测试只用 `mkdtemp` 临时目录。
- 备份与恢复不得在失败时破坏现有 `database.sqlite`。
- `bunx tsc --noEmit`、`bunx vitest run`、`bun run lint`、`bun run format:check`、`shellcheck scripts/*.sh` 必须通过。

## Review Focus

1. 生产环境缺少密钥或 `NEXTAUTH_URL` → 启动时抛错，进程不进入服务状态。
2. 数据库不可用 → `/api/health` 返回 503，而不是 200。
3. 非法 `LOG_LEVEL` → 启动校验拒绝；直接调用日志解析时退回安全默认值。
4. 恢复文件不是 SQLite → 拒绝恢复，现有数据库保持不变。
5. 备份保留策略 → 只删除较旧文件，最新的备份始终保留。

---

### Task 1: 启动时环境变量校验

**Files:**

- Create: `src/lib/env.ts`
- Create: `src/instrumentation.ts`
- Test: `src/lib/env.test.ts`

**Interfaces:**

- Produces:
  - `interface AppEnv { nodeEnv: 'development' | 'test' | 'production'; authSecret: string; nextAuthUrl: string | null; email: { user: string; pass: string; from: string } | null; logLevel: 'error' | 'warn' | 'info' | 'debug' }`
  - `parseEnv(source: Record<string, string | undefined>): AppEnv`（不合法时抛 `Error`）
  - `loadEnv(source = process.env): AppEnv`（启动入口；懒执行，模块导入本身不校验）

- [ ] **Step 1: 写失败测试**

```ts
const base = {
  AUTH_SECRET: 'x'.repeat(32),
  NEXTAUTH_URL: 'https://mix.example.com',
  EMAIL_SERVER_USER: 'bot@mix.local',
  EMAIL_SERVER_PASS: 'secret',
  EMAIL_FROM: 'bot@mix.local',
};

it('parses a production environment', () => {
  const env = parseEnv({ ...base, NODE_ENV: 'production' });
  expect(env.nodeEnv).toBe('production');
  expect(env.logLevel).toBe('info');
  expect(env.email?.from).toBe('bot@mix.local');
});
it('defaults to debug logging in development', () => {
  expect(parseEnv({ AUTH_SECRET: 'x'.repeat(32), NODE_ENV: 'development' }).logLevel).toBe('debug');
});
it('rejects a missing or short secret', () => {
  expect(() => parseEnv({ NODE_ENV: 'development' })).toThrow();
  expect(() => parseEnv({ AUTH_SECRET: 'short', NODE_ENV: 'development' })).toThrow();
});
it('requires public url and mail settings in production', () => {
  expect(() => parseEnv({ ...base, NEXTAUTH_URL: undefined, NODE_ENV: 'production' })).toThrow();
  expect(() => parseEnv({ ...base, EMAIL_FROM: undefined, NODE_ENV: 'production' })).toThrow();
});
it('rejects an unknown log level', () => {
  expect(() => parseEnv({ ...base, LOG_LEVEL: 'verbose', NODE_ENV: 'production' })).toThrow();
});
it('requires both GitHub credentials when either is set', () => {
  expect(() => parseEnv({ ...base, AUTH_GITHUB_ID: 'id', NODE_ENV: 'production' })).toThrow();
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/lib/env.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现**

- `env.ts`：用 zod 定义 schema；`AUTH_SECRET` 取 `AUTH_SECRET || NEXTAUTH_SECRET` 并要求 `min(32)`；`NODE_ENV` 默认 `development`；`NEXTAUTH_URL` 在 `production` 必填且必须是合法 URL；`EMAIL_SERVER_USER/PASS/FROM` 在 `production` 必填，非生产要么全空要么全有；GitHub / Google 凭据成对出现；`LOG_LEVEL` 只允许四个等级，生产默认 `info`、其他默认 `debug`；`parseEnv` 把 zod 错误转成 `${path}: ${message}` 的 `Error`。
- `instrumentation.ts`：`export async function register()`，仅当 `process.env.NEXT_RUNTIME === 'nodejs'` 时 `const { loadEnv } = await import('./lib/env'); loadEnv();`，让校验在服务启动时执行而不是 `next build` 时执行。

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/lib/env.test.ts && bunx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/env.ts src/lib/env.test.ts src/instrumentation.ts
git commit -m "feat(env): validate environment at startup"
```

---

### Task 2: 数据库探活与部署健康检查

**Files:**

- Create: `src/app/api/health/route.ts`
- Test: `src/app/api/health/route.test.ts`
- Modify: `scripts/deploy.sh`

**Interfaces:**

- Produces:
  - `GET(): Promise<Response>`：数据库可用 → `200 { status: 'ok', db: 'up' }`；不可用 → `503 { status: 'error', db: 'down' }`
  - `deploy.sh` 的 `wait_healthy` 只接受 `status = 200`

- [ ] **Step 1: 写失败测试**

```ts
// @vitest-environment node
import { sequelize } from '@/lib/sequelize';

import { GET } from './route';

it('reports ok when the database answers', async () => {
  const response = await GET();
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toMatchObject({ status: 'ok', db: 'up' });
});
it('reports 503 when the database is down', async () => {
  vi.spyOn(sequelize, 'authenticate').mockRejectedValueOnce(new Error('down'));
  const response = await GET();
  expect(response.status).toBe(503);
  await expect(response.json()).resolves.toMatchObject({ status: 'error', db: 'down' });
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/app/api/health/route.test.ts`
Expected: FAIL（路由不存在）

- [ ] **Step 3: 实现**

- 路由：`export const dynamic = 'force-dynamic'`；`GET` 内 `try { await sequelize.authenticate(); return NextResponse.json({ status: 'ok', db: 'up' }); } catch { return NextResponse.json({ status: 'error', db: 'down' }, { status: 503 }); }`。
- `scripts/deploy.sh` 的 `wait_healthy`：
  1. URL 改为 `"http://127.0.0.1:$APP_PORT/api/health"`；
  2. 删除 `2?? | 3?? | 4??` 分支，改为 `if [ "$status" = "200" ]; then return 0; fi`；
  3. 保留 15 次、每次 2 秒的轮询与失败回滚逻辑。

- [ ] **Step 4: 运行测试与检查**

Run: `bunx vitest run src/app/api/health/route.test.ts && bash -n scripts/deploy.sh && shellcheck scripts/deploy.sh`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/app/api/health scripts/deploy.sh
git commit -m "feat(ops): health check database before switching releases"
```

---

### Task 3: 日志分级

**Files:**

- Create: `src/lib/logger.ts`
- Modify: `src/lib/sequelize.ts`
- Test: `src/lib/logger.test.ts`

**Interfaces:**

- Produces:
  - `type LogLevel = 'error' | 'warn' | 'info' | 'debug'`
  - `resolveLogLevel(source: Record<string, string | undefined>): LogLevel`

- [ ] **Step 1: 写失败测试**

```ts
it('uses LOG_LEVEL when valid', () => {
  expect(resolveLogLevel({ LOG_LEVEL: 'warn' })).toBe('warn');
});
it('defaults to info in production and debug elsewhere', () => {
  expect(resolveLogLevel({ NODE_ENV: 'production' })).toBe('info');
  expect(resolveLogLevel({ NODE_ENV: 'development' })).toBe('debug');
});
it('falls back instead of throwing on an invalid value', () => {
  expect(resolveLogLevel({ LOG_LEVEL: 'verbose', NODE_ENV: 'production' })).toBe('info');
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/lib/logger.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现**

- `logger.ts`：合法值直接返回；否则按 `NODE_ENV` 选 `info` / `debug`。
- `sequelize.ts`：`logger.level = resolveLogLevel(process.env)`（替换写死的 `log4js.levels.DEBUG`）；`logging` 回调保持不变，生产环境下 SQL 不再以 debug 输出。

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/lib/logger.test.ts && bunx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/logger.ts src/lib/logger.test.ts src/lib/sequelize.ts
git commit -m "feat(ops): make log level configurable"
```

---

### Task 4: 定时备份与恢复演练

**Files:**

- Modify: `src/services/backup.ts`
- Modify: `scripts/db-tools.ts`
- Create: `scripts/backup.sh`
- Create: `docs/operations.md`
- Test: `src/services/backup.test.ts`

**Interfaces:**

- Consumes: `backupDatabase`、`pruneBackups`（Phase 1）
- Produces:
  - `restoreDatabase(from: string, target: string): Promise<void>`（校验 SQLite 头；先把 `target` 复制为 `target.pre-restore-<ISO>`）
  - `node db-tools.cjs backup [--to <path>] [--keep <n>]`（默认 `../backups/database-<ISO>.sqlite`，默认保留 30）
  - `node db-tools.cjs restore --from <path>`

- [ ] **Step 1: 写失败测试**

```ts
it('restores a valid backup and keeps a pre-restore copy', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'mix-restore-'));
  const target = join(dir, 'database.sqlite');
  const backup = join(dir, 'backup.sqlite');
  await writeFile(target, 'old');
  await writeFile(backup, Buffer.concat([Buffer.from('SQLite format 3\0'), Buffer.from('new')]));
  await restoreDatabase(backup, target);
  expect(await readFile(target, 'utf8')).toBe('SQLite format 3\0new');
  expect((await readdir(dir)).some((name) => name.startsWith('database.sqlite.pre-restore-'))).toBe(true);
});
it('refuses a corrupt backup and leaves the target untouched', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'mix-restore-'));
  const target = join(dir, 'database.sqlite');
  const backup = join(dir, 'backup.sqlite');
  await writeFile(target, 'keep-me');
  await writeFile(backup, 'not-a-database');
  await expect(restoreDatabase(backup, target)).rejects.toThrow();
  expect(await readFile(target, 'utf8')).toBe('keep-me');
});
it('prunes older backups and keeps the newest', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'mix-backups-'));
  for (let i = 0; i < 7; i += 1) {
    const file = join(dir, `db-${i}.sqlite`);
    await writeFile(file, String(i));
    await utimes(file, new Date(2026, 0, i + 1), new Date(2026, 0, i + 1));
  }
  expect(await pruneBackups(dir, 5)).toBe(2);
  expect(await readdir(dir)).toContain('db-6.sqlite');
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/services/backup.test.ts`
Expected: FAIL（`restoreDatabase` 不存在）

- [ ] **Step 3: 实现**

- `restoreDatabase`：读取源文件前 16 字节并与 `SQLite format 3\0` 比较；不匹配直接抛错；匹配后若目标存在则复制为 `target.pre-restore-<ISO>`，再 `copyFile` 覆盖。
- `db-tools.ts`：`backup` 支持可选 `--to` 与 `--keep`（默认 30），完成后 `pruneBackups(dirname(target), keep)`；`restore` 要求 `--from`，调用 `restoreDatabase(from, './database.sqlite')` 并打印结果；未知命令或缺少参数 `process.exit(1)`。
- `scripts/backup.sh`：

```bash
#!/usr/bin/env bash
set -euo pipefail
APP_ROOT="${APP_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
[ -d "$APP_ROOT/current" ] || { echo "no current release at $APP_ROOT/current" >&2; exit 1; }
cd "$APP_ROOT/current"
node db-tools.cjs backup \
  --to "$APP_ROOT/backups/database-$(date -u +%Y%m%dT%H%M%SZ).sqlite" \
  --keep "${BACKUP_KEEP:-30}"
```

- `docs/operations.md`：写入 cron 示例（`17 3 * * * APP_ROOT=/path /path/scripts/backup.sh`）、恢复步骤（`pm2 stop mix` → `node db-tools.cjs restore --from <file>` → `pm2 start mix` → `curl -f /api/health`）、保留数量与备份位置。

- [ ] **Step 4: 运行测试与检查**

Run: `bunx vitest run src/services/backup.test.ts && bun run build:db-tools && shellcheck scripts/*.sh`
Expected: PASS；`dist/db-tools.cjs` 包含 `restore`

- [ ] **Step 5: 提交**

```bash
git add src/services/backup.ts src/services/backup.test.ts scripts/db-tools.ts scripts/backup.sh docs/operations.md
git commit -m "feat(ops): add scheduled backup and restore drill"
```

---

### Task 5: 文档与全量验证

**Files:**

- Modify: `CLAUDE.md`

- [ ] **Step 1: 更新说明**

记录：启动时会校验环境变量；`/api/health` 是部署探活；`LOG_LEVEL` 控制日志；`scripts/backup.sh` 供 cron 调用；恢复步骤见 `docs/operations.md`。

- [ ] **Step 2: 运行全量检查**

Run: `bunx vitest run && bunx tsc --noEmit && bun run lint && bun run format:check && shellcheck scripts/*.sh && bun run build:db-tools`
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: describe phase 3 operations"
```

---

## 自检清单（执行者收尾）

- [ ] 生产环境缺少 `AUTH_SECRET`/`NEXTAUTH_URL`/邮件配置时启动失败。
- [ ] `/api/health` 在数据库关闭时返回 503，`deploy.sh` 不再把 4xx 当作健康。
- [ ] `LOG_LEVEL=warn` 时 Sequelize 不再输出 debug SQL。
- [ ] 备份目录保留最新 N 份，恢复损坏文件不改变现有数据库。
- [ ] Review Focus 的 5 类输入都有对应用例。
