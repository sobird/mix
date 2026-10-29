# Phase 0 授权正确性 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让授权只从一个由数据库驱动的能力入口产生，并把所有写操作接上检查。

**Architecture:** 新建 `src/services/ability/`：类型与规则归一化、CASL 构建、数据库加载、请求级入口、三态查询适配器。会话身份通过 `getSessionUserId()` 读取；动作层统一用 `getCurrentAbility()`。`lib/casl.ts` 只负责规则 → Sequelize 条件，不再认识模型。

**Tech Stack:** Next.js 16 RSC / Server Actions、CASL 7、Sequelize 6、Zod 4、Vitest。

**Spec:** `docs/superpowers/specs/2026-10-29-architecture-baseline-design.md`

## Global Constraints

- 不新增运行时依赖；只使用现有 `@casl/ability`、`sequelize`、`zod`、`react`。
- `bunx tsc --noEmit`、`bunx vitest run`、`bun run lint`、`bun run format:check` 必须通过。
- 数据库测试只用内存库：`useInMemoryDatabase()`（`tests/helpers/database.ts`）+ `tests/helpers/factories.ts`；禁止读写 `./database.sqlite`。
- 失败关闭：任何解析不了的规则跳过该授予，不抛异常、不放行。
- 提交信息遵循 conventional commits（`fix: ...` / `feat: ...` / `test: ...`）。

## Review Focus

1. 未登录或未知用户 → 空能力；写操作返回失败；列表查询返回空数组，绝不能是 `where: null` 的全表。
2. 拥有者授予 `manage all` → 所有动作通过，`queryAccessible` 返回全部记录。
3. 带条件授权（如 `update Role { id: 1 }`）→ 仅对匹配实例返回 true；用 subject 字符串判断时必须为 false。
4. 已过期的授权（Phase 0 读取 `permissions.expires`）→ 构建能力时忽略。
5. 形状损坏的 `role_permissions.rules`（字符串、缺字段、非对象）→ 该授予被忽略并输出警告，其他授予不受影响。

---

### Task 1: 会话用户身份

**Files:**

- Modify: `src/services/auth/index.ts`
- Test: `src/services/auth/session-user.test.ts`

**Interfaces:**

- Produces:
  - `parseSessionUserId(userId: unknown): number | null`
  - `getSessionUserId(): Promise<number | null>`

- [ ] **Step 1: 写失败测试**

```ts
// src/services/auth/session-user.test.ts
import { parseSessionUserId } from './index';

it('parses numeric string ids', () => {
  expect(parseSessionUserId('42')).toBe(42);
});
it('rejects empty and non-numeric ids', () => {
  expect(parseSessionUserId(undefined)).toBeNull();
  expect(parseSessionUserId('abc')).toBeNull();
  expect(parseSessionUserId(0)).toBeNull();
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/services/auth/session-user.test.ts`
Expected: FAIL（`parseSessionUserId` 未导出）

- [ ] **Step 3: 实现**

在 `src/services/auth/index.ts` 加：

```ts
export function parseSessionUserId(userId: unknown): number | null {
  const id = Number(userId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function getSessionUserId(): Promise<number | null> {
  const session = await getServerAuthSession();
  return parseSessionUserId(session?.user?.id);
}
```

若 `Session.user.id` 类型缺失，补充模块声明：

```ts
declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user'];
  }
}
```

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/services/auth/session-user.test.ts && bunx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/services/auth/index.ts src/services/auth/session-user.test.ts
git commit -m "feat(auth): expose session user id"
```

---

### Task 2: 规则类型与归一化

**Files:**

- Create: `src/services/ability/types.ts`
- Create: `src/services/ability/narrowing.ts`
- Test: `src/services/ability/narrowing.test.ts`

**Interfaces:**

- Produces:
  - `type AppActions = 'create' | 'read' | 'update' | 'delete' | 'manage'`
  - `type AppSubject = keyof Models | 'all'`
  - `interface RuleNarrowing { fields?: string[]; conditions?: Record<string, unknown>; inverted?: boolean }`
  - `interface AbilityGrant { action: string; subject: string; narrowing: RuleNarrowing; expiresAt?: Date | null }`
  - `normalizeNarrowing(raw: unknown): RuleNarrowing | null`（`null` 表示损坏，调用方必须跳过）

- [ ] **Step 1: 写失败测试**

```ts
it('treats empty legacy rules as no narrowing', () => {
  expect(normalizeNarrowing(undefined)).toEqual({});
  expect(normalizeNarrowing([])).toEqual({});
});
it('converts legacy string arrays to fields', () => {
  expect(normalizeNarrowing(['username', 'email'])).toEqual({ fields: ['username', 'email'] });
});
it('accepts a narrowing object', () => {
  expect(normalizeNarrowing({ fields: ['title'], conditions: { id: 1 }, inverted: true })).toEqual({
    fields: ['title'],
    conditions: { id: 1 },
    inverted: true,
  });
});
it('rejects malformed values', () => {
  expect(normalizeNarrowing('oops')).toBeNull();
  expect(normalizeNarrowing({ fields: 'title' })).toBeNull();
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/services/ability/narrowing.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现**

- `types.ts`：声明上述类型；`AppSubject` 用 `keyof Models | 'all'`，`Models` 仅以 `import type` 引入。
- `narrowing.ts`：`undefined` / `null` / `[]` → `{}`；字符串数组且全为字符串 → `{ fields }`；数组元素为对象时取第一个对象的 `fields/conditions/inverted`；对象则逐字段校验类型，不合法返回 `null`；其他返回 `null`。

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/services/ability/narrowing.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/services/ability/types.ts src/services/ability/narrowing.ts src/services/ability/narrowing.test.ts
git commit -m "feat(ability): add grant types and narrowing parser"
```

---

### Task 3: CASL 能力构建

**Files:**

- Create: `src/services/ability/build.ts`
- Test: `src/services/ability/build.test.ts`

**Interfaces:**

- Consumes: `AbilityGrant`、`RuleNarrowing`（Task 2）
- Produces:
  - `type AppAbility = MongoAbility<[AppActions, AppSubject | ForcedSubject<Exclude<AppSubject, 'all'>>]>`
  - `buildAbility(grants: AbilityGrant[]): AppAbility`

- [ ] **Step 1: 写失败测试**

```ts
it('unions grants from multiple roles', () => {
  const ability = buildAbility([
    { action: 'read', subject: 'User', narrowing: {} },
    { action: 'update', subject: 'Role', narrowing: {} },
  ]);
  expect(ability.can('read', 'User')).toBe(true);
  expect(ability.can('update', 'Role')).toBe(true);
});
it('applies inverted grants after allow grants', () => {
  const ability = buildAbility([
    { action: 'update', subject: 'Role', narrowing: { conditions: { id: 9 }, inverted: true } },
    { action: 'update', subject: 'Role', narrowing: {} },
  ]);
  expect(ability.can('update', subject('Role', { id: 9 }))).toBe(false);
  expect(ability.can('update', subject('Role', { id: 1 }))).toBe(true);
});
it('evaluates conditional grants only against instances', () => {
  const ability = buildAbility([{ action: 'update', subject: 'Role', narrowing: { conditions: { id: 1 } } }]);
  expect(ability.can('update', subject('Role', { id: 1 }))).toBe(true);
  expect(ability.can('update', subject('Role', { id: 2 }))).toBe(false);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/services/ability/build.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现**

先遍历 `narrowing.inverted !== true` 的授予调用 `can(action, subject, fields?, conditions?)`，再遍历 inverted 的授予，保证拒绝规则后加入（CASL 后加入优先）。`subject === 'all'` 时忽略 `fields` 并输出一次警告。忽略未知 `subject` 字符串时仍交给 CASL（它允许任意 subject）。

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/services/ability/build.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/services/ability/build.ts src/services/ability/build.test.ts
git commit -m "feat(ability): build casl ability from grants"
```

---

### Task 4: 数据库授予加载与角色继承

**Files:**

- Create: `src/services/ability/sources.ts`
- Test: `src/services/ability/sources.test.ts`

**Interfaces:**

- Consumes: `AbilityGrant`、`normalizeNarrowing`
- Produces:
  - `expandRoleIds(roleIds: number[], roles: Array<{ id: number; parentId?: number | null }>): number[]`
  - `loadUserGrants(userId: number): Promise<AbilityGrant[]>`

- [ ] **Step 1: 写失败测试**（使用 `useInMemoryDatabase()` + factories）

```ts
it('returns an empty list for an unknown user', async () => {
  expect(await loadUserGrants(9999)).toEqual([]);
});
it('inherits grants from ancestor roles', async () => {
  // parent(manage all) -> child(read User)，用户只绑 child
  const parent = await createRole();
  const child = await createRole({ parentId: parent.id });
  const perm = await createPermission({ action: 'manage', subject: 'all' });
  await createRolePermission({ roleId: parent.id, permissionId: perm.id });
  await createUserRole({ userId: user.id, roleId: child.id });

  const grants = await loadUserGrants(user.id);
  expect(grants).toContainEqual(expect.objectContaining({ action: 'manage', subject: 'all' }));
});
it('skips expired and malformed grants', async () => {
  const role = await createRole();
  const expired = await createPermission({
    action: 'read',
    subject: 'User',
    expires: new Date('2000-01-01'),
  });
  const broken = await createPermission({ action: 'update', subject: 'User' });
  await createRolePermission({ roleId: role.id, permissionId: expired.id });
  await createRolePermission({ roleId: role.id, permissionId: broken.id, rules: 'oops' as never });
  await createUserRole({ userId: user.id, roleId: role.id });

  expect(await loadUserGrants(user.id)).toEqual([]);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/services/ability/sources.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现**

1. `UserRole.findAll({ where: { userId } })` 取直接角色。
2. `Role.findAll({ attributes: ['id', 'parentId'] })` 一次读全量，`expandRoleIds` 沿 `parentId` 向上展开（防环，最多遍历角色总数）。
3. `RolePermission.findAll({ where: { roleId: expanded }, include: [{ model: Permission, required: true }] })`。
4. 跳过 `permission.expires && permission.expires <= new Date()` 的授予；`normalizeNarrowing(rolePermission.rules)` 为 `null` 时 `console.warn` 并跳过；否则生成 `AbilityGrant`（`expiresAt: permission.expires`）。
5. 按 `action + subject + JSON.stringify(narrowing)` 去重。

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/services/ability/sources.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/services/ability/sources.ts src/services/ability/sources.test.ts
git commit -m "feat(ability): load grants from roles with inheritance"
```

---

### Task 5: 请求级能力入口

**Files:**

- Create: `src/services/ability/index.ts`
- Delete: `src/services/ability.ts`
- Test: `src/services/ability/index.test.ts`

**Interfaces:**

- Consumes: `buildAbility`、`loadUserGrants`、`getSessionUserId`
- Produces:
  - `getAbility(userId: number): Promise<AppAbility>`（`React.cache` 包装 `loadUserGrants` + `buildAbility`）
  - `getCurrentAbility(): Promise<AppAbility>`（无会话时返回空能力）
  - `isAllowed(ability: AppAbility, action: AppActions, subject: AppSubject, instance?: object): boolean`

- [ ] **Step 1: 写失败测试**

```ts
it('returns an empty ability without a session', async () => {
  vi.mocked(getSessionUserId).mockResolvedValue(null);
  const ability = await getCurrentAbility();
  expect(ability.can('read', 'User')).toBe(false);
});
it('checks instances when provided', () => {
  const ability = buildAbility([{ action: 'update', subject: 'Role', narrowing: { conditions: { id: 1 } } }]);
  expect(isAllowed(ability, 'update', 'Role', { id: 1 })).toBe(true);
  expect(isAllowed(ability, 'update', 'Role', { id: 2 })).toBe(false);
  expect(isAllowed(ability, 'update', 'Role')).toBe(false);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/services/ability/index.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现**

```ts
export const getAbility = cache(async (userId: number) => buildAbility(await loadUserGrants(userId)));

export async function getCurrentAbility() {
  const userId = await getSessionUserId();
  return userId ? getAbility(userId) : buildAbility([]);
}

export function isAllowed(ability, action, subjectName, instance?) {
  return instance ? ability.can(action, subject(subjectName, instance)) : ability.can(action, subjectName);
}
```

删除旧 `src/services/ability.ts`；把 `AppAbility`、`AppActions`、`AppSubject` 从 `types.ts` 再导出，保证 `from '@/services/ability'` 路径不变。

- [ ] **Step 4: 运行测试与类型检查**

Run: `bunx vitest run src/services/ability/index.test.ts && bunx tsc --noEmit`
Expected: PASS（此步会暴露旧 `defineAbilityFor` 的引用，下一任务处理）

- [ ] **Step 5: 提交**

```bash
git add src/services/ability src/services/ability.ts
git commit -m "feat(ability): add request-scoped ability entry points"
```

---

### Task 6: 三态访问查询

**Files:**

- Modify: `src/lib/casl.ts`
- Modify: `src/lib/sequelize.ts`
- Create: `src/services/ability/query.ts`
- Test: `src/lib/casl.test.ts`、`src/services/ability/query.test.ts`

**Interfaces:**

- Produces:
  - `symbolize(value: unknown): unknown`（无损，保留 `Date`）
  - `type AccessQuery = { kind: 'none' } | { kind: 'all' } | { kind: 'filter'; where: WhereOptions }`
  - `toAccessQuery(ability: AppAbility, action: AppActions, subject: AppSubject): AccessQuery`
  - `queryAccessible<M extends Model>(model: ModelStatic<M>, ability: AppAbility, action: AppActions): Promise<M[]>`

- [ ] **Step 1: 写失败测试**

```ts
it('returns none when there are no allow rules', () => {
  expect(toAccessQuery(buildAbility([]), 'read', 'User')).toEqual({ kind: 'none' });
});
it('returns all for unconditional allow', () => {
  expect(toAccessQuery(buildAbility([{ action: 'read', subject: 'User', narrowing: {} }]), 'read', 'User')).toEqual({
    kind: 'all',
  });
});
it('returns a filter for conditional allow', () => {
  const query = toAccessQuery(
    buildAbility([{ action: 'read', subject: 'User', narrowing: { conditions: { id: 1 } } }]),
    'read',
    'User',
  );
  expect(query).toEqual({ kind: 'filter', where: { id: 1 } });
});
it('keeps Date values while symbolizing operators', () => {
  const date = new Date('2026-01-01T00:00:00.000Z');
  expect(symbolize({ $lte: date })).toEqual({ [Op.lte]: date });
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/lib/casl.test.ts src/services/ability/query.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现**

- `symbolize`：递归遍历对象/数组；键以 `$` 开头且 `Op[key]` 存在时替换为 symbol，值继续递归；其他键原样保留；`Date` 原样返回。
- `toAccessQuery` 算法：
  1. `rules = ability.rulesFor(action, subject)`；
  2. 无 allow → `{ kind: 'none' }`；
  3. 存在无条件 allow 且无 deny → `{ kind: 'all' }`；
  4. 存在无条件 deny → `{ kind: 'none' }`；
  5. 否则用条件 allow 生成 `{{ $or: [...] }}`（复用 `rulesToCondition` 的 `or` 分支），每个 deny 条件生成 `{ $not: condition }`，最终 `{ $and: [allow, ...denyNot] }`，再 `symbolize` 成 `{ kind: 'filter', where }`。
- `queryAccessible`：`none → []`、`all → model.findAll()`、`filter → model.findAll({ where })`。
- 删除 `lib/casl.ts` 的 `toSequelizeQuery`、`accessibleBy`；删除 `lib/sequelize.ts` 中对 `accessibleBy`、`findManyWithAccessible`、`Models` 的引用。

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/lib/casl.test.ts src/services/ability/query.test.ts && bunx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/lib/casl.ts src/lib/sequelize.ts src/lib/casl.test.ts src/services/ability/query.ts src/services/ability/query.test.ts
git commit -m "fix(ability): make access queries tri-state"
```

---

### Task 7: 角色动作接入检查

**Files:**

- Modify: `src/actions/role.ts`
- Test: `src/actions/role.test.ts`

**Interfaces:**

- Consumes: `getCurrentAbility`、`isAllowed`
- Produces: 每个导出动作在写库前检查；失败返回 `{ status: ActionStatus.FAILURE, message: '您没有...的权限' }`

- [ ] **Step 1: 写失败测试**

```ts
it('rejects create/delete for a user without permission', async () => {
  vi.mocked(getCurrentAbility).mockResolvedValue(buildAbility([]));
  expect((await createRoleAction({ name: '测试角色2' })).status).toBe(ActionStatus.FAILURE);
  expect(await deleteRoleAction('1')).toEqual(expect.objectContaining({ status: ActionStatus.FAILURE }));
});
it('allows an owner to create a role', async () => {
  vi.mocked(getCurrentAbility).mockResolvedValue(buildAbility([{ action: 'manage', subject: 'all', narrowing: {} }]));
  expect((await createRoleAction({ name: '新角色' })).status).not.toBe(ActionStatus.FAILURE);
});
it('checks the target instance for update', async () => {
  vi.mocked(getCurrentAbility).mockResolvedValue(
    buildAbility([{ action: 'update', subject: 'Role', narrowing: { conditions: { id: 1 } } }]),
  );
  const other = await createRole();
  expect((await updateRoleAction({ id: other.id, name: '改名' })).status).toBe(ActionStatus.FAILURE);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/actions/role.test.ts`
Expected: FAIL（无权限时仍会写库）

- [ ] **Step 3: 实现**

在每个写动作开头取 `const ability = await getCurrentAbility()`：

- `createRoleAction`：`isAllowed(ability, 'create', 'Role')`
- `updateRoleAction`：先 `Role.findByPk(payload.id)`，`isAllowed(ability, 'update', 'Role', role)`
- `deleteRoleAction`：先 `findByPk(id)`，`isAllowed(ability, 'delete', 'Role', role)`
- `saveRolePermissions`：先 `findByPk(roleId)`，`isAllowed(ability, 'update', 'Role', role)`

失败时返回失败状态（`deleteRoleAction`/`saveRolePermissions` 返回 `{ status, message }` 而不是静默）。

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/actions/role.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/actions/role.ts src/actions/role.test.ts
git commit -m "fix(actions): enforce authorization on role writes"
```

---

### Task 8: 用户动作检查与默认角色

**Files:**

- Modify: `src/actions/user.tsx`
- Modify: `src/services/role.ts`
- Modify: `src/services/auth/adapter-sequelize.ts`
- Test: `src/actions/user.test.ts`、`src/services/role.test.ts`

**Interfaces:**

- Consumes: `getCurrentAbility`、`isAllowed`
- Produces: `RoleService.assignDefaultRole(userId: number): Promise<void>`

- [ ] **Step 1: 写失败测试**

```ts
it('assigns the default role to a new user', async () => {
  const user = await createUser();
  await RoleService.assignDefaultRole(user.id);
  const role = await user.getRoles();
  expect(role.map((r) => r.name)).toContain('成员');
});
it('rejects user creation for a member', async () => {
  vi.mocked(getCurrentAbility).mockResolvedValue(buildAbility([{ action: 'read', subject: 'User', narrowing: {} }]));
  expect((await createUserAction(validPayload)).status).toBe(ActionStatus.FAILURE);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/actions/user.test.ts src/services/role.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现**

- `RoleService.assignDefaultRole`：`Role.findOne({ where: { isDefault: true } })`；找不到就 `console.warn` 并返回；`UserRole.findOrCreate({ where: { userId, roleId } })`。
- `createUserAction`：检查 `isAllowed(ability, 'create', 'User')`；创建成功后调用 `assignDefaultRole(user.id)`。
- `updateUserAction`：先查目标用户，`isAllowed(ability, 'update', 'User', user)`。
- `deleteUserAction`：先查目标用户，`isAllowed(ability, 'delete', 'User', user)`；失败返回失败状态。
- `signUpAction` 保持公开，创建成功后调用 `assignDefaultRole`。
- `AuthAdapter.createUser`：创建后调用 `assignDefaultRole(created.id)`（邮箱/OAuth 首次登录路径）。

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/actions/user.test.ts src/services/role.test.ts`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/actions/user.tsx src/services/role.ts src/services/auth/adapter-sequelize.ts src/actions/user.test.ts src/services/role.test.ts
git commit -m "fix(auth): guard user writes and assign default role"
```

---

### Task 9: 移除静态能力表

**Files:**

- Modify: `src/app/page.tsx`
- Modify: `src/actions/role.ts`（若仍有 `defineAbilityFor`）
- Delete: `rolePermissions`、`defineAbilityFor`、`createAppAbility`（位于旧 `src/services/ability.ts`，Task 5 已删除）
- Test: `src/actions/role.test.ts`（回归）

**Interfaces:**

- Produces: 仓库中不再存在 `defineAbilityFor` / `rolePermissions`

- [ ] **Step 1: 写/改测试**

在 `src/actions/role.test.ts` 增加：

```ts
it('does not import the static ability source', async () => {
  const source = await import('node:fs').then((fs) => fs.readFileSync('src/services/ability/index.ts', 'utf8'));
  expect(source).not.toContain('rolePermissions');
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/actions/role.test.ts`
Expected: FAIL（若旧文件仍存在，或导入仍引用）

- [ ] **Step 3: 实现**

- `src/app/page.tsx` 删除 `defineAbilityFor` 与 `ability` 日志，只保留 token 读取（或删除 token 读取）。
- `src/actions/role.ts` 的 `updateRoleAction` 改用 `getCurrentAbility()` + `isAllowed`（Task 7 已做，确认无残留导入）。
- 全仓 `rg "defineAbilityFor|rolePermissions|createAppAbility" src` 必须为空。

- [ ] **Step 4: 运行全量检查**

Run: `bunx vitest run && bunx tsc --noEmit && bun run lint`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/app/page.tsx src/actions/role.ts src/actions/role.test.ts
git commit -m "refactor(ability): remove static permission table"
```

---

## 自检清单（执行者收尾）

- [ ] `rg "where: null|where:null" src` 无结果。
- [ ] `rg "defineAbilityFor|rolePermissions" src` 无结果。
- [ ] `bunx vitest run` 全绿，新增用例覆盖 Review Focus 的 5 类输入。
- [ ] `bunx tsc --noEmit`、`bun run lint`、`bun run format:check` 全绿。
