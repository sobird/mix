# 设计文档：认证策略加固（database session）

状态：草案（待评审）
范围：`src/services/auth/`、`src/proxy.ts`、`src/models/`（adapter 相关）
日期：2026-10-29

## 1. 背景

当前 next-auth v4 使用 `strategy: 'database'`，四个 provider：`credentials` / `github` /
`google` / `email`。会话写入 `sessions` 表，权限（CASL）每次请求从数据库重新加载，因此
选择 database 策略的主要收益是：

- 服务端可吊销会话（登出、改密踢人、封禁、后台强制下线）；
- 用户资料/状态只有一份真相；
- 轮换 `NEXTAUTH_SECRET` 不会让所有会话失效。

代价：每请求多一次 session 查询；`credentials` + database 属于 next-auth **官方不支持**的
组合，依赖 `src/services/auth/index.ts` 中的手工桥接（`jwt` 回调建 session + 覆写
`jwt.encode` 返回裸 token）。

本次不改策略，只做**加固与清理**。切换到 `'jwt'` 不在本设计范围内（另见附录）。

## 2. 目标与非目标

### 目标

1. 封禁（`users.status = 0`）对 **所有登录方式** 生效，且存量会话在下次请求时失效。
2. 消除认证错误信息向客户端泄露（用户枚举）。
3. 删除 database 策略下永不生效的死代码，降低误用风险。
4. 减少单请求内重复的 session 查询。
5. 修复生产环境中间件 cookie 名不匹配的问题。

### 非目标

- 不切换 `strategy`（保持 `'database'`）。
- 不修改数据库 schema，不新增迁移，不强制用户重新登录。
- 不改动 CASL / 菜单 / actions 的权限逻辑。
- 不引入新的认证方式。

## 3. 设计决策

### D1. 保留 database 策略与 credentials 桥接

- database 策略继续保留（理由见背景）。
- `jwt` 回调中"credentials 时手动创建 session 行"的逻辑保留，但需加固：
  - 判断条件从 `account?.provider === 'credentials'` 改为 `account?.type === 'credentials'`
    （provider id 可被重命名，`type` 更稳）。
  - 收紧类型，去掉 `params: any` 与不必要的 `as any`。
  - 增加注释：这是非官方组合的桥，升级 next-auth 时必须回归。

### D2. 封禁即失效（两层）

1. **登录时拦截**：在 `callbacks.signIn` 中检查 `user.status`。
   - Credentials：`User.signin` 已拦截，保持现状。
   - OAuth（已有账号）/ Email（已有用户）：next-auth 传入的 `user` 来自 adapter，含 `status`。
   - 首次 OAuth 登录时 `user` 是第三方 profile，无 `status`，放行。
2. **存量会话拦截**：adapter 的 `getSessionAndUser` 查询 `User` 时带上 `status`；
   `status = 0` 时删除该 session 并返回 `null`，session 路由会自动清除 cookie。

### D3. 错误信息统一

`authorize` 不再把"用户不存在 / 密码不正确 / 用户已被禁用"原样抛给客户端。
客户端统一提示"用户名或密码错误"；封禁账号单独提示"账号已被禁用"；真实原因写服务端日志。

### D4. 死代码处理（保留 + 注释）

database 策略下：

- `session` 回调不接收 `token`（`core/routes/session.js`），`token?.accessToken` 永远为空；(保留，添加说明注释)
- `jwt` 回调仅在 credentials 路径被调用，`account.access_token` 永远拿不到；(保留，添加说明注释)
- `trigger === 'update'` 的 jwt 分支不会执行（DB 会话更新走 `updateSession`）；(保留，添加说明注释)
- `getServerAuthToken()` 用 `getToken` 解 UUID 必然返回 null，且无调用方；(保留，添加 @deprecated 注释)
- `getCsrfAuthToken()` 无调用方。(保留，添加 @deprecated 注释)

若未来需要 OAuth access token，从 `accounts.access_token` 读取。

### D5. 请求级 session 缓存

仿照 `getAbility`，用 React `cache()` 包裹无参的 session 读取，避免同一请求内
layout / ability / menu / actions 重复查询。带 `req/res` 的重载保持不变（pages/API 场景）。

### D6. 中间件 cookie 名

`src/proxy.ts` 目前硬编码 `next-auth.session-token`。生产 HTTPS 下 next-auth 使用
`__Secure-next-auth.session-token`。修复方式（已选）：

- next-auth v4 未公开导出计算后的 cookie 名（`core/lib/cookie` 被 `exports` 限制），
  `authOptions.cookies` 也只在显式配置时才有值；
- 中间件跑在 edge runtime，不能引入 `authOptions`（会连带 Sequelize/SQLite）；
- 因此中间件同时接受 `__Secure-next-auth.session-token` 与 `next-auth.session-token`
  两个名字（见 `src/services/auth/session-cookie.ts`），与部署协议无关；
  鉴权本身仍交给 `dashboard/layout.tsx` 与 actions。

## 4. 变更清单

### 阶段一：`src/services/auth/index.ts`（P0 + P1）

| #   | 位置                                      | 变更                                                                             |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | `callbacks.signIn`                        | 增加 `status` 校验                                                               |
| 2   | `authorize`                               | 统一错误文案；服务端记录真实原因；`id: String(user.id)`                          |
| 3   | `callbacks.jwt`                           | 保留 `token.id` / `accessToken` / update 分支，补充"database 策略下不生效"的注释 |
| 4   | `callbacks.session`                       | 保留 `token?.accessToken` 分支并注释；保留 `session.user.id = String(user.id)`   |
| 5   | `jwtOptions.encode`                       | 收紧类型；补充非官方组合注释                                                     |
| 6   | `getServerAuthToken` / `getCsrfAuthToken` | 保留并标 `@deprecated`（无调用方且对 DB 策略无效）                               |
| 7   | `getServerAuthSession`                    | 增加无参版本 `cache()` 包装                                                      |
| 8   | `sessionOptions`                          | `generateSessionToken` 调用处去掉 `as any`                                       |
| 9   | 模块增强                                  | 保留 `Session.accessToken`，补充说明注释                                         |
| 10  | `createSession` 失败                      | 暂不做                                                                           |
| 11  | `secret`                                  | 显式传入 `NEXTAUTH_SECRET ?? AUTH_SECRET`                                        |
| 12  | 旧会话清理                                | credentials 登录时按 `userId` 清理旧 session（含用户其他设备）                   |

### 阶段二：相邻文件（P0，单独提交）

| #   | 文件                                     | 变更                                                                                                                               |
| --- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 13  | `src/services/auth/adapter-sequelize.ts` | `getSessionAndUser` 增加 `status` 校验；`getUserByAccount` / `getUserByEmail` 使用 `attributes` 白名单，不返回 `password` / `salt` |
| 14  | `src/services/auth/adapter-sequelize.ts` | `createUser` 的 `username` 唯一化（email 前缀 / provider id），避免同名 OAuth 用户撞 `users.username` 唯一约束                     |
| 15  | `src/proxy.ts`                           | 修复生产 cookie 名（见 D6）                                                                                                        |

### 不建议改动的部分

- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/dashboard/**`、`src/services/ability/**`、`src/services/menu.ts`、`src/actions/**`
- `src/app/(authentication)/signin/form.tsx`、`src/components/buttons.tsx`
- `src/models/Session.ts` 及 `sessions` 表（保留，暂无删除需求）

## 5. 关键代码草图

### 5.1 `signIn` 封禁校验

```ts
async signIn({ user }) {
  // 首次 OAuth 登录时 user 是第三方 profile，没有 status，放行
  const status = (user as { status?: number } | undefined)?.status;
  return status === undefined || Number(status) !== 0;
}
```

### 5.2 `getSessionAndUser` 封禁即踢

```ts
const user = await User.findByPk(session.userId, {
  attributes: ['id', 'username', 'name', 'email', 'image', 'status'],
});

if (!user || !user.status) {
  await Session.destroy({ where: { sessionToken } });
  return null;
}
```

### 5.3 请求级缓存

```ts
const getServerSessionCached = cache(() => getServerSession(authOptions));

export function getServerAuthSession(...args: [] | [req, res]) {
  return args.length ? getServerSession(...args, authOptions) : getServerSessionCached();
}
```

> 实现时注意 TypeScript 重载签名，保持现有调用方无需改动。

## 6. 兼容性与数据影响

- 无 schema 变更，无数据迁移。
- 现有会话继续有效；被封禁用户的会话会在下一次请求时被删除。
- 客户端可见变化：credentials 登录失败文案统一，不再区分"用户不存在/密码错误"。
- `src/proxy.ts` 修复后，生产环境 HTTPS 下的后台访问行为恢复正常。

## 7. 测试计划

### 自动化

- `src/services/auth/session-user.test.ts`：
  - `session` 回调从 DB `user` 写入 `user.id`；
  - 无 `user` 时不写入 id。
- 新增：`signIn` 回调对 `status = 0` 返回 false，`status = 1` / 无 status 返回 true。
- 新增：adapter `getSessionAndUser` 在用户禁用时删除 session 并返回 null。
- 既有 `ability` / `actions` 测试保持通过。
- `bunx tsc --noEmit`、`bun run lint`、`bun run format:check`。

### 手工

1. Credentials 登录成功 / 失败（统一文案）。
2. GitHub、Google、Email 登录成功。
3. 禁用用户后重新登录被拒；已登录用户下一次请求被登出。
4. 登出后 `sessions` 行被删除。
5. 生产模式（HTTPS cookie 名）下访问 `/dashboard` 不误跳登录页。

## 8. 风险与回滚

- 风险：`signIn` 回调改动可能影响 OAuth 首次登录 → 已明确"无 status 放行"。
- 风险：请求级缓存若误用于跨请求场景会导致会话串用 → 只缓存无参版本，`cache()` 作用域为单次请求。
- 回滚：每个阶段独立提交，可单独 revert；无数据迁移，回滚无状态残留。

## 9. 已确认

- [x] D6 中间件同时接受 `__Secure-` 与普通 session cookie 名。
- [x] 错误文案统一为"用户名或密码错误"，禁用账号单独提示"账号已被禁用"。
- [x] 登录（credentials）时清理同用户旧会话，不依赖过期清理。
- [x] 显式传入 `secret`（第 11 项）。
- [x] 阶段二包含 `createUser` 用户名唯一化（第 14 项）。
- [x] 死代码按 D4 保留并注释 / 标 `@deprecated`，不删除。
- [x] 实施分两次提交：阶段一、阶段二。

## 附录：为什么没有选择 `strategy: 'jwt'`

- JWT 无法服务端吊销；封禁/强制下线需等 `maxAge`（30 天）或额外做 token 版本校验。
- 本项目单实例 + SQLite，JWT 的无状态扩展优势用不上。
- 迁移需改写 `session` 回调（`session.user.id` 需从 `token` 取），且现有会话全部失效。
- JWT 的收益（credentials 走官方支持、中间件可验真）可在后续按需评估。
