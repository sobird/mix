# Phase 2 结构清理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把读写操作收口到 services，菜单改为全局定义 + 用户偏好并由 RSC 注入，删除死代码和实验路由。

**Architecture:** Server Actions 只保留校验与跳转，读写由 `RoleService` / `UserService` / `PermissionService` 完成，服务内用 Phase 0 的 `isAllowed` / `paginateAccessible` 做授权。`menus` 去掉 `user_id`、关联 `permission_id`；`user_menu_preferences` 存收藏/隐藏/排序；`dashboard/layout.tsx` 变为 RSC，按能力过滤后把菜单传给客户端外壳。实验路由整体移到 `examples/routes/`。

**Tech Stack:** Next.js 16 RSC / Server Actions、React 19、Sequelize 6 + SQLite、antd 6、CASL 7、Vitest。

**Spec:** `docs/superpowers/specs/2026-10-29-architecture-baseline-design.md`

## Global Constraints

- Phase 0 / Phase 1 已交付：直接使用 `getAbility`、`getCurrentAbility`、`isAllowed`、`queryAccessible`、`toAccessQuery`、`AppAbility`、`AppActions`、`AppSubject`、`RolePermission.narrowing`、`runMigrations`、`db-tools.cjs`。
- 不新增运行时依赖；菜单与权限目录都以代码为源。
- 迁移只向前。新增 `002` 必须对全新库幂等：`001-baseline` 的 `context.sync()` 会先按当前模型建表，因此 `002` 对已存在的表/列必须跳过。
- 数据库测试只用内存库（`useInMemoryDatabase()`）；禁止读写 `./database.sqlite`。
- 失败关闭：没有能力时列表返回空页、菜单为空，不得返回全表。
- `bunx tsc --noEmit`、`bunx vitest run`、`bun run lint`、`bun run format:check`、`shellcheck scripts/*.sh` 必须通过。
- 归档的实验路由不删除内容，移到 `examples/routes/`，并从 tsc / oxlint / oxfmt 中排除。

## Review Focus

1. 未登录访问 `/dashboard` → 重定向到 `/signin`，不渲染菜单或数据。
2. 成员（三个 subject 的 `read`）→ 菜单可见、列表可见，但所有写动作被服务拒绝。
3. 只有条件 `read` 的用户 → 对应菜单隐藏，列表为 0 条，绝不能是全表。
4. 菜单偏好按用户隔离：A 收藏或隐藏菜单不改变 B 的菜单。
5. 实验路由移除后不可访问；全仓不再有 `MenuService` / axios `/menu` 调用。

---

### Task 1: 菜单全局化与偏好模型

**Files:**

- Modify: `src/models/Menu.ts`
- Create: `src/models/UserMenuPreference.ts`
- Modify: `src/models/User.ts`
- Modify: `src/models/index.ts`
- Create: `src/migrations/002-menu-preferences.ts`
- Modify: `src/migrations/index.ts`
- Modify: `src/lib/migrator.test.ts`
- Modify: `tests/helpers/factories.ts`
- Modify: `tests/helpers/seeds.ts`
- Modify: `src/models/__mocks__/index.ts`
- Modify: `src/models/index.test.ts`
- Test: `src/models/Menu.test.ts`、`src/models/UserMenuPreference.test.ts`、`src/migrations/002-menu-preferences.test.ts`

**Interfaces:**

- Produces:
  - `Menu.permissionId: number | null`；删除 `Menu.userId` 与 `User.hasMany(Menu)`
  - `UserMenuPreference`: `userId`、`menuId`、`favorite: boolean`、`hidden: boolean`、`sort: number`，复合主键 `(userId, menuId)`，`paranoid: false`
  - `MIGRATIONS = [baseline, menuPreferences]`；全新库一次跑出 `['001-baseline', '002-menu-preferences']`

- [ ] **Step 1: 写失败测试**

```ts
// src/models/Menu.test.ts（替换原 belongs to a user / cascades 用例）
it('links to a permission instead of a user', async () => {
  const permission = await createPermission({ action: 'read', subject: 'User' });
  const menu = await createMenu({ permissionId: permission.id });
  expect((await menu.getPermission())?.id).toBe(permission.id);
});
it('allows a permission-less menu for always-visible entries', async () => {
  const menu = await createMenu({ permissionId: null });
  expect(menu.permissionId).toBeNull();
});

// src/models/UserMenuPreference.test.ts
it('stores one preference row per user and menu', async () => {
  const user = await createUser();
  const menu = await createMenu();
  await createUserMenuPreference({ userId: user.id, menuId: menu.id, favorite: true, hidden: true, sort: 2 });
  await expect(
    createUserMenuPreference({ userId: user.id, menuId: menu.id, favorite: false, hidden: false, sort: 1 }),
  ).rejects.toBeInstanceOf(UniqueConstraintError);
});

// src/migrations/002-menu-preferences.test.ts
it('upgrades a phase 1 menus table', async () => {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.dropTable('menus');
  await queryInterface.createTable('menus', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER },
    name: { type: DataTypes.STRING, allowNull: false },
    href: { type: DataTypes.STRING, allowNull: false },
    icon: { type: DataTypes.STRING },
    description: { type: DataTypes.STRING },
    parent_id: { type: DataTypes.INTEGER },
    sort: { type: DataTypes.INTEGER },
    created_at: { type: DataTypes.DATE },
    updated_at: { type: DataTypes.DATE },
    deleted_at: { type: DataTypes.DATE },
  });
  await runMigrations(sequelize);
  const columns = await queryInterface.describeTable('menus');
  expect(columns.permission_id).toBeDefined();
  expect(columns.user_id).toBeUndefined();
  expect(await queryInterface.showAllTables()).toContain('user_menu_preferences');
});
it('is a no-op on a freshly synced database', async () => {
  expect(await runMigrations(sequelize)).toEqual(['001-baseline', '002-menu-preferences']);
  expect(await runMigrations(sequelize)).toEqual([]);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/models/Menu.test.ts src/models/UserMenuPreference.test.ts src/migrations/002-menu-preferences.test.ts`
Expected: FAIL（模型/迁移不存在）

- [ ] **Step 3: 实现**

- `Menu`：删除 `userId` 属性、`User` 关联与索引；新增 `permissionId`（可空，`references: Permission`，`onDelete: 'CASCADE'`）；新增 `getPermission` 类型与 `static associate` 中的 `this.belongsTo(Permission, { foreignKey: 'permissionId' })`；保留 `parent/children`。
- `UserMenuPreference`：参考 `UserRole` 写法（无 `id`、`paranoid: false`）；`userId` 与 `menuId` 都 `allowNull: false, primaryKey: true`；`favorite` 默认 `false`、`hidden` 默认 `false`、`sort` 默认 `0`；`belongsTo(User)` 与 `belongsTo(Menu)`，外键 `onDelete: 'CASCADE'`。
- `User.ts`：删除 `Menu` 类型导入、`Menus` 相关声明、`associate` 中的 `hasMany(Menu)` 与解构参数。
- `index.ts`：导入/导出/注册 `UserMenuPreference`。
- `002-menu-preferences.ts`：`up` 中用 `describeTable('menus')` 判断列；存在 `user_id` 时先 `removeIndex('menus', 'menus_user_id')`（不存在则忽略）再 `removeColumn('menus', 'user_id')`（SQLite 会重建表）；随后缺少 `permission_id` 时 `addColumn`（`allowNull: true, references: { model: 'permissions', key: 'id' }, onDelete: 'CASCADE'`）；用 `showIndex('menus')` 补回 `menus_parent_id` 与 `menus_permission_id`；`showAllTables()` 不含 `user_menu_preferences` 时 `createTable`（列与模型一致，主键 `(user_id, menu_id)`）。`down` 反向恢复。
- `migrations/index.ts`：`MIGRATIONS = [baseline, menuPreferences]`。
- `tests/helpers/factories.ts`：`createMenu` 不再注入 `userId`；新增 `createUserMenuPreference`。
- `tests/helpers/seeds.ts`：`loadModels`/`useModels` 加入 `@/models/UserMenuPreference`；`seedMenus` 改为全局菜单（`where: { href }`，不再带 `userId`）；新增 `seedUserMenuPreferences` 并在 `seedAll` 中调用。
- `src/models/__mocks__/index.ts`：导出中加入 `UserMenuPreference`。
- `src/models/index.test.ts`：模型列表加入 `UserMenuPreference`，删除 `User.associations.Menus` 断言。
- `src/lib/migrator.test.ts`：把 `['001-baseline']` 改为 `['001-baseline', '002-menu-preferences']`。

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/models src/migrations src/lib/migrator.test.ts && bunx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/models src/migrations src/lib/migrator.test.ts tests/helpers
git commit -m "feat(menu): make menus global and add user preferences"
```

---

### Task 2: 菜单目录同步

**Files:**

- Create: `src/menus/catalog.ts`
- Create: `src/services/menu-catalog.ts`
- Modify: `scripts/seed.ts`
- Modify: `scripts/sync-catalog.ts`
- Modify: `scripts/db-tools.ts`
- Test: `src/services/menu-catalog.test.ts`

**Interfaces:**

- Consumes: `syncPermissionCatalog`、`Permission`
- Produces:
  - `interface MenuDefinition { href: string; name: string; icon?: string; sort: number; permission?: { action: AppActions; subject: AppSubject } }`
  - `MENU_CATALOG: MenuDefinition[]`
  - `syncMenuCatalog(): Promise<{ menus: number }>`（返回新建数量；已存在则更新并返回 0）

- [ ] **Step 1: 写失败测试**

```ts
it('creates the catalog once and links permissions', async () => {
  await syncPermissionCatalog();
  expect((await syncMenuCatalog()).menus).toBe(MENU_CATALOG.length);
  expect((await syncMenuCatalog()).menus).toBe(0);
  const menu = await Menu.findOne({ where: { href: '/dashboard/user' } });
  expect((await menu!.getPermission())?.subject).toBe('User');
});
it('repairs a drifted row without deleting extra menus', async () => {
  await syncPermissionCatalog();
  await syncMenuCatalog();
  const extra = await createMenu({ href: '/legacy' });
  const menu = await Menu.findOne({ where: { href: '/dashboard/user' } });
  await menu!.update({ name: '旧名字' });
  await syncMenuCatalog();
  expect((await Menu.findByPk(menu!.id))?.name).toBe('用户管理');
  expect(await Menu.findByPk(extra.id)).not.toBeNull();
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/services/menu-catalog.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现**

- `catalog.ts`：按顺序定义
  - `后台首页` `/dashboard`，无权限
  - `用户管理` `/dashboard/user`，`read User`
  - `角色管理` `/dashboard/role`，`read Role`
  - `权限管理` `/dashboard/permission`，`read Permission`
- `syncMenuCatalog`：逐个定义按 `href` `findOrCreate`；定义带权限时先按 `(action, subject)` 查 `Permission`，查不到直接抛错（目录不同步就该让部署失败）；已存在行更新 `name/icon/sort/permissionId`；不删除任何不在目录中的菜单。
- `scripts/seed.ts`、`scripts/sync-catalog.ts`、`scripts/db-tools.ts` 的 `sync-catalog` 分支：在 `syncPermissionCatalog()` 之后调用 `syncMenuCatalog()`，输出合并后的统计。

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/services/menu-catalog.test.ts && bunx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/menus src/services/menu-catalog.ts src/services/menu-catalog.test.ts scripts
git commit -m "feat(menu): sync menu catalog during deploy"
```

---

### Task 3: RSC 菜单与偏好

**Files:**

- Modify: `src/services/menu.ts`（整体重写）
- Create: `src/services/menu-preferences.ts`
- Create: `src/actions/menu.ts`
- Create: `src/components/layout/dashboard/shell.tsx`
- Modify: `src/app/dashboard/layout.tsx`
- Modify: `src/components/layout/dashboard/aside/index.tsx`
- Delete: `src/store/slices/menu.ts`
- Modify: `src/store/slices/index.ts`
- Delete: `src/components/layout/dashboard/search/`
- Test: `src/services/menu.test.ts`、`src/services/menu-preferences.test.ts`、`src/app/dashboard/layout.test.ts`

**Interfaces:**

- Consumes: `loadUserGrants`、`buildAbility`、`UserMenuPreference`、`ActionStatus`
- Produces:
  - `interface MenuNode { id: number; name: string; href: string; icon: string | null; sort: number; favorite: boolean }`
  - `interface MenuView { items: MenuNode[]; favorites: MenuNode[] }`
  - `getMenuForUser(userId: number | null): Promise<MenuView>`（`null` → 空菜单）
  - `setFavoriteMenus(userId: number, menuIds: number[]): Promise<void>`（上限 10，其余置 `favorite: false`）
  - `updateMenuPreferencesAction(menuIds: number[]): Promise<{ status: ActionStatus; message?: string }>`

- [ ] **Step 1: 写失败测试**

```ts
// src/services/menu.test.ts
it('returns an empty menu for guests', async () => {
  expect(await getMenuForUser(null)).toEqual({ items: [], favorites: [] });
});
it('filters menus by unconditional read permission', async () => {
  await syncPermissionCatalog();
  await syncMenuCatalog();
  const user = await createUser();
  const role = await createRole();
  const permission = await Permission.findOne({ where: { action: 'read', subject: 'User' } });
  await createRolePermission({ roleId: role.id, permissionId: permission!.id });
  await createUserRole({ userId: user.id, roleId: role.id });
  const view = await getMenuForUser(user.id);
  expect(view.items.map((item) => item.href)).toEqual(['/dashboard', '/dashboard/user']);
});
it('hides menus for conditional read grants', async () => {
  // 授予 read User + conditions { id: 1 }，菜单不出现
});

// src/services/menu-preferences.test.ts
it('isolates favorites per user', async () => {
  const a = await createUser();
  const b = await createUser();
  const menu = await createMenu();
  await setFavoriteMenus(a.id, [menu.id]);
  expect((await getMenuForUser(a.id)).favorites.map((item) => item.id)).toEqual([menu.id]);
  expect((await getMenuForUser(b.id)).favorites).toEqual([]);
});
it('rejects more than ten favorites', async () => {
  await expect(
    setFavoriteMenus(
      1,
      Array.from({ length: 11 }, (_, i) => i + 1),
    ),
  ).rejects.toThrow();
});

// src/app/dashboard/layout.test.ts
import { redirect } from 'next/navigation';

import DashboardLayout from './layout';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));
vi.mock('@/services/auth', () => ({ getSessionUserId: vi.fn().mockResolvedValue(null) }));
it('redirects guests to signin', async () => {
  await expect(DashboardLayout({ children: null })).rejects.toThrow('NEXT_REDIRECT');
  expect(redirect).toHaveBeenCalledWith('/signin');
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/services/menu.test.ts src/services/menu-preferences.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现**

- `getMenuForUser`：`Menu.findAll({ include: [Permission] })`；无权限的菜单始终可见；有权限的菜单仅当 `ability.can(permission.action, permission.subject)` 为真时可见（条件规则在字符串判断下为 false，按失败关闭处理）；读取该用户的 `UserMenuPreference`，`hidden` 过滤，`sort` 覆盖默认排序；`favorite` 标记并单独组成 `favorites`（按偏好 `sort`）。能力直接用 `buildAbility(await loadUserGrants(userId))`，不经过 `React.cache`，保证测试确定性。
- `setFavoriteMenus`：事务内先把所有偏好 `favorite` 置 false，再对传入 `menuIds` 逐个 `upsert({ userId, menuId, favorite: true })`；长度 > 10 抛错。
- `src/actions/menu.ts`：`updateMenuPreferencesAction` 读取 `getSessionUserId()`，无会话返回 `{ status: ActionStatus.FAILURE }`；调用 `setFavoriteMenus` 后 `revalidatePath('/dashboard', 'layout')`。
- `src/app/dashboard/layout.tsx`：改为 async 服务端组件；`const userId = await getSessionUserId(); if (!userId) redirect('/signin')`；`const menu = await getMenuForUser(userId)`；返回 `<DashboardShell menu={menu}>{children}</DashboardShell>`。
- `shell.tsx`：`'use client'`，保留原布局的 `collapsed`（继续用 `useAppSelector`/`toggleAside`），渲染 `Header`、`Aside`、`main`。
- `aside/index.tsx`：改为接收 `{ menu, collapsed }`；用 `menu.items` / `menu.favorites` 渲染；收藏编辑保存时调用 `updateMenuPreferencesAction` 并 `useRouter().refresh()`；删除 `MenuService`、`fetchMenu`、badge、Redux menu 相关代码。
- 删除 `src/store/slices/menu.ts`，`src/store/slices/index.ts` 只保留 `app`；删除未被引用的 `src/components/layout/dashboard/search/`。

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/services/menu.test.ts src/services/menu-preferences.test.ts && bunx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/services src/actions/menu.ts src/app/dashboard/layout.tsx src/components/layout/dashboard src/store/slices
git commit -m "feat(menu): render permission-filtered menu from RSC"
```

---

### Task 4: actions → services 收口

**Files:**

- Create: `src/services/access.ts`
- Create: `src/services/errors.ts`
- Create: `src/services/user.ts`
- Modify: `src/services/role.ts`
- Modify: `src/actions/role.ts`
- Modify: `src/actions/user.tsx`
- Modify: `src/app/dashboard/role/page.tsx`
- Modify: `src/app/dashboard/user/page.tsx`
- Modify: `src/app/dashboard/role/[id]/edit/page.tsx`
- Modify: `src/app/dashboard/user/[id]/edit/page.tsx`
- Test: `src/services/access.test.ts`、`src/services/role.test.ts`、`src/services/user.test.ts`、`src/actions/role.test.ts`

**Interfaces:**

- Produces:
  - `class ForbiddenError extends Error`、`class NotFoundError extends Error`
  - `interface PageQuery { pn?: string | number; ps?: string | number }`
  - `paginateAccessible<M extends Model>(model: ModelStatic<M>, ability: AppAbility, action: AppActions, query: PageQuery, options?: { exclude?: string[] }): Promise<{ pn: number; ps: number; count: number; rows: Attributes<M>[] }>`
  - `RoleService.listWithPage(ability, query)`、`findForEdit(ability, id)`、`create(ability, data): Promise<[Role, boolean]>`、`update(ability, id, data): Promise<void>`、`remove(ability, id): Promise<void>`、`savePermissions(ability, roleId, input): Promise<void>`
  - `UserService.listWithPage(ability, query)`、`findForEdit(ability, id)`、`create(ability, data): Promise<[User, boolean]>`、`update(ability, id, data): Promise<void>`、`remove(ability, id): Promise<void>`

- [ ] **Step 1: 写失败测试**

```ts
// src/services/access.test.ts
it('returns an empty page without read rules', async () => {
  const page = await paginateAccessible(Role, buildAbility([]), 'read', {});
  expect(page).toEqual({ pn: 1, ps: 20, count: 0, rows: [] });
});
it('applies conditional read as a where clause', async () => {
  const role = await createRole();
  await createRole();
  const ability = buildAbility([{ action: 'read', subject: 'Role', narrowing: { conditions: { id: role.id } } }]);
  const page = await paginateAccessible(Role, ability, 'read', {});
  expect(page.rows.map((row) => row.id)).toEqual([role.id]);
});

// src/services/role.test.ts
it('rejects writes from a member', async () => {
  const ability = buildAbility([{ action: 'read', subject: 'Role', narrowing: {} }]);
  await expect(RoleService.create(ability, { name: '新角色' })).rejects.toBeInstanceOf(ForbiddenError);
});
it('checks the role instance on update', async () => {
  const allowed = await createRole();
  const other = await createRole();
  const ability = buildAbility([{ action: 'update', subject: 'Role', narrowing: { conditions: { id: allowed.id } } }]);
  await expect(RoleService.update(ability, other.id, { name: '改名' })).rejects.toBeInstanceOf(ForbiddenError);
});

// src/services/user.test.ts
it('assigns the default role when an admin creates a user', async () => {
  const ability = buildAbility([{ action: 'create', subject: 'User', narrowing: {} }]);
  const [user] = await UserService.create(ability, { username: 'new', email: 'new@mix.local', password: 'secret12' });
  expect((await user.getRoles()).map((role) => role.name)).toContain('成员');
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/services/access.test.ts src/services/role.test.ts src/services/user.test.ts`
Expected: FAIL

- [ ] **Step 3: 实现**

- `paginateAccessible`：`toAccessQuery`；`none` → 空页；`all` → `findAndCountAll`；`filter` → `findAndCountAll({ where })`；`ps` 默认 20、`pn` 默认 1、`order: [['createdAt', 'DESC']]`，`options.exclude` 传给 `attributes`，`rows` 用 `toJSON()` 变成纯对象。
- `RoleService`：写方法先 `isAllowed`，实例方法先 `findByPk` 再对实例判断；未找到抛 `NotFoundError`；`savePermissions` 的 `fields` 映射为 `narrowing: fields?.length ? { fields } : null`；保留 `assignDefaultRole` / `assignOwnerToFirstUser` / `setDefaultRole`。
- `UserService`：`listWithPage` 调用 `paginateAccessible(..., { exclude: ['password'] })`；`create` 用 `findOrCreate`（`emailVerified: new Date()`），`data.roles` 非空时 `setRoles`，否则 `RoleService.assignDefaultRole`；`update` 排除密码字段并调用 `setRoles`；`findForEdit` 返回不含密码且带 `roles: number[]` 的普通对象。
- `src/actions/role.ts` / `user.tsx`：保留 zod 校验、`revalidatePath`、`redirect`；取消直接操作模型，改为调用服务；捕获 `ForbiddenError` → `{ status: ActionStatus.FAILURE, message }`，捕获 `NotFoundError` → 对应提示；`createRoleActionWithRedirect` 等待服务结果后再跳转。
- 更新 `src/actions/role.test.ts`：mock `@/services/ability` 返回 `manage all`，把断言从 `RolePermission.rules` 改为 `RolePermission.narrowing === { fields: ['username', 'email'] }`。
- 四个 dashboard 页面：用 `await getCurrentAbility()` + 对应 service 取数；页面不再 `import { Role, User } from '@/models'`。

- [ ] **Step 4: 运行测试**

Run: `bunx vitest run src/services src/actions && bunx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/services src/actions src/app/dashboard
git commit -m "refactor(services): move authorization into services"
```

---

### Task 5: 权限服务、lib 解耦与死代码归档

**Files:**

- Modify: `src/services/permission.ts`
- Modify: `src/app/dashboard/permission/page.tsx`
- Delete: `src/app/dashboard/permission/form.tsx`、`form2.tsx`、`form.module.scss`、`create/`
- Modify: `src/lib/sequelize.ts`
- Modify: `src/models/Role.ts`
- Delete: `src/components/with-auth/`
- Archive: `src/app/rsc/`、`src/app/dev/`、`src/app/mail/`、`src/app/page/`、`src/app/api/rsc/` → `examples/routes/`
- Delete: `src/app/icon.tsx.bak`
- Modify: `tsconfig.json`、`.oxlintrc.json`、`.oxfmtrc.json`
- Test: `src/services/permission.test.ts`、`src/app/experimental-routes.test.ts`

**Interfaces:**

- Consumes: `queryAccessible`
- Produces:
  - `PermissionService.list(ability: AppAbility): Promise<Array<{ id: number; name: string; action: string; subject: string; description: string | null }>>`
  - `src/lib/sequelize.ts` 不再 import 任何 `@/models` 或 CASL 类型

- [ ] **Step 1: 写失败测试**

```ts
it('returns permissions for a reader', async () => {
  await syncPermissionCatalog();
  const rows = await PermissionService.list(buildAbility([{ action: 'read', subject: 'Permission', narrowing: {} }]));
  expect(rows.map((row) => row.subject)).toContain('User');
});
it('returns nothing without read rules', async () => {
  expect(await PermissionService.list(buildAbility([]))).toEqual([]);
});

// src/app/experimental-routes.test.ts
it('moves experimental routes out of src/app', () => {
  expect(existsSync('src/app/rsc')).toBe(false);
  expect(existsSync('src/app/api/rsc')).toBe(false);
  expect(existsSync('examples/routes/rsc')).toBe(true);
  expect(existsSync('examples/routes/api-rsc')).toBe(true);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `bunx vitest run src/services/permission.test.ts`
Expected: FAIL（旧服务返回 1212）

- [ ] **Step 3: 实现**

- `PermissionService.list`：`queryAccessible(Permission, ability, 'read')`，按 `subject, action` 排序，返回纯对象。
- `dashboard/permission/page.tsx`：RSC，`const ability = await getCurrentAbility()`，用 antd `Table` 展示 `PermissionService.list(ability)`；删除两个实验表单与 `create` 路由。
- `lib/sequelize.ts`：删除 CASL 类型导入、`accessibleBy`、`Models` 导入、`PermissionTemplate`、`BaseModel.permission`、`findManyWithAccessible`；`associate?: (models: Record<string, any>) => void`；保留 `findManyByPage`。
- `Role.ts`：删除 `PermissionTemplate`、`static permission` 及不再使用的 CASL 导入。
- 归档命令（在仓库根执行）：

```bash
mkdir -p examples/routes
git mv src/app/rsc examples/routes/rsc
git mv src/app/dev examples/routes/dev
git mv src/app/mail examples/routes/mail
git mv src/app/page examples/routes/page
git mv src/app/api/rsc examples/routes/api-rsc
git rm src/app/icon.tsx.bak
git rm -r src/components/with-auth
```

- `tsconfig.json` 的 `exclude` 加 `"examples"`；`.oxlintrc.json` 与 `.oxfmtrc.json` 的 `ignorePatterns` 加 `"examples"`。

- [ ] **Step 4: 运行测试与检查**

Run: `bunx vitest run src/services/permission.test.ts && bunx tsc --noEmit && bun run lint`
Expected: PASS；`rg "@/models" src/lib` 无结果

- [ ] **Step 5: 提交**

```bash
git add src examples tsconfig.json .oxlintrc.json .oxfmtrc.json
git commit -m "refactor: remove reverse deps and archive experimental routes"
```

---

### Task 6: 文档与全量验证

**Files:**

- Modify: `CLAUDE.md`

- [ ] **Step 1: 更新说明**

记录：dashboard 布局是 RSC，菜单来自 `menus` + `user_menu_preferences` 并由能力过滤；写操作经 services；实验路由在 `examples/routes/`；新增迁移 `002`。

- [ ] **Step 2: 运行全量检查**

Run: `bunx vitest run && bunx tsc --noEmit && bun run lint && bun run format:check && shellcheck scripts/*.sh`
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: describe phase 2 structure"
```

---

## 自检清单（执行者收尾）

- [ ] `rg "@/models" src/lib` 无结果。
- [ ] `rg "MenuService|state\.menu|slices/menu|/menu'|/menu\"" src` 无结果（`src/proxy.ts` 的 next-auth `withAuth` 除外）。
- [ ] `rg "accessibleBy|findManyWithAccessible|with-auth" src` 无结果。
- [ ] `rg "from '@/models'" src/app/dashboard` 无结果。
- [ ] `/dashboard` 未登录会重定向，成员只能读，条件读用户列表为空。
- [ ] 菜单偏好测试证明用户之间互不影响。
- [ ] Review Focus 的 5 类输入都有对应用例。
