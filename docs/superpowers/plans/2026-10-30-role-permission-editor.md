# 角色权限编辑器实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在角色编辑页加入「权限矩阵 + 限制抽屉」，并把 `narrowing.fields` 真正接入读写路径。

**Architecture:** 先补齐纯函数与授权帮助函数（字段元数据、条件行互转、字段裁剪），再扩展角色服务的保存与读取契约，最后接上客户端矩阵组件。服务端使用 CASL 的实例级字段判断，界面复用同一套元数据渲染选项。

**Tech Stack:** Next.js 16 / React 19 / TypeScript 7 / antd 6 / zod 4 / Sequelize 6 / SQLite / Vitest 5 / Bun

**Spec:** `docs/superpowers/specs/2026-10-30-role-permission-editor-design.md`

## Global Constraints

- 包管理器与命令一律用 Bun：`bunx vitest run <file>`、`bunx tsc --noEmit`、`bunx oxlint`、`bunx oxfmt --check`。
- Task 1–10 不新增依赖；Task 11 只新增 `@playwright/test` 开发依赖与 `test:e2e` 脚本。
- 不修改 `next-env.d.ts`；不运行 `bun run db:seed`（E2E 使用独立的 `DB_STORAGE` 文件与专用种子脚本，永不写 `./database.sqlite`）。
- 测试使用内存数据库（`tests/setup.ts` 已 mock `@/lib/sequelize`），文件按被测模块命名。
- 每个任务结束提交一次，commit message 使用 conventional 格式。
- 字段限制只作用于 `read` 与 `update`；创建/删除不做字段裁剪。
- 系统字段 `id`、`createdAt`、`updatedAt` 在只读裁剪中始终保留。
- `manage:all` 只允许过期与拒绝，不允许字段与条件。
- 越权写入静默丢弃；整体无权仍抛 `ForbiddenError`。

## Review Focus

- `fields: []`（空数组）必须等同「不限制」，不能被当成「什么字段都不允许」——由 Task 3 的 `pruneReadableFields` 测试固定。
- 裁剪后 `id` / `createdAt` / `updatedAt` 必须仍在，否则列表行键和编辑链接失效——由 Task 3 的系统字段测试与 Task 4 的 `paginateAccessible` 测试固定。
- `$nin` 必须同时能在 Sequelize where 和 CASL 实例判断中工作——由 Task 2 的 `symbolize` 测试与 Task 3 的条件规则测试固定。
- 带字段的拒绝只隐藏字段，不带字段的拒绝才隐藏整行——由 Task 3 的拒绝规则测试固定。
- 已过期授予在编辑器中可见且保存后不消失——由 Task 6 的 `findPermissionEditor` 测试与 Task 8 的往返测试固定。
- 受限角色登录后，列表列头与编辑表单必须真的少掉字段，而不只是单元格为空——由 Task 12 的 E2E 断言固定。

---

### Task 1: 字段元数据与条件行互转

**Files:**

- Create: `src/permissions/fields.ts`
- Test: `src/permissions/fields.test.ts`

**Interfaces:**

- Consumes: 无。
- Produces:
  - `type FieldKind = 'boolean' | 'number' | 'enum' | 'string'`
  - `interface FieldMeta { name: string; label: string; kind: FieldKind; options?: { value: string; label: string }[] }`
  - `type ConditionOperator = 'eq' | 'ne' | 'in' | 'nin'`
  - `interface ConditionRow { field: string; operator: ConditionOperator; value: string | number | boolean | Array<string | number> }`
  - `restrictableFields(subject: string): FieldMeta[]`
  - `conditionableFields(subject: string): FieldMeta[]`
  - `rowsToConditions(rows: ConditionRow[]): Record<string, unknown> | null`
  - `conditionsToRows(conditions: Record<string, unknown> | null | undefined, fields: FieldMeta[]): ConditionRow[]`

- [ ] **Step 1: 写失败测试**

```ts
import { conditionableFields, conditionsToRows, restrictableFields, rowsToConditions } from './fields';

describe('rowsToConditions', () => {
  it('builds eq/ne/in/nin conditions', () => {
    expect(rowsToConditions([{ field: 'status', operator: 'eq', value: true }])).toEqual({ status: true });
    expect(rowsToConditions([{ field: 'status', operator: 'ne', value: true }])).toEqual({ status: { $ne: true } });
    expect(rowsToConditions([{ field: 'id', operator: 'in', value: [1, 2] }])).toEqual({ id: { $in: [1, 2] } });
    expect(rowsToConditions([{ field: 'id', operator: 'nin', value: [1, 2] }])).toEqual({ id: { $nin: [1, 2] } });
  });

  it('lets the last duplicate field win and returns null for no rows', () => {
    expect(
      rowsToConditions([
        { field: 'status', operator: 'eq', value: true },
        { field: 'status', operator: 'eq', value: false },
      ]),
    ).toEqual({ status: false });
    expect(rowsToConditions([])).toBeNull();
  });
});

describe('conditionsToRows', () => {
  it('round-trips supported shapes in metadata order', () => {
    expect(conditionsToRows({ id: { $nin: [1] }, status: true }, conditionableFields('User'))).toEqual([
      { field: 'id', operator: 'nin', value: [1] },
      { field: 'status', operator: 'eq', value: true },
    ]);
  });

  it('ignores unknown keys and unsupported operators', () => {
    expect(conditionsToRows({ password: 'x', status: { $gt: true } }, conditionableFields('User'))).toEqual([]);
  });
});

describe('field metadata', () => {
  it('never exposes credential fields and returns nothing for all', () => {
    expect(restrictableFields('User').map((field) => field.name)).not.toContain('password');
    expect(restrictableFields('all')).toEqual([]);
    expect(conditionableFields('all')).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bunx vitest run src/permissions/fields.test.ts`
Expected: FAIL —— 模块 `./fields` 不存在。

- [ ] **Step 3: 实现元数据与纯函数**

`src/permissions/fields.ts` 中按设计文档 §5 的表格写死三个 subject 的 `restrictable` 与 `conditionable`；`restrictableFields` / `conditionableFields` 对未知 subject（含 `'all'`）返回 `[]`。`label` 用中文字段名，E2E 依赖的取值固定为：`description` → `备注`、`username` → `用户名`、`email` → `邮箱`、`nickname` → `用户昵称`、`mobile` → `手机号码`、`roles` → `角色`、`name` → `名称`、`action` → `动作`、`subject` → `主题`，其余按列名直译。`conditionsToRows` 只按给定的 `fields` 顺序遍历，识别标量、`{ $ne }`、`{ $in }`、`{ $nin }` 四种形状，其余忽略。

- [ ] **Step 4: 运行测试确认通过**

Run: `bunx vitest run src/permissions/fields.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/permissions/fields.ts src/permissions/fields.test.ts
git commit -m "feat(permissions): add subject field metadata and condition rows"
```

---

### Task 2: 让 `symbolize` 支持 `$nin`

**Files:**

- Modify: `src/lib/casl.ts:30-50`
- Test: `src/lib/casl.test.ts`

**Interfaces:**

- Consumes: 无。
- Produces: `symbolize` 额外把 `$nin` 映射为 `Op.notIn`，其余 `$<OpName>` 行为不变。

- [ ] **Step 1: 写失败测试**

在 `src/lib/casl.test.ts` 的 `describe('symbolize')` 内追加：

```ts
it('maps $nin to Op.notIn for Sequelize', () => {
  expect(symbolize({ id: { $nin: [1, 2] } })).toEqual({ id: { [Op.notIn]: [1, 2] } });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bunx vitest run src/lib/casl.test.ts`
Expected: FAIL —— `$nin` 被原样保留，实际结果与 `{ [Op.notIn]: [1, 2] }` 不等。

- [ ] **Step 3: 实现别名映射**

在 `symbolize` 计算 `operator` 的分支里，先查 `Op` 同名键；未命中且 `operatorName === 'nin'` 时使用 `Op.notIn`；仍未命中则保留原键。

- [ ] **Step 4: 运行测试确认通过**

Run: `bunx vitest run src/lib/casl.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/lib/casl.ts src/lib/casl.test.ts
git commit -m "feat(casl): map \\$nin conditions to sequelize notIn"
```

---

### Task 3: 字段级授权帮助函数

**Files:**

- Create: `src/services/ability/fields.ts`
- Test: `src/services/ability/fields.test.ts`

**Interfaces:**

- Consumes: `AppAbility`（`./build`）、`AppActions` / `AppSubject`（`./types`）。
- Produces:
  - `canAccessField(ability: AppAbility, action: AppActions, subjectName: Exclude<AppSubject, 'all'>, instance: Record<PropertyKey, unknown>, field: string): boolean`
  - `pruneReadableFields<T extends Record<string, unknown>>(ability, action, subjectName, row: T): Partial<T>`
  - `pickWritableFields<T extends Record<string, unknown>>(ability, action, subjectName, instance, data: T): Partial<T>`

- [ ] **Step 1: 写失败测试**

```ts
import { buildAbility } from './build';
import { pickWritableFields, pruneReadableFields } from './fields';

const user = { id: 1, username: 'alice', email: 'a@x', status: true, createdAt: new Date('2026-01-01T00:00:00.000Z') };

it('keeps every field when the rule has no fields', () => {
  const ability = buildAbility([{ action: 'read', subject: 'User', narrowing: {} }]);
  expect(pruneReadableFields(ability, 'read', 'User', user)).toEqual(user);
});

it('treats an empty field list as unrestricted', () => {
  const ability = buildAbility([{ action: 'read', subject: 'User', narrowing: { fields: [] } }]);
  expect(pruneReadableFields(ability, 'read', 'User', user)).toEqual(user);
});

it('keeps only listed fields plus id and timestamps', () => {
  const ability = buildAbility([{ action: 'read', subject: 'User', narrowing: { fields: ['username'] } }]);
  expect(Object.keys(pruneReadableFields(ability, 'read', 'User', user)).sort()).toEqual(
    ['createdAt', 'id', 'username'].sort(),
  );
});

it('applies conditional field rules per row', () => {
  const ability = buildAbility([
    { action: 'read', subject: 'User', narrowing: { fields: ['email'], conditions: { status: true } } },
  ]);
  expect(pruneReadableFields(ability, 'read', 'User', user)).toHaveProperty('email');
  expect(pruneReadableFields(ability, 'read', 'User', { ...user, status: false })).not.toHaveProperty('email');
});

it('evaluates $nin conditions per row', () => {
  const ability = buildAbility([
    { action: 'read', subject: 'User', narrowing: { fields: ['email'], conditions: { id: { $nin: [2] } } } },
  ]);
  expect(pruneReadableFields(ability, 'read', 'User', user)).toHaveProperty('email');
  expect(pruneReadableFields(ability, 'read', 'User', { ...user, id: 2 })).not.toHaveProperty('email');
});

it('hides only listed fields for a field-scoped deny', () => {
  const ability = buildAbility([
    { action: 'read', subject: 'User', narrowing: {} },
    { action: 'read', subject: 'User', narrowing: { fields: ['email'], inverted: true } },
  ]);
  const pruned = pruneReadableFields(ability, 'read', 'User', user);
  expect(pruned).not.toHaveProperty('email');
  expect(pruned).toHaveProperty('username');
});

it('drops fields outside the write grant', () => {
  const ability = buildAbility([{ action: 'update', subject: 'User', narrowing: { fields: ['username'] } }]);
  expect(pickWritableFields(ability, 'update', 'User', user, { username: 'bob', email: 'b@x' })).toEqual({
    username: 'bob',
  });
});

it('keeps only system fields for an unfielded deny', () => {
  const ability = buildAbility([
    { action: 'read', subject: 'User', narrowing: {} },
    { action: 'read', subject: 'User', narrowing: { inverted: true } },
  ]);
  expect(Object.keys(pruneReadableFields(ability, 'read', 'User', user)).sort()).toEqual(['createdAt', 'id']);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bunx vitest run src/services/ability/fields.test.ts`
Expected: FAIL —— 模块不存在。

- [ ] **Step 3: 实现帮助函数**

`canAccessField` 直接调用 `ability.can(action, caslSubject(subjectName, instance), field)`（`caslSubject` 来自 `@casl/ability`）。`pruneReadableFields` 遍历 `Object.entries(row)`，`id`、`createdAt`、`updatedAt` 无条件保留，其余按 `canAccessField` 过滤，返回普通对象。`pickWritableFields` 对 `data` 的每个键做同样判断，不保留系统字段。

- [ ] **Step 4: 运行测试确认通过**

Run: `bunx vitest run src/services/ability/fields.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/services/ability/fields.ts src/services/ability/fields.test.ts
git commit -m "feat(ability): add field-level read and write helpers"
```

---

### Task 4: 读路径接入字段裁剪

**Files:**

- Modify: `src/services/access.ts:48-61`
- Modify: `src/services/role.ts:88-112`
- Modify: `src/services/user.ts:47-71`
- Modify: `src/services/permission.ts:17-29`
- Modify: `src/app/dashboard/role/[id]/edit/page.tsx:23,33`
- Modify: `src/app/dashboard/user/table.tsx`
- Modify: `src/app/dashboard/role/table.tsx`
- Test: `src/services/access.test.ts`、`src/services/role.test.ts`、`src/services/user.test.ts`、`src/services/permission.test.ts`（新建）

**Interfaces:**

- Consumes: Task 3 的 `pruneReadableFields`、`canAccessField`。
- Produces:
  - `paginateAccessible` 返回的行已按 `read` 裁剪。
  - `RoleService.listOptions` 在 `name` 被裁掉时返回 `{ value: id, label: '#' + id }`。
  - `RoleService.findForEdit(ability, id): Promise<Attributes<Role>>`（返回普通对象，页面改为 `initialValues={role}`）。
  - `UserService.findForEdit` 的返回按 `update` 裁剪，`roles` 只在允许时出现。
  - `PermissionService.list` 的属性除 `id` 外都可能缺失，`PermissionListItem` 相应字段改为可选。
  - 用户/角色列表的可见列由行内实际字段决定：`has = (key) => rows.length === 0 || rows.some((row) => key in row)`，为假的列不渲染；`操作` 列与系统字段列始终渲染。

- [ ] **Step 1: 写失败测试**

`src/services/access.test.ts` 追加：

```ts
it('prunes row fields to the read grant', async () => {
  await createRole({ description: 'hidden' });
  const ability = buildAbility([{ action: 'read', subject: 'Role', narrowing: { fields: ['name'] } }]);

  const page = await paginateAccessible(Role, ability, 'read', {});

  const [row] = page.rows;
  expect(row).toHaveProperty('name');
  expect(row).not.toHaveProperty('description');
  expect(row).toHaveProperty('id');
  expect(row).toHaveProperty('createdAt');
});
```

`src/services/role.test.ts` 追加：

```ts
it('falls back to a numeric label when name is pruned', async () => {
  const role = await createRole();
  const ability = buildAbility([{ action: 'read', subject: 'Role', narrowing: { fields: ['description'] } }]);

  await expect(RoleService.listOptions(ability)).resolves.toEqual([{ value: role.id, label: `#${role.id}` }]);
});

it('prunes the edit payload to update fields', async () => {
  const role = await createRole({ description: 'secret' });
  const ability = buildAbility([{ action: 'update', subject: 'Role', narrowing: { fields: ['name'] } }]);

  const data = await RoleService.findForEdit(ability, role.id);

  expect(data).toHaveProperty('name');
  expect(data).not.toHaveProperty('description');
});
```

`src/services/user.test.ts` 追加：

```ts
it('prunes edit data to update fields and hides roles when not writable', async () => {
  const user = await createUser({ nickname: 'nick' });
  const ability = buildAbility([{ action: 'update', subject: 'User', narrowing: { fields: ['username'] } }]);

  const data = await UserService.findForEdit(ability, user.id);

  expect(data).toHaveProperty('username');
  expect(data).not.toHaveProperty('email');
  expect(data).not.toHaveProperty('nickname');
  expect(data).not.toHaveProperty('roles');
});
```

`src/services/permission.test.ts`（新建）：

```ts
// @vitest-environment node

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { buildAbility } from './ability';
import PermissionService from './permission';
import { syncPermissionCatalog } from './permission-catalog';

useInMemoryDatabase();

describe('PermissionService.list', () => {
  it('prunes fields to the read grant', async () => {
    await syncPermissionCatalog();
    const ability = buildAbility([{ action: 'read', subject: 'Permission', narrowing: { fields: ['name'] } }]);

    const [item] = await PermissionService.list(ability);

    expect(item).toHaveProperty('name');
    expect(item.action).toBeUndefined();
    expect(item.subject).toBeUndefined();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bunx vitest run src/services/access.test.ts src/services/role.test.ts src/services/user.test.ts src/services/permission.test.ts`
Expected: 新增用例 FAIL（字段仍完整返回）；`RoleService.findForEdit` 返回实例导致断言/类型不符。

- [ ] **Step 3: 接入裁剪**

- `paginateAccessible`：`rows.map((row) => pruneReadableFields(ability, action, model.name as Exclude<AppSubject, 'all'>, row.toJSON()))`。
- `RoleService.listOptions`：先 `toJSON` 再按 `read` 裁剪，`label = pruned.name ?? \`#${pruned.id}\``。
- `RoleService.findForEdit`：保留原有授权，返回 `pruneReadableFields(ability, 'update', 'Role', role.toJSON())`；页面改成 `initialValues={role}`。
- `UserService.findForEdit`：对 `rest` 按 `update` 裁剪；`canAccessField(ability, 'update', 'User', user.get({ plain: true }), 'roles')` 为真时才附加 `roles`（`UserEditData.roles` 改为可选 `roles?: number[]`）。
- `PermissionService.list`：`row.toJSON()` 后裁剪，按可选字段映射；排序对缺失值用 `''` 兜底；`PermissionListItem` 除 `id` 外全部可选。
- `UserTable` / `RoleTable`：按上一条的 `has` 判断包住 `<Table.Column>`（用户名/邮箱/状态、角色名称/角色描述），`创建时间` 与 `操作` 始终渲染。

裁剪结果是 `Partial<T>`：写回 `Attributes<M>` 或 `UserEditData` 时用 `as` 断言（`id`/时间戳始终保留，行键与编辑链接不会缺失）。

- [ ] **Step 4: 运行测试确认通过**

Run: `bunx vitest run src/services/access.test.ts src/services/role.test.ts src/services/user.test.ts src/services/permission.test.ts`
Expected: PASS（含原有用例）。

- [ ] **Step 5: 提交**

```bash
git add src/services/access.ts src/services/role.ts src/services/user.ts src/services/permission.ts \
  src/app/dashboard/role/[id]/edit/page.tsx src/app/dashboard/user/table.tsx src/app/dashboard/role/table.tsx \
  src/services/access.test.ts src/services/role.test.ts src/services/user.test.ts src/services/permission.test.ts
git commit -m "feat(services): prune read and edit payloads by field grants"
```

---

### Task 5: 写路径静默丢弃越权字段

**Files:**

- Modify: `src/services/user.ts:101-118`
- Modify: `src/services/role.ts:114-137`
- Test: `src/services/user.test.ts`、`src/services/role.test.ts`

**Interfaces:**

- Consumes: Task 3 的 `pickWritableFields`、`canAccessField`。
- Produces: `UserService.update` / `RoleService.update` 只把允许的字段交给模型；`roles` 伪字段单独判断。

- [ ] **Step 1: 写失败测试**

`src/services/user.test.ts` 追加：

```ts
describe('UserService.update field filtering', () => {
  it('silently drops fields outside the update grant', async () => {
    const user = await createUser({ nickname: 'nick' });
    const ability = buildAbility([{ action: 'update', subject: 'User', narrowing: { fields: ['username'] } }]);

    await UserService.update(ability, user.id, { username: 'renamed', nickname: 'changed' });
    await user.reload();

    expect(user.username).toBe('renamed');
    expect(user.nickname).toBe('nick');
  });

  it('gates role assignment behind the roles pseudo-field', async () => {
    await syncPermissionCatalog();
    const user = await createUser();
    const role = await createRole();
    const withoutRoles = buildAbility([{ action: 'update', subject: 'User', narrowing: { fields: ['username'] } }]);

    await UserService.update(withoutRoles, user.id, { roles: [role.id] });
    expect(await user.getRoles()).toEqual([]);

    const withRoles = buildAbility([{ action: 'update', subject: 'User', narrowing: { fields: ['roles'] } }]);
    await UserService.update(withRoles, user.id, { roles: [role.id] });
    expect((await user.getRoles()).map((item) => item.id)).toEqual([role.id]);
  });
});
```

`src/services/role.test.ts` 追加：

```ts
it('silently drops fields outside the update grant', async () => {
  const role = await createRole({ description: 'old' });
  const ability = buildAbility([{ action: 'update', subject: 'Role', narrowing: { fields: ['name'] } }]);

  await RoleService.update(ability, role.id, { name: 'renamed', description: 'new' });
  await role.reload();

  expect(role.name).toBe('renamed');
  expect(role.description).toBe('old');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bunx vitest run src/services/user.test.ts src/services/role.test.ts`
Expected: FAIL —— 不允许的字段仍被写入。

- [ ] **Step 3: 接入写入过滤**

`UserService.update`：拆出 `attributes` 后用 `user.get({ plain: true })` 作为实例，`pickWritableFields(ability, 'update', 'User', plain, attributes)` 后再 `user.update`；过滤结果为空对象时跳过 `update`（例如只提交了被拒的 `roles`）；`roles` 仅在 `canAccessField(..., 'roles')` 为真且非空时 `setRoles`。

`RoleService.update`：用 `role.get({ plain: true })` 做实例，`pickWritableFields(ability, 'update', 'Role', plain, data)` 后 `role.update`。

- [ ] **Step 4: 运行测试确认通过**

Run: `bunx vitest run src/services/user.test.ts src/services/role.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/services/user.ts src/services/role.ts src/services/user.test.ts src/services/role.test.ts
git commit -m "feat(services): silently drop fields outside update grants"
```

---

### Task 6: 保存契约与编辑器读取

**Files:**

- Modify: `src/services/role.ts:23-26,150-187`
- Test: `src/services/role.test.ts`

**Interfaces:**

- Consumes: `normalizeNarrowing`、`PERMISSION_CATALOG`、`RolePermission`、`Permission`。
- Produces:
  - `interface PermissionInput { subject: string; actions: { action: string; fields?: string[]; conditions?: Record<string, unknown>; expiresAt?: string | null; inverted?: boolean }[] }`
  - `interface RolePermissionGrant { action: string; subject: string; fields: string[]; conditions: Record<string, unknown> | null; expiresAt: string | null; inverted: boolean }`
  - `interface RolePermissionEditorData { grants: RolePermissionGrant[]; editable: boolean }`
  - `RoleService.findPermissionEditor(ability: AppAbility, id: number | string): Promise<RolePermissionEditorData>`
  - `RoleService.savePermissions` 写入 `fields` / `conditions` / `inverted` / `expiresAt`。

- [ ] **Step 1: 写失败测试**

```ts
describe('RoleService.savePermissions contract', () => {
  function ownerAbility() {
    return buildAbility([{ action: 'manage', subject: 'all', narrowing: {} }]);
  }

  it('persists narrowing and expiry on the join row', async () => {
    const role = await createRole();
    const expiresAt = new Date('2026-12-31T00:00:00.000Z');

    await RoleService.savePermissions(ownerAbility(), role.id, [
      {
        subject: 'User',
        actions: [
          {
            action: 'read',
            fields: ['username'],
            conditions: { status: true },
            expiresAt: expiresAt.toISOString(),
            inverted: true,
          },
        ],
      },
    ]);

    const row = await RolePermission.findOne({
      where: { roleId: role.id },
      include: [{ model: Permission, required: true }],
    });

    expect(row?.Permission.action).toBe('read');
    expect(row?.narrowing).toEqual({ fields: ['username'], conditions: { status: true }, inverted: true });
    expect(new Date(row!.expiresAt!).toISOString()).toBe(expiresAt.toISOString());
  });

  it('stores null narrowing when only expiry is set', async () => {
    const role = await createRole();

    await RoleService.savePermissions(ownerAbility(), role.id, [
      { subject: 'User', actions: [{ action: 'read', expiresAt: '2026-12-31T00:00:00.000Z' }] },
    ]);

    const row = await RolePermission.findOne({ where: { roleId: role.id } });
    expect(row?.narrowing).toBeNull();
    expect(row?.expiresAt).not.toBeNull();
  });

  it('creates catalog-external permissions with a generated name', async () => {
    const role = await createRole();

    await RoleService.savePermissions(ownerAbility(), role.id, [{ subject: 'Group', actions: [{ action: 'read' }] }]);

    const permission = await Permission.findOne({ where: { action: 'read', subject: 'Group' } });
    expect(permission?.name).toBe('read:Group');
  });

  it('replaces existing grants instead of appending', async () => {
    const role = await createRole();

    await RoleService.savePermissions(ownerAbility(), role.id, [{ subject: 'User', actions: [{ action: 'read' }] }]);
    await RoleService.savePermissions(ownerAbility(), role.id, [{ subject: 'Role', actions: [{ action: 'read' }] }]);

    const rows = await RolePermission.findAll({
      where: { roleId: role.id },
      include: [{ model: Permission, required: true }],
    });
    expect(rows.map((row) => row.Permission.subject)).toEqual(['Role']);
  });
});

describe('RoleService.findPermissionEditor', () => {
  it('returns catalog grants including expired ones', async () => {
    await syncPermissionCatalog();
    const role = await createRole();
    const permission = await Permission.findOne({ where: { action: 'read', subject: 'User' } });
    await role.addPermission(permission!, {
      through: { narrowing: { conditions: { status: true } }, expiresAt: new Date('2020-01-01T00:00:00.000Z') },
    });

    const data = await RoleService.findPermissionEditor(
      buildAbility([{ action: 'manage', subject: 'all', narrowing: {} }]),
      role.id,
    );

    expect(data.editable).toBe(true);
    expect(data.grants).toContainEqual({
      action: 'read',
      subject: 'User',
      fields: [],
      conditions: { status: true },
      expiresAt: '2020-01-01T00:00:00.000Z',
      inverted: false,
    });
  });

  it('marks built-in roles as not editable', async () => {
    await syncPermissionCatalog();
    const owner = await Role.findOne({ where: { name: '拥有者' } });

    const data = await RoleService.findPermissionEditor(
      buildAbility([{ action: 'manage', subject: 'all', narrowing: {} }]),
      owner!.id,
    );

    expect(data.editable).toBe(false);
  });
});
```

`src/services/role.test.ts` 顶部把导入补成 `import { Permission, Role, RolePermission, UserRole } from '@/models';`（`createRole`、`syncPermissionCatalog` 已在文件中导入）。

- [ ] **Step 2: 运行测试确认失败**

Run: `bunx vitest run src/services/role.test.ts`
Expected: FAIL —— `findPermissionEditor` 不存在；`conditions` / `inverted` / `expiresAt` 未写入。

- [ ] **Step 3: 扩展保存与读取**

- `PermissionInput` 按 Interfaces 扩展。
- `savePermissions`：每个 action 组装 `narrowing`（仅当 `fields` 非空、`conditions` 非空对象或 `inverted === true` 时生成，否则 `null`）；`expiresAt` 有值时转 `Date`；`role.addPermission(permission, { through: { narrowing, expiresAt }, transaction })`。
- `Permission.findOrCreate` 增加 `defaults: { name: catalogName(action, subject) ?? \`${action}:${subject}\` }`，`catalogName`从`PERMISSION_CATALOG` 查找。
- 新增 `findPermissionEditor`：先 `findByPk` + `isAllowed(ability, 'update', 'Role', role)`（不存在 `NotFoundError`、无权 `ForbiddenError`）；查询 `RolePermission.findAll({ where: { roleId }, include: [{ model: Permission, required: true }] })`；只保留目录内的 `(action, subject)`；`normalizeNarrowing` 为 `null` 的跳过；映射为 `RolePermissionGrant`，`expiresAt` 用 `toISOString()`；`editable = !role.isBuiltin`。

- [ ] **Step 4: 运行测试确认通过**

Run: `bunx vitest run src/services/role.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/services/role.ts src/services/role.test.ts
git commit -m "feat(role): persist narrowing and expiry and expose editor grants"
```

---

### Task 7: 保存参数校验

**Files:**

- Modify: `src/zod/role.ts`
- Modify: `src/actions/role.ts:150-176`
- Test: `src/actions/role.test.ts`

**Interfaces:**

- Consumes: Task 1 的 `restrictableFields` / `conditionableFields`、Task 6 的 `PermissionInput`。
- Produces: `PermissionInputZod: z.ZodType<PermissionInput[]>`；`saveRolePermissions` 校验失败返回 `{ status: ActionStatus.FAILURE, message: '权限配置不合法' }`。

- [ ] **Step 1: 写失败测试**

在 `src/actions/role.test.ts` 新增：

```ts
describe('saveRolePermissions validation', () => {
  beforeEach(() => {
    vi.mocked(getCurrentAbility).mockResolvedValue(buildAbility([{ action: 'manage', subject: 'all', narrowing: {} }]));
  });

  const invalidCases: Array<[string, PermissionInput[]]> = [
    ['unknown field', [{ subject: 'User', actions: [{ action: 'read', fields: ['password'] }] }]],
    ['unknown condition field', [{ subject: 'User', actions: [{ action: 'read', conditions: { nickname: 'x' } }] }]],
    [
      'unsupported operator',
      [{ subject: 'User', actions: [{ action: 'read', conditions: { status: { $gt: true } } }] }],
    ],
    ['all with fields', [{ subject: 'all', actions: [{ action: 'manage', fields: ['name'] }] }]],
    ['all with conditions', [{ subject: 'all', actions: [{ action: 'manage', conditions: { id: 1 } }] }]],
    ['create with conditions', [{ subject: 'User', actions: [{ action: 'create', conditions: { id: 1 } }] }]],
    ['delete with fields', [{ subject: 'User', actions: [{ action: 'delete', fields: ['username'] }] }]],
    ['value type mismatch', [{ subject: 'User', actions: [{ action: 'read', conditions: { status: 'yes' } }] }]],
  ];

  it.each(invalidCases)('rejects %s', async (_name, payload) => {
    const result = await saveRolePermissions(1, payload);
    expect(result?.status).toBe(ActionStatus.FAILURE);
  });
});
```

需要在该文件顶部补 `import type { PermissionInput } from '@/services/role';`。

- [ ] **Step 2: 运行测试确认失败**

Run: `bunx vitest run src/actions/role.test.ts`
Expected: FAIL —— 非法载荷仍被保存或抛出未预期错误。

- [ ] **Step 3: 实现 zod 校验**

在 `src/zod/role.ts` 定义基础 schema（subject/action 枚举、`fields` 字符串数组、`conditions` 记录、`expiresAt` 为可解析日期或 null、`inverted` 布尔），再用 `.superRefine` 检查：

- `subject === 'all'` 只允许 `action === 'manage'`，且禁止 `fields`、`conditions`；
- `fields` 必须属于 `restrictableFields(subject)`，`create` / `delete` / `manage:all` 不允许 `fields`；
- `create` 不允许 `conditions`；
- 条件键必须属于 `conditionableFields(subject)`，值只能是标量、`$ne` 标量、`$in` 数组、`$nin` 数组，且类型与字段 `kind` 匹配（布尔不接受 in/nin）；
- `expiresAt` 用 `Date.parse` 校验。

在 `saveRolePermissions` 里 `safeParse(permissions)`，失败直接返回失败 state；成功把 `validated.data` 交给服务。

- [ ] **Step 4: 运行测试确认通过**

Run: `bunx vitest run src/actions/role.test.ts`
Expected: PASS（含原有保存与授权用例）。

- [ ] **Step 5: 提交**

```bash
git add src/zod/role.ts src/actions/role.ts src/actions/role.test.ts
git commit -m "feat(role): validate permission payloads against field metadata"
```

---

### Task 8: 矩阵状态纯函数

**Files:**

- Create: `src/app/dashboard/role/components/permission-matrix/state.ts`
- Test: `src/app/dashboard/role/components/permission-matrix/state.test.ts`

**Interfaces:**

- Consumes: `RolePermissionGrant`、`PermissionInput`（`@/services/role`，仅 `import type`）、`ConditionRow` / `rowsToConditions` / `conditionsToRows` / `conditionableFields`（`@/permissions/fields`）。
- Produces:
  - `interface GrantDraft { fields: string[]; conditions: ConditionRow[]; expiresAt: string | null; inverted: boolean }`
  - `type MatrixState = Record<string, Partial<Record<string, GrantDraft>>>`
  - `grantsToState(grants: RolePermissionGrant[]): MatrixState`
  - `stateToPermissionInput(state: MatrixState): PermissionInput[]`

- [ ] **Step 1: 写失败测试**

```ts
import type { RolePermissionGrant } from '@/services/role';

import { grantsToState, stateToPermissionInput } from './state';

it('converts grants into drafts and back', () => {
  const grants: RolePermissionGrant[] = [
    {
      action: 'read',
      subject: 'User',
      fields: ['username'],
      conditions: { status: true },
      expiresAt: null,
      inverted: false,
    },
  ];

  const state = grantsToState(grants);

  expect(state.User?.read).toEqual({
    fields: ['username'],
    conditions: [{ field: 'status', operator: 'eq', value: true }],
    expiresAt: null,
    inverted: false,
  });
  expect(stateToPermissionInput(state)).toEqual([
    { subject: 'User', actions: [{ action: 'read', fields: ['username'], conditions: { status: true } }] },
  ]);
});

it('omits empty restrictions and empty subjects', () => {
  expect(stateToPermissionInput({})).toEqual([]);
  expect(
    stateToPermissionInput({
      User: { read: { fields: [], conditions: [], expiresAt: null, inverted: false } },
    }),
  ).toEqual([{ subject: 'User', actions: [{ action: 'read' }] }]);
});

it('keeps an expired grant through a round trip', () => {
  const state = grantsToState([
    {
      action: 'read',
      subject: 'User',
      fields: [],
      conditions: null,
      expiresAt: '2020-01-01T00:00:00.000Z',
      inverted: false,
    },
  ]);

  expect(stateToPermissionInput(state)).toEqual([
    { subject: 'User', actions: [{ action: 'read', expiresAt: '2020-01-01T00:00:00.000Z' }] },
  ]);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `bunx vitest run src/app/dashboard/role/components/permission-matrix/state.test.ts`
Expected: FAIL —— 模块不存在。

- [ ] **Step 3: 实现状态转换**

`grantsToState`：按 `subject → action` 写入 `GrantDraft`，`conditions` 用 `conditionsToRows(grant.conditions, conditionableFields(subject))` 还原。`stateToPermissionInput`：跳过没有 action 的 subject；每条 action 只在 `fields.length > 0`、条件非空、`expiresAt` 非空、`inverted === true` 时写入对应键。

- [ ] **Step 4: 运行测试确认通过**

Run: `bunx vitest run src/app/dashboard/role/components/permission-matrix/state.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/app/dashboard/role/components/permission-matrix/state.ts \
  src/app/dashboard/role/components/permission-matrix/state.test.ts
git commit -m "feat(role): add permission matrix state helpers"
```

---

### Task 9: 矩阵与限制抽屉界面

**Files:**

- Create: `src/app/dashboard/role/components/permission-matrix/index.tsx`
- Create: `src/app/dashboard/role/components/permission-matrix/restriction-drawer.tsx`
- Create: `src/app/dashboard/role/components/permission-matrix/condition-editor.tsx`
- Modify: `src/app/dashboard/role/[id]/edit/page.tsx`
- Modify: `src/app/dashboard/role/components/role-form/index.tsx`
- Modify: `src/app/dashboard/user/components/user-form/index.tsx`
- Modify: `src/app/dashboard/user/components/user-form/form.tsx`

**Interfaces:**

- Consumes: Task 6 的 `findPermissionEditor` 返回值、Task 8 的 state helpers、Task 7 的 `saveRolePermissions`、Task 1 的元数据。
- Produces:
  - `PermissionMatrix({ roleId, grants, editable }: PermissionMatrixProps)`，`PermissionMatrixProps = { roleId: number; grants: RolePermissionGrant[]; editable: boolean }`
  - 表单按 `data.allowedFields?: string[]` 决定渲染哪些控件（`undefined` 表示全部渲染）。

- [ ] **Step 1: 实现矩阵组件**

`index.tsx`（`'use client'`）：用 `useState(() => grantsToState(grants))` 保存草稿；用 antd `Table` 渲染 `PERMISSION_CATALOG` 的 subject 行与 `read/create/update/delete` 列（`Checkbox` 切换授予，单元格 `aria-label={`${subject}:${action}`}`，`manage:all` 为 `all:manage`）；`manage:all` 单独一行且勾选不联动其他格子；「限制」列按钮 `aria-label={`限制:${subject}`}`，显示非空限制计数，无授予时显示 `—` 且禁用。`expiresAt <= now` 的授予显示为已勾选并标记「已过期」，保存时原样提交。底部按钮文案固定为「重置」「保存」；「重置」把状态恢复为 `grantsToState(grants)`，「保存」调用 `stateToPermissionInput` 后 `await saveRolePermissions(roleId, input)`：失败 `message.error(result.message)`，成功 `message.success('权限已保存')` + `router.refresh()`。`editable === false` 时禁用全部控件并显示 `Alert`「内置角色权限由权限目录同步维护」。

- [ ] **Step 2: 实现限制抽屉**

`restriction-drawer.tsx`（`'use client'`）：props 为 `{ open, subject, subjectLabel, grants, onChange, onClose }`；用 `Tabs` 为每个已勾选 action 渲染一页（标签固定为 查看/创建/更新/删除/管理全部）。每页包含：

- `Select mode="multiple"` 字段限制，`aria-label="字段限制"`，选项 `restrictableFields(subject)`；`subject === 'all'` 时禁用；
- `ConditionEditor`，`action === 'create' || subject === 'all'` 时不渲染；
- `DatePicker showTime` 过期时间，`aria-label="过期时间"`，字符串与 `dayjs` 互转；
- `Collapse`「高级」内 `Switch` 拒绝规则，`aria-label="拒绝规则"`，并提示「填写字段时仅拒绝这些字段；留空则拒绝整行」。

`condition-editor.tsx`：按 `conditionableFields(subject)` 渲染若干行；每行 `Select` 字段、`Select` 操作符、按 `kind` 渲染值控件；布尔只提供等于/不等于；「属于 / 不属于」用多选；同一字段重复时保留最后一行。

- [ ] **Step 3: 接入角色编辑页**

页面同时取角色与编辑器数据：

```tsx
const [role, editor] = await Promise.all([
  RoleService.findForEdit(ability, id),
  RoleService.findPermissionEditor(ability, id),
]);

return (
  <>
    <RoleForm action={updateRoleAction} initialValues={role} data={{ allowedFields: Object.keys(role) }} />
    <PermissionMatrix roleId={role.id as number} grants={editor.grants} editable={editor.editable} />
  </>
);
```

`RoleForm` 内部组件签名改为 `React.FC<WithFormProps>`，从 `data.allowedFields` 决定「角色名称」「备注」是否渲染；`undefined` 时全部渲染（`id` 隐藏项始终渲染）。

- [ ] **Step 4: 让用户表单跟随字段裁剪**

`user-form/index.tsx` 的 props 类型是 `ActionFormProps`（`initialValues` 在其上）：`const allowedFields = props.initialValues ? Object.keys(props.initialValues) : undefined;`，并入 `data` 传给 `InternalUserForm`（创建模式没有 `initialValues`，保持 `undefined`）。`form.tsx` 的每个 `Form.Item` 只在 `allowedFields === undefined || allowedFields.includes('<name>')` 时渲染；`id` 与创建模式的密码项不受影响。

- [ ] **Step 5: 类型与格式检查**

Run: `bunx tsc --noEmit && bunx oxlint && bunx oxfmt --check`
Expected: 全部通过；格式问题用 `bunx oxfmt` 修复后重新检查。

- [ ] **Step 6: 用 Playwright MCP 辅助验收**

Run: `bun run dev`，然后用 Playwright MCP 的 `browser_navigate` / `browser_snapshot` / `browser_click` / `browser_take_screenshot` 走一遍：

1. 登录后进入 `/dashboard/role`，打开一个自定义角色的编辑页；
2. 勾选/取消矩阵格子，打开限制抽屉，增删条件行并设置字段、过期时间；
3. 保存后重新导航并刷新，确认勾选与限制仍在，截图留档；
4. 打开内置角色，确认只读提示且控件禁用；
5. 给 `User.read` 设置字段限制后，确认用户列表的列头确实减少。

MCP 只用于探索与选择器校准，验收门禁是 Task 12 的 `@playwright/test`。执行环境没有 MCP 时，改为人工按上述步骤核对。

- [ ] **Step 7: 提交**

```bash
git add src/app/dashboard/role/components/permission-matrix \
  src/app/dashboard/role/[id]/edit/page.tsx \
  src/app/dashboard/role/components/role-form/index.tsx \
  src/app/dashboard/user/components/user-form
git commit -m "feat(role): add permission matrix and restriction drawer"
```

---

### Task 10: 全量校验

**Files:**

- 无新增；修复前序任务暴露的问题。

**Interfaces:**

- Consumes: 全部前序任务。
- Produces: 可合并的分支。

- [ ] **Step 1: 运行完整检查**

Run: `bunx oxlint && bunx oxfmt --check && bunx tsc --noEmit && bunx vitest run`
Expected: 全部通过；测试输出无错误或警告。

- [ ] **Step 2: 修复失败项并重新运行**

按失败输出定位；不要用 `--no-verify` 或跳过检查。若出现缺表/内存库 schema 错误，按环境问题报告，不运行 `bun run db:seed`。

- [ ] **Step 3: 提交收尾修复**

```bash
git add -A
git commit -m "chore(role): finish permission editor verification"
```

---

### Task 11: E2E 基础设施与种子数据

**Files:**

- Modify: `src/lib/sequelize.ts:77`
- Create: `scripts/e2e-seed.ts`
- Create: `e2e/fixtures.ts`
- Create: `playwright.config.ts`
- Create: `e2e/smoke.spec.ts`
- Modify: `package.json`（`@playwright/test` 开发依赖、`test:e2e` 脚本）
- Modify: `.gitignore`（`.e2e/`、`test-results/`、`playwright-report/`）

**Interfaces:**

- Consumes: Task 1–10 完成。
- Produces:
  - `src/lib/sequelize.ts` 的 `storage` 改为 `process.env.DB_STORAGE ?? './database.sqlite'`，默认行为不变。
  - `e2e/fixtures.ts` 导出 `E2E_OWNER = { username: 'e2e_owner', password: 'Owner#1234' }`、`E2E_VIEWER = { username: 'e2e_viewer', password: 'Viewer#1234' }`、`E2E_RESTRICTED_ROLE = '受限客服'`、`E2E_TARGET_USERNAME = 'e2e_target1'`。
  - `playwright.config.ts`：`testDir: './e2e'`，端口 `3100`，`workers: 1`，`reuseExistingServer: false`，`webServer.command` 为 `bun scripts/e2e-seed.ts && bunx next dev -p 3100`，`url` 为 `/api/health`，`env` 含 `DB_STORAGE='./.e2e/database.sqlite'`、`AUTH_SECRET='e2e-secret-e2e-secret-e2e-secret-32'`、`NEXTAUTH_URL='http://127.0.0.1:3100'`、`LOG_LEVEL='error'`。

- [ ] **Step 1: 安装 Playwright**

Run: `bun add -d @playwright/test && bunx playwright install chromium`
Expected: 依赖写入 `package.json`/`bun.lock`，Chromium 可用。

- [ ] **Step 2: 允许 E2E 覆盖数据库位置**

`src/lib/sequelize.ts` 第 77 行改为 `storage: process.env.DB_STORAGE ?? './database.sqlite',`。不设该变量时行为与现在完全一致。

- [ ] **Step 3: 写种子脚本**

`scripts/e2e-seed.ts`：

- 读取 `process.env.DB_STORAGE`；为空或等于 `./database.sqlite` 时抛错退出（防误删本地数据）。
- 删除该文件及其 `-journal`、`-wal`、`-shm` 旁文件。
- 依次 `runMigrations(sequelize)`、`syncPermissionCatalog()`、`syncMenuCatalog()`。
- 创建 owner：`User.create({ username, email: 'owner@e2e.local', password, status: true, emailVerified: new Date() })`，再把 `Role.findOne({ where: { name: '拥有者' } })` 通过 `setRoles([role])` 赋给他。
- 创建角色 `受限客服`，用 `buildAbility([{ action: 'manage', subject: 'all', narrowing: {} }])` 调 `RoleService.savePermissions`，授予：
  - `User.read`：`fields: ['username', 'nickname']`
  - `User.update`：`fields: ['username', 'email', 'nickname', 'status']`
- 创建 viewer，赋 `受限客服`；创建 3 个目标用户 `e2e_target1..3`，密码 `Target#1234`，`nickname` 为 `目标1..3`，均 `status: true`、`emailVerified: new Date()`。

- [ ] **Step 4: 写 Playwright 配置与冒烟用例**

`playwright.config.ts` 按 Interfaces 的取值；`use` 设 `baseURL` 与 `trace: 'retain-on-failure'`，并以 `timeout: 60_000` 容纳首次按需编译。`e2e/fixtures.ts` 只导出常量。

`e2e/smoke.spec.ts`：

```ts
import { expect, test } from '@playwright/test';

import { E2E_OWNER } from './fixtures';

test('owner can sign in and see the user list', async ({ page }) => {
  await page.goto('/signin?callbackUrl=/dashboard/user');
  await page.getByPlaceholder('用户账号').fill(E2E_OWNER.username);
  await page.getByPlaceholder('用户密码').fill(E2E_OWNER.password);
  await page.getByRole('button', { name: '登录' }).click();

  await expect(page).toHaveURL(/\/dashboard\/user/);
  await expect(page.getByRole('button', { name: '创建用户' })).toBeVisible();
});
```

- [ ] **Step 5: 运行冒烟用例**

Run: `bunx playwright test e2e/smoke.spec.ts`
Expected: 1 passed。失败时先修种子/配置，不要放宽断言。

- [ ] **Step 6: 确认默认命令不受影响**

Run: `bunx vitest run && bunx tsc --noEmit`
Expected: 通过；`DB_STORAGE` 未设置时单元测试与类型检查行为不变。

- [ ] **Step 7: 提交**

```bash
git add package.json bun.lock .gitignore src/lib/sequelize.ts scripts/e2e-seed.ts \
  playwright.config.ts e2e/fixtures.ts e2e/smoke.spec.ts
git commit -m "test(e2e): add playwright harness with isolated database"
```

---

### Task 12: E2E 授权往返

**Files:**

- Create: `e2e/auth.ts`
- Create: `e2e/role-permission.spec.ts`
- Create: `e2e/field-pruning.spec.ts`

**Interfaces:**

- Consumes: Task 11 的种子、配置与 fixtures；Task 9 的 `aria-label`。
- Produces: `signIn(page, credentials, callbackUrl)` 辅助函数（填账号密码、点登录、等待目标 URL）。

- [ ] **Step 1: 写登录辅助与权限矩阵用例**

`e2e/auth.ts`：

```ts
import type { Page } from '@playwright/test';

export async function signIn(page: Page, user: { username: string; password: string }, callbackUrl: string) {
  await page.goto(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  await page.getByPlaceholder('用户账号').fill(user.username);
  await page.getByPlaceholder('用户密码').fill(user.password);
  await page.getByRole('button', { name: '登录' }).click();
  await page.waitForURL((url) => url.pathname === callbackUrl);
}
```

`e2e/role-permission.spec.ts`：

```ts
import { expect, test } from '@playwright/test';

import { signIn } from './auth';
import { E2E_OWNER, E2E_RESTRICTED_ROLE } from './fixtures';

test('restrictions survive a save and reload', async ({ page }) => {
  await signIn(page, E2E_OWNER, '/dashboard/role');
  await page
    .getByRole('row', { name: new RegExp(E2E_RESTRICTED_ROLE) })
    .getByRole('link', { name: '编辑' })
    .click();

  await page.getByLabel('Role:read').check();
  await page.getByLabel('限制:Role').click();
  await page.getByLabel('字段限制').click();
  await page.getByRole('option', { name: '备注' }).click();
  // 第一次 Escape 收起下拉，第二次关闭抽屉
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '保存' }).click();

  await expect(page.getByText('权限已保存')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Role:read')).toBeChecked();
  await expect(page.getByLabel('限制:Role')).toBeEnabled();
});

test('built-in roles are read-only', async ({ page }) => {
  await signIn(page, E2E_OWNER, '/dashboard/role');
  await page
    .getByRole('row', { name: /拥有者/ })
    .getByRole('link', { name: '编辑' })
    .click();

  await expect(page.getByText('内置角色权限由权限目录同步维护')).toBeVisible();
  await expect(page.getByLabel('all:manage')).toBeDisabled();
});
```

- [ ] **Step 2: 写字段裁剪用例**

`e2e/field-pruning.spec.ts`：

```ts
import { expect, test } from '@playwright/test';

import { signIn } from './auth';
import { E2E_TARGET_USERNAME, E2E_VIEWER } from './fixtures';

test('restricted role sees pruned columns, fields and writes', async ({ page }) => {
  await signIn(page, E2E_VIEWER, '/dashboard/user');

  await expect(page.getByRole('columnheader', { name: '用户名' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '邮箱' })).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: '状态' })).toHaveCount(0);

  await page
    .getByRole('row', { name: new RegExp(E2E_TARGET_USERNAME) })
    .getByRole('link', { name: '编辑' })
    .click();

  await expect(page.getByLabel('用户名')).toBeVisible();
  await expect(page.getByLabel('用户昵称')).toBeVisible();
  await expect(page.getByLabel('手机号码')).toHaveCount(0);
  await expect(page.getByLabel('角色')).toHaveCount(0);

  await page.getByLabel('用户昵称').fill('改名成功');
  await page.getByRole('button', { name: '提交' }).click();
  await expect(page).toHaveURL(/\/dashboard\/user$/);

  await page
    .getByRole('row', { name: new RegExp(E2E_TARGET_USERNAME) })
    .getByRole('link', { name: '编辑' })
    .click();
  await expect(page.getByLabel('用户昵称')).toHaveValue('改名成功');
});
```

- [ ] **Step 3: 用 Playwright MCP 校准选择器**

在与 `playwright.config.ts` 相同的环境（`DB_STORAGE='./.e2e/database.sqlite'` 的 dev 服务）里，用 MCP 打开对应页面，`browser_snapshot` 确认以下目标真实存在：登录占位符「用户账号 / 用户密码」、`Role:read`、`限制:Role`、`字段限制`、「备注」选项、列头「用户名」、表单标签「用户昵称」。不一致就修用例的选择器，不放宽断言；MCP 不可用时跳过此步。

- [ ] **Step 4: 运行 E2E**

Run: `bunx playwright test`
Expected: 4 passed（冒烟 + 2 + 1）。失败时先看 `test-results/` 的 trace 与截图，修实现或选择器，不放宽断言。

- [ ] **Step 5: 复跑全量校验**

Run: `bunx oxlint && bunx oxfmt --check && bunx tsc --noEmit && bunx vitest run`
Expected: 全部通过。

- [ ] **Step 6: 提交**

```bash
git add e2e
git commit -m "test(e2e): cover role restrictions and field pruning round trip"
```
