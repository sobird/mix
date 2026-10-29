# Phase 1 数据层可控 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 umzug 接管建表，把权限目录、收紧规则和有效期落到固定 schema 上，并让部署在切软链前完成迁移与目录同步。

**Architecture:** `umzug` + `001-baseline` 建立基线；权限目录以 `src/permissions/catalog.ts` 为唯一来源，`syncPermissionCatalog()` 幂等投影到 `permissions` 与内置角色授予；`role_permissions.narrowing` / `expires_at`、`user_roles.expires_at` 成为唯一规则形状。迁移与目录同步通过一个打包后的 `db-tools.cjs` 在服务器执行（服务器只有 node）。

**Tech Stack:** Sequelize 6 / SQLite、umzug 3、Next.js 16、Bun（构建期）、Vitest。

**Spec:** `docs/superpowers/specs/2026-10-29-architecture-baseline-design.md`

## Global Constraints

- 目标服务器无存量数据；本地 `database.sqlite` 视为可重建的开发数据，不做数据迁移。
- 迁移只向前（roll forward），代码回滚不回滚 schema。
- 不新增依赖：umzug 已在 `package.json`。
- `bunx tsc --noEmit`、`bunx vitest run`、`bun run lint`、`bun run format:check`、`shellcheck scripts/*.sh` 必须通过。
- 数据库测试只用内存库（`useInMemoryDatabase()`）；禁止读写 `./database.sqlite`。
- 服务器运行环境只有 node，不要求 Bun；构建期可以使用 Bun。

## Review Focus

1. 空数据库首次 `migrate` → 建出全部表；重复执行 → 不重复执行基线。
2. 目录新增一个权限后再次同步 → 新行出现，已有授予不被删除。
3. 目录中移除一个仍被授予的权限 → 不级联删除授予（只停止在目录中提供）。
4. 迁移或目录同步失败 → 部署在切换 `current` 之前中止，旧版本继续运行。
5. 已过期或已损坏的收紧规则 → 不进入能力（沿用 Phase 0 的 fail-closed 断言）。

---

### Task 1: 固定模型 schema

**Files:**

- Modify: `src/models/Permission.ts`
- Modify: `src/models/RolePermission.ts`
- Modify: `src/models/UserRole.ts`
- Modify: `src/actions/role.ts`、`src/services/role.ts`（`through.rules` → `narrowing`）
- Modify: `src/actions/role.test.ts`（断言 `narrowing`）
- Modify: `tests/helpers/factories.ts`
- Test: `src/models/Permission.test.ts`、`src/models/RolePermission.test.ts`、`src/models/UserRole.test.ts`

**Interfaces:**

- Produces:
  - `Permission`: `action`/`subject` 非空，`UNIQUE(action, subject)`，删除 `expires`
  - `RolePermission`: `narrowing: JSON | null`（替换 `rules`）、`expiresAt: Date | null`
  - `UserRole`: `expiresAt: Date | null`

- [ ] **Step 1: 写失败测试**

```ts
it('rejects duplicate action/subject', async () => {
  await createPermission({ action: 'read', subject: 'User' });
  await expect(createPermission({ action: 'read', subject: 'User' })).rejects.toBeInstanceOf(UniqueConstraintError);
});
it('requires action and subject', async () => {
  await expect(Permission.create({ name: 'x' } as never)).rejects.toBeInstanceOf(ValidationError);
});
it('stores narrowing as JSON and expiresAt', async () => {
  const row = await createRolePermission({
    roleId: r.id,
    permissionId: p.id,
    narrowing: { fields: ['email'] },
    expiresAt: FUTURE,
  });
  await row.reload();
  expect(row.narrowing).toEqual({ fields: ['email'] });
  expect(row.expiresAt?.toISOString()).toBe(FUTURE.toISOString());
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/models/Permission.test.ts src/models/RolePermission.test.ts src/models/UserRole.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现**

- `Permission.init`：`action`、`subject` 加 `allowNull: false`；启用 `indexes: [{ unique: true, fields: ['action', 'subject'], name: 'permissions_action_subject' }]`；删除 `expires` 属性及类型声明。
- `RolePermission`：`rules` 改为 `narrowing: DataTypes.JSON`（`allowNull: true`，无默认值）；新增 `expiresAt: DataTypes.DATE`（字段名 `expires_at`）。
- `UserRole`：新增 `expiresAt`。
- `src/actions/role.ts` 与 `src/services/role.ts`：`through: { rules: fields }` 改为 `narrowing: fields?.length ? { fields } : null`，保证列重命名后两条写入路径都能工作。
- `src/actions/role.test.ts`：把 `RolePermission.rules` 断言改为 `RolePermission.narrowing`。
- 工厂函数补 `narrowing` / `expiresAt` 的类型支持；`tests/helpers/seeds.ts` 的 `rules: []` 改为 `narrowing: null`，`rules: [{...}]` 改为 `narrowing: { fields: [...] }`。

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/models tests/helpers`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/models tests/helpers
git commit -m "feat(models): normalize permission schema"
```

---

### Task 2: 能力加载读取新字段

**Files:**

- Modify: `src/services/ability/sources.ts`
- Test: `src/services/ability/sources.test.ts`

**Interfaces:**

- Consumes: `RolePermission.narrowing`、`RolePermission.expiresAt`、`UserRole.expiresAt`
- Produces: `loadUserGrants` 不再读取 `rules`；过期授予（角色绑定或授权行）被跳过

- [ ] **Step 1: 写失败测试**

```ts
it('skips expired role assignments and grants', async () => {
  const user = await createUser();
  const role = await createRole();
  const permission = await createPermission({ action: 'read', subject: 'User' });
  await createUserRole({ userId: user.id, roleId: role.id, expiresAt: new Date('2000-01-01') });
  await createRolePermission({ roleId: role.id, permissionId: permission.id });
  expect(await loadUserGrants(user.id)).toEqual([]);
});
it('reads narrowing from the grant row', async () => {
  const user = await createUser();
  const role = await createRole();
  const permission = await createPermission({ action: 'update', subject: 'Role' });
  await createRolePermission({
    roleId: role.id,
    permissionId: permission.id,
    narrowing: { conditions: { id: 1 } },
  });
  await createUserRole({ userId: user.id, roleId: role.id });
  expect(await loadUserGrants(user.id)).toEqual([
    { action: 'update', subject: 'Role', narrowing: { conditions: { id: 1 } }, expiresAt: null },
  ]);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/services/ability/sources.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现**

- 过滤掉 `assignment.expiresAt <= now` 的 `UserRole`。
- 读取 `rolePermission.narrowing`，交给 `normalizeNarrowing`；`undefined`/`null` → `{}`；损坏 → 警告并跳过。
- 授权行过期条件：`expiresAt` 非空且 `<= now` 时跳过；`AbilityGrant.expiresAt` 取该值。

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/services/ability && bunx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/services/ability/sources.ts src/services/ability/sources.test.ts
git commit -m "feat(ability): read narrowing and expiry from grants"
```

---

### Task 3: umzug 迁移体系

**Files:**

- Create: `src/lib/migrator.ts`
- Create: `src/migrations/001-baseline.ts`
- Create: `src/migrations/index.ts`
- Create: `scripts/migrate.ts`
- Modify: `package.json`（`db:migrate`）
- Test: `src/lib/migrator.test.ts`

**Interfaces:**

- Produces:
  - `type Migration = { name: string; up: (params: MigrationParams<Sequelize>) => Promise<void>; down: ... }`
  - `runMigrations(sequelize: Sequelize): Promise<string[]>`（返回本次执行的迁移名）
  - `MIGRATIONS: Migration[]`

- [ ] **Step 1: 写失败测试**

```ts
it('runs the baseline once', async () => {
  const ran = await runMigrations(sequelize);
  expect(ran).toEqual(['001-baseline']);
  expect(await runMigrations(sequelize)).toEqual([]);
});
it('creates the normalized tables', async () => {
  await runMigrations(sequelize);
  const [columns] = await sequelize.query("PRAGMA table_info('role_permissions')");
  expect(columns.map((c: any) => c.name)).toEqual(expect.arrayContaining(['narrowing', 'expires_at']));
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/lib/migrator.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现**

- `src/migrations/001-baseline.ts`：先 `import '@/models';`（确保所有模型与关联已注册，否则 `context.sync()` 建不出表）；`name: '001-baseline'`；`up: async ({ context }) => { await context.sync(); }`（当前模型即最终基线；目标库为空，本地旧库可删除后重建）；`down: async ({ context }) => { await context.drop(); }`。
- `src/migrations/index.ts`：`export const MIGRATIONS = [baseline];`（按顺序）。
- `src/lib/migrator.ts`：`new Umzug({ migrations: MIGRATIONS, context: sequelize, storage: new SequelizeStorage({ sequelize, tableName: 'sequelize_meta' }), logger: { info: () => {}, warn: console.warn, error: console.error, debug: () => {} } })`；`runMigrations` 调用 `up()` 并返回 `executed.map(m => m.name)`。
- `scripts/migrate.ts`：从 `@/models` 导入 `sequelize`（触发模型注册），`runMigrations(sequelize).then(...)`，打印执行数量；失败 `process.exit(1)`。
- `package.json` 增加 `"db:migrate": "bun scripts/migrate.ts"`。

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/lib/migrator.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/migrator.ts src/migrations scripts/migrate.ts src/lib/migrator.test.ts package.json
git commit -m "feat(db): introduce umzug migrations"
```

---

### Task 4: 权限目录与内置角色授予

**Files:**

- Create: `src/permissions/catalog.ts`
- Create: `src/services/permission-catalog.ts`
- Test: `src/services/permission-catalog.test.ts`

**Interfaces:**

- Produces:
  - `interface CatalogPermission { action: AppActions; subject: AppSubject; name: string }`
  - `PERMISSION_CATALOG: CatalogPermission[]`
  - `BUILTIN_ROLE_GRANTS: Record<'owner' | 'admin' | 'member', CatalogPermission[]>`
  - `syncPermissionCatalog(): Promise<{ permissions: number; grants: number }>`

- [ ] **Step 1: 写失败测试**

```ts
it('creates catalog permissions and builtin grants once', async () => {
  const first = await syncPermissionCatalog();
  expect(first.permissions).toBe(PERMISSION_CATALOG.length);
  const second = await syncPermissionCatalog();
  expect(second.permissions).toBe(0);
  expect(await Permission.count()).toBe(PERMISSION_CATALOG.length);
});
it('grants the ladder to builtin roles', async () => {
  await syncPermissionCatalog();
  const owner = await Role.findOne({ where: { name: '拥有者' } });
  const ability = buildAbility(await loadGrantsForRole(owner.id));
  expect(ability.can('manage', 'all')).toBe(true);
});
it('does not touch custom role grants', async () => {
  const custom = await createRole();
  const permission = await createPermission({ action: 'read', subject: 'User' });
  await createRolePermission({ roleId: custom.id, permissionId: permission.id });
  await syncPermissionCatalog();
  expect(await RolePermission.count({ where: { roleId: custom.id } })).toBe(1);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/services/permission-catalog.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现**

- `catalog.ts`：列出 `User` / `Role` / `Permission` 的 `create/read/update/delete`（12 条）与 `manage all`（1 条）；`BUILTIN_ROLE_GRANTS.owner = [manage all]`，`admin = User/Role/Permission 的 CRUD`，`member = 三个 subject 的 read`。
- `syncPermissionCatalog`：事务内按 `(action, subject)` `findOrCreate`，存在则更新 `name`；确保三个内置角色存在（`isBuiltin: true`，成员 `isDefault: true`）；对每个内置角色 `setPermissions([])` 后按目录重新授予（`narrowing: null`）；返回新建权限数与重建授予数。绝不删除自定义角色或未在目录中的权限行。
- 注意：`manage all` 在 `permissions` 表中以 `action: 'manage', subject: 'all'` 存储。

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/services/permission-catalog.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/permissions src/services/permission-catalog.ts src/services/permission-catalog.test.ts
git commit -m "feat(permissions): add code-sourced catalog sync"
```

---

### Task 5: 首个用户拥有者与种子脚本

**Files:**

- Modify: `src/services/role.ts`
- Modify: `scripts/seed.ts`
- Create: `scripts/sync-catalog.ts`
- Modify: `package.json`（`db:sync-catalog`）
- Test: `src/services/role.test.ts`

**Interfaces:**

- Produces:
  - `RoleService.assignOwnerToFirstUser(): Promise<number | null>`（返回被授予的用户 id；空库返回 null）
  - `bun run db:seed` = 迁移 + 目录同步 + 首个用户升拥有者（不再 `force: true`）

- [ ] **Step 1: 写失败测试**

```ts
it('assigns owner to the earliest user only', async () => {
  const first = await createUser();
  const second = await createUser();
  await syncPermissionCatalog();
  expect(await RoleService.assignOwnerToFirstUser()).toBe(first.id);
  expect(await RoleService.assignOwnerToFirstUser()).toBeNull(); // 已存在拥有者
  const role = await first.getRoles();
  expect(role.map((r) => r.name)).toContain('拥有者');
});
it('is a no-op on an empty database', async () => {
  expect(await RoleService.assignOwnerToFirstUser()).toBeNull();
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/services/role.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现**

- `assignOwnerToFirstUser`：若已有任意用户持有「拥有者」角色则返回 `null`；否则 `User.findOne({ order: [['id', 'ASC']] })`，没有用户返回 `null`；找到拥有者角色（不存在则 `Role.create` 内置定义），`UserRole.findOrCreate`，返回用户 id。
- `scripts/seed.ts`：依次 `runMigrations(sequelize)`、`syncPermissionCatalog()`、`assignOwnerToFirstUser()`；输出统计；不再 `sync({ force: true })`。
- `scripts/sync-catalog.ts`：调用 `syncPermissionCatalog()` 与 `assignOwnerToFirstUser()`，输出统计，供部署脚本使用。
- `package.json` 增加 `"db:sync-catalog": "bun scripts/sync-catalog.ts"`。

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/services/role.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/services/role.ts scripts/seed.ts scripts/sync-catalog.ts src/services/role.test.ts package.json
git commit -m "feat(roles): bootstrap owner and catalog seeding"
```

---

### Task 6: 部署期迁移与目录同步

**Files:**

- Create: `src/services/backup.ts`
- Create: `scripts/db-tools.ts`
- Modify: `package.json`（`build:db-tools`、`db:backup`）
- Modify: `.github/workflows/ci.yml`（上传 `dist/db-tools.cjs`）
- Modify: `.github/workflows/deploy.yml`（发布包内放 `db-tools.cjs`）
- Modify: `scripts/deploy.sh`
- Test: `src/services/backup.test.ts`

**Interfaces:**

- Produces:
  - `backupDatabase(sequelize: Sequelize, targetPath: string): Promise<void>`（`VACUUM INTO`）
  - `node db-tools.cjs migrate`（有 pending 迁移时先备份到 `../backups/`）
  - `node db-tools.cjs sync-catalog`
  - `node db-tools.cjs backup --to <path>`

- [ ] **Step 1: 写失败测试**

```ts
it('prunes old backups keeping the newest N', async () => {
  // 在 mkdtemp 目录里创建 7 个备份文件，调用 pruneBackups(dir, 5)
  expect(await pruneBackups(dir, 5)).toBe(2);
  expect((await readdir(dir)).length).toBe(5);
});
it('writes a standalone sqlite snapshot', async () => {
  // 使用临时文件数据库连接，写入一行后 backupDatabase，断言目标文件可被 sqlite3 打开且有该行
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/services/backup.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现**

- `backup.ts`：`backupDatabase` 执行 `VACUUM INTO '<escaped target>'`；`pruneBackups(dir, keep)` 按 mtime 降序删除多余文件并返回删除数。
- `scripts/db-tools.ts`：从 `@/models` 导入 `sequelize`（触发模型注册）；`main(argv)` 解析 `migrate|sync-catalog|backup`；`migrate` 先用 `umzug.pending()` 判断是否有迁移，有则备份到 `../backups/database-<ISO>.sqlite`（保留 5 份），再 `runMigrations`；`sync-catalog` 调 `syncPermissionCatalog` 与 `assignOwnerToFirstUser`；失败打印错误并 `process.exit(1)`。
- `package.json`：`"build:db-tools": "bun build scripts/db-tools.ts --target=node --format=cjs --outfile=dist/db-tools.cjs --external sequelize --external sqlite3 --external log4js"`。
- `ci.yml` 的 build job：在 `Build` 之后运行 `bun run build:db-tools`；上传产物路径增加 `dist/db-tools.cjs`。
- `deploy.yml` 的 `Prepare release bundle`：`cp dist/db-tools.cjs .next/standalone/`。
- `scripts/deploy.sh`：在软链 `.env*` / `database.sqlite` 之后、`ln -sfn "$RELEASE_DIR" "$CURRENT"` 之前：

```sh
cd "$RELEASE_DIR"
node db-tools.cjs migrate
node db-tools.cjs sync-catalog
```

`set -e` 保证任一步失败即退出，`current` 仍指向旧 release。

- [ ] **Step 4: 运行测试与检查**

Run: `bunx vitest run src/services/backup.test.ts && bun run build:db-tools && shellcheck scripts/*.sh`
Expected: PASS；`dist/db-tools.cjs` 生成

- [ ] **Step 5: 提交**

```bash
git add src/services/backup.ts scripts/db-tools.ts package.json .github/workflows/ci.yml .github/workflows/deploy.yml scripts/deploy.sh src/services/backup.test.ts
git commit -m "feat(deploy): run migrations and catalog sync before switch"
```

---

### Task 7: 文档与全量验证

**Files:**

- Modify: `CLAUDE.md`

- [ ] **Step 1: 更新命令说明**

把 `db:seed` 的描述改为「迁移 + 目录同步 + 种子，不再 `sync({ force: true })`」；新增 `bun run db:migrate`、`bun run db:sync-catalog`、`bun run build:db-tools`。

- [ ] **Step 2: 运行全量检查**

Run: `bunx vitest run && bunx tsc --noEmit && bun run lint && bun run format:check`
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: document migration and catalog commands"
```

---

## 自检清单（执行者收尾）

- [ ] `rg "\.rules\b|rules:" src/models src/services/ability tests/helpers` 无遗留（除文档字符串）。
- [ ] `rg "expires" src/models/Permission.ts` 无结果。
- [ ] 同一数据库连续执行 `bun run db:migrate` 第二次输出 0 个迁移。
- [ ] Review Focus 的 5 类输入都有对应用例。
