/**
 * E2E 种子脚本
 *
 * 仅在 DB_STORAGE 指向隔离数据库时运行，负责重建数据库并写入用例所需数据。
 * Playwright 的 webServer 以 `bun scripts/e2e-seed.ts && bunx next dev -p 3100`
 * 启动，因此本脚本结束后必须干净退出。
 */

import { mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';

import { runMigrations } from '@/lib/migrator';
import { Role, User, sequelize } from '@/models';
import { buildAbility } from '@/services/ability/build';
import { syncMenuCatalog } from '@/services/menu-catalog';
import { syncPermissionCatalog } from '@/services/permission-catalog';
import RoleService from '@/services/role';

import { E2E_OWNER, E2E_RESTRICTED_ROLE, E2E_TARGET_USERNAME, E2E_VIEWER } from '../e2e/fixtures';
import { resolveE2eStorage } from './e2e-storage';

const OWNER_ROLE_NAME = '拥有者';
const TARGET_PASSWORD = 'Target#1234';
const TARGET_COUNT = 3;

const dbStorage = resolveE2eStorage(process.env.DB_STORAGE);

// SQLite 的旁文件一并清理，保证每次运行都从空库开始
for (const suffix of ['', '-journal', '-wal', '-shm']) {
  rmSync(`${dbStorage}${suffix}`, { force: true });
}

mkdirSync(dirname(dbStorage), { recursive: true });

const executed = await runMigrations(sequelize);
console.log(`e2e migrations executed: ${executed.length}`);

const permissions = await syncPermissionCatalog();
console.log(`e2e permissions created: ${permissions.permissions}, builtin grants: ${permissions.grants}`);

const menus = await syncMenuCatalog();
console.log(`e2e menus created: ${menus.menus}`);

const ownerRole = await Role.findOne({ where: { name: OWNER_ROLE_NAME } });

if (!ownerRole) {
  throw new Error(`内置角色不存在: ${OWNER_ROLE_NAME}`);
}

const owner = await User.create({
  username: E2E_OWNER.username,
  email: 'owner@e2e.local',
  password: E2E_OWNER.password,
  status: true,
  emailVerified: new Date(),
});

await owner.setRoles([ownerRole]);

const restrictedRole = await Role.create({
  name: E2E_RESTRICTED_ROLE,
  description: 'E2E 受限客服角色',
});

// 种子以拥有者级别的能力调用服务层，保存权限时的授权检查必然通过
const seedAbility = buildAbility([{ action: 'manage', subject: 'all', narrowing: {} }]);

await RoleService.savePermissions(seedAbility, restrictedRole.id, [
  {
    subject: 'User',
    actions: [
      { action: 'read', fields: ['username', 'nickname'] },
      { action: 'update', fields: ['username', 'email', 'nickname', 'status'] },
    ],
  },
]);

const viewer = await User.create({
  username: E2E_VIEWER.username,
  email: 'viewer@e2e.local',
  password: E2E_VIEWER.password,
  status: true,
  emailVerified: new Date(),
});

await viewer.setRoles([restrictedRole]);

const targetBase = E2E_TARGET_USERNAME.replace(/\d+$/, '');

for (let index = 1; index <= TARGET_COUNT; index += 1) {
  // SQLite 单连接下创建必须串行
  // oxlint-disable-next-line no-await-in-loop
  await User.create({
    username: `${targetBase}${index}`,
    email: `target${index}@e2e.local`,
    nickname: `目标${index}`,
    password: TARGET_PASSWORD,
    status: true,
    emailVerified: new Date(),
  });
}

console.log(`e2e seed complete: owner=${owner.username}, viewer=${viewer.username}, targets=${TARGET_COUNT}`);

await sequelize.close();
process.exit(0);
