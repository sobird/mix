# 角色权限编辑器设计（含字段级生效）

- 日期：2026-10-30
- 状态：设计稿（待独立评审与作者确认）
- 读者：项目作者与后续实施者

## 1. 目的与边界

**目的**：在角色编辑页提供一套「权限矩阵 + 限制抽屉」的编辑界面，让拥有者（或任何持有 `update:Role` 的用户）一次性配置角色的全部授予，并能对单条授予设置字段限制、数据条件、过期时间和拒绝规则；同时让 `fields` 限制真正在读写路径上生效。

**范围**：

- 权限目录中的三个资源：`User`、`Role`、`Permission`，以及 `manage:all`。
- 授予的字段限制在「读列裁剪 / 写字段过滤」两个方向生效。
- `RoleService.savePermissions` 的数据契约扩展到 `fields`、`conditions`、`inverted`、`expiresAt`。
- 角色编辑页接入该界面，保存走现有 `saveRolePermissions` action。

**非目标**：

- 不更换 CASL / Sequelize / antd 选型，不新增权限目录条目。
- 不做用户—角色绑定（`user_roles.expires_at`）的编辑界面。
- 不改动菜单权限模型的字段粒度（目录中 `Menu` 没有授予规则）。
- 不做条件行的 OR 组合、嵌套条件或自由 JSON 编辑。

## 2. 现状与缺口

- 权限目录固定为 12 条 CRUD 权限 + 1 条 `manage:all`（`src/permissions/catalog.ts`）。
- `saveRolePermissions`（`src/actions/role.ts`）已存在，但没有任何页面调用。
- `RoleService.savePermissions` 只接受 `{ action, fields }`，写入时把 `expiresAt` 和 `conditions`、`inverted` 全部丢掉；`Permission.findOrCreate` 没有 `defaults`，目录外的权限会因 `name NOT NULL` 失败。
- `RoleService.findForEdit` 只 include `Permissions`，没有加载 through 上的 `narrowing` / `expiresAt`，页面读不到现有限制。
- `fields` 只被存储和校验，`paginateAccessible`、`queryAccessible`、`isAllowed`、表单都不按字段裁剪，属于「摆设」。
- `isAllowed` 在有实例时按条件精确判断；无条件规则才允许无实例判断。字段级判断需要另走 CASL 的 `ability.can(action, subject(...instance), field)`。
- `toAccessQuery` 认识的 Sequelize 操作符来自 `Op` 键名；而 CASL 的条件使用 MongoDB 操作符（如 `$nin`）。两者需要一个别名映射才能同时成立。

## 3. 使用角色与权限门槛

- 入口只有角色编辑页 `/dashboard/role/[id]/edit`，页面通过 `RoleService.findForEdit` 做 `update:Role` 的实例级判断；无权与不存在统一 404。
- 矩阵只对 `isBuiltin === false` 的角色可编辑。三个内置角色的授予由 `syncPermissionCatalog` 每次重建，界面显示只读提示并禁用全部控件。
- 保存动作在服务端再次校验 `update:Role`，失败翻译为 action state 的失败消息。

## 4. 界面设计

### 4.1 页面结构

```
角色编辑
┌──────────────────────────────────────────────┐
│ 角色名称 / 备注                                │
│                         [重置] [提交]          │
└──────────────────────────────────────────────┘

权限配置
┌──────────────────────────────────────────────┐
│ 资源       查看  创建  更新  删除    限制       │
│ 用户       [x]   [ ]   [x]   [ ]    2 项      │
│ 角色       [x]   [ ]   [ ]   [ ]    —         │
│ 权限       [x]   [ ]   [ ]   [ ]    —         │
│ 系统管理   [ ] 管理全部                        │
│                         [重置] [保存]          │
└──────────────────────────────────────────────┘
```

- `RoleForm` 保持现状，权限区是独立组件，不在同一个 antd Form 内，避免两套提交语义混在一起。
- 权限区自带「重置」与「保存」，保存调用 `saveRolePermissions`，成功后 `message.success` 并刷新页面。

### 4.2 矩阵

- 行来自 `PERMISSION_CATALOG` 的三个 subject，列固定为 `read | create | update | delete`。
- `manage:all` 单独一行，勾选等于授予 `manage:all`；勾选它不会自动勾选或取消其他格子，仅作为获得全部能力的提示。
- 单元格勾选 = 该 `(subject, action)` 授予存在；取消勾选 = 保存时删除该授予。
- 「限制」列显示该资源下已设置非空限制的授予数量；没有任何勾选时显示 `—` 且不可点击。
- 点击「限制」打开限制抽屉，抽屉内用 Segmented/Tabs 在「该资源已勾选的 action」之间切换，一次编辑一条授予。`manage:all` 行同样可打开抽屉，但只显示过期与高级项。
- 已过期（`expiresAt <= now`）的授予仍显示为勾选状态并标记「已过期」；保存时原样保留，由拥有者决定是否取消勾选或改期，避免「打开页面再保存」把过期配置悄悄删掉。

### 4.3 限制抽屉

每个 action 的授予包含四块：

1. **字段限制**：多选，选项来自该资源的字段元数据。留空表示不限制；`manage:all` 下禁用并提示「系统管理不支持字段限制」。
2. **数据条件**：通用条件行，一行一个字段，行间为 AND。每行由「字段 / 操作符 / 值」组成：
   - 字段从该资源的条件字段元数据中选；
   - 操作符：等于、不等于、属于、不属于；
   - 值控件按字段类型渲染：布尔 → 开关，数字 → 数字输入，枚举 → 下拉，文本 → 输入框；「属于 / 不属于」渲染为多值输入。
   - 同一字段只允许出现一行，重复时取最后一行并在界面上提示。
   - `create` 授予不显示条件区（条件对创建没有意义），其余 action 显示。
3. **过期时间**：日期时间选择器，留空表示永不过期。存储为 `role_permissions.expires_at`。
4. **高级**（折叠）：拒绝规则开关，对应 `narrowing.inverted`。拒绝规则在 CASL 中最后加入，用于覆盖前面的允许规则。

不同 action 可编辑的限制项：

| action       | 字段 | 条件 | 过期 | 拒绝 |
| ------------ | ---- | ---- | ---- | ---- |
| `read`       | ✓    | ✓    | ✓    | ✓    |
| `create`     | —    | —    | ✓    | ✓    |
| `update`     | ✓    | ✓    | ✓    | ✓    |
| `delete`     | —    | ✓    | ✓    | ✓    |
| `manage:all` | —    | —    | ✓    | ✓    |

字段限制只作用于读列裁剪和更新字段过滤；创建与删除是行级授予，字段对其没有意义，界面不提供。`create` 不显示条件（条件对创建没有意义）；`manage:all` 也不显示条件——`all` 上的条件会被求值到所有模型，`status` 之类的列在 Role/Permission 上并不存在，运行时会导致查询失败。其余 action 显示条件。

抽屉内的修改只更新本地状态，点页面级「保存」时才整体提交。

### 4.4 内置角色

- `role.isBuiltin === true` 时整个权限区禁用，顶部提示「内置角色权限由权限目录同步维护，无法在此修改」。
- 服务端 `savePermissions` 不额外禁止内置角色，但目录同步会重建它们的授予；界面禁用是唯一防线，文档记录该取舍。

### 4.5 保存与反馈

- 保存是整体替换：提交当前矩阵的全部授予，`savePermissions` 先 `setPermissions([])` 再逐条写入。
- 提交前在客户端把状态整理为 `PermissionInput[]`，空限制不写入 `narrowing`，空条件/空字段/空过期都不写。
- 失败（无权、角色不存在、校验失败）返回 action state，界面用 `message.error` 展示。
- 保存成功后 `router.refresh()` 重新读取授予。

## 5. 字段与条件元数据

新增 `src/permissions/fields.ts`，只依赖类型，客户端与服务端都能 import：

```ts
type FieldKind = 'boolean' | 'number' | 'enum' | 'string';

interface FieldMeta {
  name: string;
  label: string;
  kind: FieldKind;
  options?: { value: string; label: string }[];
}

interface SubjectFieldMeta {
  /** 字段限制可选项（读写都按此收窄） */
  restrictable: FieldMeta[];
  /** 数据条件可选项（必须能出现在 where 中） */
  conditionable: FieldMeta[];
}
```

初始内容：

| 资源       | restrictable                                                                                       | conditionable                      |
| ---------- | -------------------------------------------------------------------------------------------------- | ---------------------------------- |
| User       | username, email, nickname, realname, mobile, gender, status, createdBy, updatedBy, roles（伪字段） | id, status, gender, createdBy      |
| Role       | name, description, isBuiltin, isDefault, editable, defaultable, parentId                           | id, isBuiltin, isDefault, parentId |
| Permission | name, description, action, subject                                                                 | id, action, subject                |

敏感字段（`password`、`salt`、`emailVerified`）不在任何列表中，现有 `UserExcludeAttributes` 仍然生效。`roles` 作为 User 的伪字段加入 `restrictable`，用于控制更新时能否改角色。

系统字段 `id`、`createdAt`、`updatedAt` 不参与字段限制，读裁剪时始终保留：列表的行键、编辑/删除链接和排序都依赖它们，且它们不承载业务敏感信息。其余未列入 `fields` 的业务字段照常被裁掉。

条件行与 `conditions` 的互转是纯函数，放在同一文件或相邻模块，便于单测：

- 等于 → `{ [field]: value }`
- 不等于 → `{ [field]: { $ne: value } }`
- 属于 → `{ [field]: { $in: values } }`
- 不属于 → `{ [field]: { $nin: values } }`

`$nin` 是 CASL/Mongo 写法。`src/lib/casl.ts` 的 `symbolize` 增加别名映射 `nin → Op.notIn`，让同一份条件既能被 `toAccessQuery` 转成 Sequelize where，也能被 CASL 做实例判断。

## 6. 数据契约

### 6.1 `PermissionInput`

```ts
export interface PermissionInput {
  subject: string;
  actions: {
    action: string;
    fields?: string[];
    conditions?: Record<string, unknown>;
    expiresAt?: string | null; // ISO 字符串，action 层转 Date
    inverted?: boolean;
  }[];
}
```

### 6.2 `savePermissions`

- 对每条授予构造 `narrowing`：

  ```ts
  const narrowing =
    fields?.length || conditions || inverted
      ? { fields: fields?.length ? fields : undefined, conditions, inverted: inverted || undefined }
      : null;
  ```

- `role.addPermission(permission, { through: { narrowing, expiresAt }, transaction })`。
- `Permission.findOrCreate` 增加 `defaults`：从 `PERMISSION_CATALOG` 取展示名，取不到时回退 `${action}:${subject}`，避免 `name NOT NULL` 失败。
- 仍使用事务与串行写入（SQLite 单连接）。

### 6.3 读取编辑器数据

新增 `RoleService.findPermissionEditor(ability, id)`，或在 `findForEdit` 上返回附加结构。建议新增方法，避免角色表单的返回值膨胀：

```ts
interface RolePermissionGrant {
  action: string;
  subject: string;
  fields: string[];
  conditions: Record<string, unknown> | null;
  expiresAt: string | null;
  inverted: boolean;
}
```

实现：`Role.findByPk(id, { include: [{ model: Permission, through: { attributes: ['narrowing', 'expiresAt'] } }] })`，用 `normalizeNarrowing` 归一化，时间转 ISO 字符串。已过期的授予同样返回（由界面标记），不在这里过滤。目录之外的授予不进入矩阵；保存整体替换时自然被删除。

### 6.4 Action 校验

`src/actions/role.ts` 的 `saveRolePermissions` 增加 zod 校验（`src/zod/role.ts`）：

- `action` 限定为目录中的 action，`subject` 限定为 `User | Role | Permission` 或 `all`；
- `fields` 必须是该 subject `restrictable` 中的字段名（User 允许 `roles` 伪字段）；`all` 不接受字段；
- 条件字段必须在该 subject 的 `conditionable` 中，操作符限定为 `eq | ne | in | nin`，值类型与字段类型匹配（布尔、数字、枚举、字符串或多值数组）；
- `expiresAt` 为合法日期或 null；
- `create` 不接受 `conditions`；`delete` / `manage:all` 不接受 `fields`；`subject === 'all'` 时只允许 `action === 'manage'` 且不接受 `conditions`；
- 校验失败返回失败 state。

字段与条件的允许清单同时服务于界面选项和服务端校验，避免绕过界面写入 `password`、`Roles` 关联或不存在的列。

## 7. 字段级生效

新增 `src/services/ability/fields.ts`：

```ts
/** 实例上某字段在指定 action 下是否被允许（条件按实例求值） */
export function canAccessField(ability, action, subjectName, instance, field): boolean;

/** 按能力裁剪只读行的字段 */
export function pruneReadableFields<T extends Record<string, unknown>>(
  ability,
  action,
  subjectName,
  row: T,
): Partial<T>;

/** 写入前静默丢弃越权字段 */
export function pickWritableFields<T extends Record<string, unknown>>(
  ability,
  action,
  subjectName,
  instance,
  data: T,
): Partial<T>;
```

实现基于 CASL：`ability.can(action, subject(subjectName, instance), field)`。规则没有 `fields` 时对任意字段返回 true；有 `fields` 时只对列出的字段返回 true；拒绝规则按最后规则生效。系统字段 `id`、`createdAt`、`updatedAt` 在 `pruneReadableFields` 中无条件保留。

字段判断跟随各路径现有的授权动作：列表与下拉按 `read`，编辑表单按 `update`。两者字段集合不同时各管各的——列表展示 read 允许的列，编辑表单只渲染 update 允许的字段。

生效点：

| 路径                                                  | 处理                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------- |
| `paginateAccessible`                                  | 在 `row.toJSON()` 之后按 `read` 逐行 `pruneReadableFields` |
| `RoleService.listOptions` / `PermissionService.list`  | 按 `read` 裁剪；`name` 被裁掉时选项标签回退为 `#<id>`      |
| `UserService.findForEdit` / `RoleService.findForEdit` | 按 `update` 裁剪（与现有授权检查一致）                     |
| `UserService.update` / `RoleService.update`           | 用实例级 `pickWritableFields`，静默丢弃越权字段            |

创建与删除是行级授予，不做字段裁剪：`isAllowed` 负责放行，创建字段限制不在本次范围内（避免把 `password` 等非展示字段卷进限制列表）。

补充约定：

- `roles` 是 User 的伪字段，只参与 update 判断：授予的 `fields` 不含 `roles` 时，用户更新里的角色分配被静默丢弃；创建时的 `roles` 与默认角色分配不受字段限制影响。
- `password`、`salt`、`emailVerified` 继续由 `UserExcludeAttributes` 排除，字段限制只会在其基础上进一步收窄。
- 菜单构建使用 `Menu` subject，目录中没有 Menu 规则，裁剪对其为无操作。

## 8. 安全与失败行为

- 越权字段静默丢弃，不报错；整体无权仍抛 `ForbiddenError`，由 action 翻译为提示。
- 损坏的 `narrowing` 由 `normalizeNarrowing` 判定为 `null`，该授予在加载时被跳过（失败关闭）。
- 拒绝规则始终最后加入。带 `fields` 的拒绝只隐藏列出的字段（CASL 字段级拒绝，`toAccessQuery` 看不到这类规则）；不带 `fields` 的拒绝作用于整行（`toAccessQuery` 生成 `$not`）。界面在勾选拒绝时提示这一区别。
- 过期的授予在 `loadUserGrants` 中被跳过（`expiresAt <= now`）。
- 保存整体替换，写操作在事务内完成。

## 9. 测试策略

按 TDD 先写失败测试，测试文件与被测模块同名：

- `src/permissions/fields.test.ts`：条件行 ↔ `conditions` 互转，四种操作符，重复字段处理，值与字段类型不匹配时拒绝。
- `src/lib/casl.test.ts`：`symbolize` 的 `$nin` 别名映射。
- `src/services/ability/fields.test.ts`：无条件规则不裁剪；有字段规则只保留列出字段；`id`/时间戳始终保留；条件规则按实例逐行判断；带字段的拒绝只隐藏字段，不带字段的拒绝整行失效。
- `src/services/role.test.ts`：`savePermissions` 持久化 `fields/conditions/inverted/expiresAt`；空限制写 `null`；整体替换；`findPermissionEditor` 读回 through 属性且保留过期授予；目录外权限不会因 `name` 失败。
- `src/services/access.test.ts`：`paginateAccessible` 按 `read` 字段裁剪行。
- `src/services/user.test.ts` / `role.test.ts`：更新静默丢弃越权字段；`roles` 伪字段只在 update 生效；列表与编辑表单分别按 `read` / `update` 裁剪。
- `src/actions/role.test.ts`：`saveRolePermissions` 的 zod 白名单校验（未知字段、未知条件字段、错误操作符、`all` 带字段或条件、`create` 带条件）与无权分支。

界面组件以手动验证为主；条件行的序列化逻辑放在可单测的纯函数中。

## 10. 实施顺序（高层）

1. 字段元数据与条件行纯函数 + 测试。
2. `savePermissions` / `PermissionInput` / `findPermissionEditor` 契约扩展 + 测试。
3. `fields` 帮助函数与各服务接入 + 测试。
4. 权限矩阵、限制抽屉、页面接入。
5. 按 `verify` 技能跑 lint / format / tsc / vitest。

详细任务拆分由后续实施计划承担。

## 11. 决策记录

用户已确认：

- 布局为矩阵 + 限制抽屉；
- 条件使用引导式通用条件行（字段 / 操作符 / 值），而非自由 JSON；
- 字段限制本次一并做到真正生效；
- 越权字段静默丢弃；
- 拒绝规则开关保留在抽屉的「高级」区。

设计者的判断（可被作者推翻）：

- 抽屉按资源打开，用 action 切换，而不是每个格子一个抽屉。
- 条件行一行一个字段、AND 合并；不提供 OR 与嵌套。
- 过期精确到时间，空值表示永不过期。
- 勾选「系统管理」不联动其他格子。
- 内置角色通过 `isBuiltin` 判定为只读。
- 字段元数据同时用于读裁剪与写过滤，不区分读写两套列表；字段限制只作用于 `read` 与 `update`，创建/删除不做字段裁剪。
- 列表与编辑表单分别按 `read` / `update` 判断字段；`findForEdit` 沿用现有的 `update` 授权。
- 系统字段 `id`、`createdAt`、`updatedAt` 始终保留；`roles` 作为 User 伪字段加入 `restrictable`，仅在 update 生效。
- 服务端按元数据白名单校验字段与条件，不只依赖界面约束。
- 带字段的拒绝只隐藏字段；不带字段的拒绝整行。
- 过期授予在编辑器中保留并标记「已过期」，保存时不被静默删除。
- `listOptions` 的 `name` 被裁剪时，选项标签回退为 `#<id>`。
- 权限目录之外的现存授予不显示，保存时被整体替换删除。

## 12. 风险与待观察

- 列表按行逐字段做 CASL 判断，每页 20 行 × 字段数，性能可接受；如果未来页大小显著增大，可改为按规则静态计算允许列集合。
- 条件中的 `$nin` 需要 `symbolize` 别名支持，否则查询与实例判断只能二选一。
- 内置角色的界面禁用只是前端约束；若要防住直接调用 action，可在 `savePermissions` 中拒绝 `isBuiltin` 角色，但这会影响未来以内置角色为模板的复制功能，暂不加入。
- `manage:all` 的字段限制在 `buildAbility` 中被忽略并告警；条件也不安全（`all` 会被求值到所有模型），因此界面对 `manage:all` 只保留过期与拒绝，服务端同样拒绝字段与条件。
