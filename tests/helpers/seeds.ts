import { vi } from 'vitest';

/**
 * 测试种子数据。
 *
 * 模型一律惰性、通过 `vi.importActual` 获取：
 * - 避免 manual mock 在模块初始化阶段被本文件再次触发，形成循环依赖；
 * - 即使调用方 `vi.mock('@/models')`，拿到的也始终是真实的模型实现。
 *
 * 所有 seed 函数都是幂等的，可以在任意用例里重复调用。
 */

/** 种子用户的统一明文密码 */
export const DEFAULT_PASSWORD = 'Passw0rd!';

/** 内置角色名称（由 Role.afterSync 写入） */
export const BUILTIN_ROLE_NAMES = {
  owner: '拥有者',
  admin: '管理员',
  member: '成员',
} as const;

const FUTURE = new Date('2099-12-31T00:00:00.000Z');

let modelsPromise: ReturnType<typeof loadModels>;

function loadModels() {
  return Promise.all([
    vi.importActual<typeof import('@/models/Account')>('@/models/Account'),
    vi.importActual<typeof import('@/models/DictionaryItem')>('@/models/DictionaryItem'),
    vi.importActual<typeof import('@/models/DictionaryType')>('@/models/DictionaryType'),
    vi.importActual<typeof import('@/models/Group')>('@/models/Group'),
    vi.importActual<typeof import('@/models/Log')>('@/models/Log'),
    vi.importActual<typeof import('@/models/Menu')>('@/models/Menu'),
    vi.importActual<typeof import('@/models/Organization')>('@/models/Organization'),
    vi.importActual<typeof import('@/models/Permission')>('@/models/Permission'),
    vi.importActual<typeof import('@/models/Role')>('@/models/Role'),
    vi.importActual<typeof import('@/models/RolePermission')>('@/models/RolePermission'),
    vi.importActual<typeof import('@/models/Session')>('@/models/Session'),
    vi.importActual<typeof import('@/models/User')>('@/models/User'),
    vi.importActual<typeof import('@/models/UserMenuPreference')>('@/models/UserMenuPreference'),
    vi.importActual<typeof import('@/models/UserRole')>('@/models/UserRole'),
    vi.importActual<typeof import('@/models/VerificationToken')>('@/models/VerificationToken'),
  ]);
}

async function useModels() {
  modelsPromise ??= loadModels();

  const [
    { Account },
    { DictionaryItem },
    { DictionaryType },
    { Group },
    { Log },
    { Menu },
    { Organization },
    { Permission },
    { Role },
    { RolePermission },
    { Session },
    { User },
    { UserMenuPreference },
    { UserRole },
    { VerificationToken },
  ] = await modelsPromise;

  return {
    Account,
    DictionaryItem,
    DictionaryType,
    Group,
    Log,
    Menu,
    Organization,
    Permission,
    Role,
    RolePermission,
    Session,
    User,
    UserMenuPreference,
    UserRole,
    VerificationToken,
  };
}

export async function seedUsers() {
  const { User } = await useModels();
  await User.sync();

  const [admin] = await User.findOrCreate({
    where: { username: 'admin' },
    defaults: {
      username: 'admin',
      email: 'admin@mix.local',
      password: DEFAULT_PASSWORD,
    },
  } as never);

  const [member] = await User.findOrCreate({
    where: { username: 'member' },
    defaults: {
      username: 'member',
      email: 'member@mix.local',
      password: DEFAULT_PASSWORD,
    },
  } as never);

  return { admin, member };
}

export async function seedRoles() {
  const { Role } = await useModels();
  // Role.sync() 会触发 afterSync，写入 3 条内置角色
  await Role.sync();

  const [owner] = await Role.findOrCreate({
    where: { name: BUILTIN_ROLE_NAMES.owner },
    defaults: { description: '系统拥有者角色', isBuiltin: true, editable: false, defaultable: false },
  } as never);
  const [admin] = await Role.findOrCreate({
    where: { name: BUILTIN_ROLE_NAMES.admin },
    defaults: { description: '系统管理员角色', isBuiltin: true },
  } as never);
  const [member] = await Role.findOrCreate({
    where: { name: BUILTIN_ROLE_NAMES.member },
    defaults: { description: '普通用户角色', isBuiltin: true, isDefault: true },
  } as never);
  const [custom] = await Role.findOrCreate({
    where: { name: '测试角色' },
    defaults: { description: '用于测试的自定义角色' },
  } as never);

  return { owner, admin, member, custom };
}

export async function seedPermissions() {
  const { Permission } = await useModels();
  await Permission.sync();

  const [readUser] = await Permission.findOrCreate({
    where: { name: '查看用户' },
    defaults: { name: '查看用户', action: 'read', subject: 'User' },
  } as never);
  const [updateUser] = await Permission.findOrCreate({
    where: { name: '更新用户' },
    defaults: { name: '更新用户', action: 'update', subject: 'User' },
  } as never);
  const [manageAll] = await Permission.findOrCreate({
    where: { name: '管理全部' },
    defaults: { name: '管理全部', action: 'manage', subject: 'all' },
  } as never);

  return { readUser, updateUser, manageAll };
}

export async function seedRolePermissions() {
  const { RolePermission } = await useModels();
  const { admin } = await seedRoles();
  const { readUser, updateUser, manageAll } = await seedPermissions();
  await RolePermission.sync();

  await RolePermission.findOrCreate({
    where: { roleId: admin.id, permissionId: manageAll.id },
    defaults: { narrowing: null },
  } as never);
  await RolePermission.findOrCreate({
    where: { roleId: admin.id, permissionId: readUser.id },
    defaults: { narrowing: { fields: ['username', 'email'] } },
  } as never);
  await RolePermission.findOrCreate({
    where: { roleId: admin.id, permissionId: updateUser.id },
    defaults: { narrowing: null },
  } as never);

  return { admin };
}

export async function seedUserRoles() {
  const { UserRole } = await useModels();
  const { admin, member } = await seedUsers();
  const { admin: adminRole, member: memberRole } = await seedRoles();
  await UserRole.sync();

  await UserRole.findOrCreate({ where: { userId: admin.id, roleId: adminRole.id }, defaults: {} } as never);
  await UserRole.findOrCreate({ where: { userId: member.id, roleId: memberRole.id }, defaults: {} } as never);

  return { admin, member, adminRole, memberRole };
}

export async function seedAccounts() {
  const { Account } = await useModels();
  const { admin } = await seedUsers();
  await Account.sync();

  const [account] = await Account.findOrCreate({
    where: { provider: 'credentials', providerAccountId: 'admin' },
    defaults: { type: 'credentials', userId: admin.id },
  } as never);

  return { account, admin };
}

export async function seedSessions() {
  const { Session } = await useModels();
  const { admin } = await seedUsers();
  await Session.sync();

  const [session] = await Session.findOrCreate({
    where: { sessionToken: 'session-admin' },
    defaults: { expires: FUTURE, userId: admin.id },
  } as never);

  return { session, admin };
}

export async function seedMenus() {
  const { Menu } = await useModels();
  await Menu.sync();

  const [root] = await Menu.findOrCreate({
    where: { href: '/dashboard' },
    defaults: { name: '控制台', sort: 1 },
  } as never);
  const [users] = await Menu.findOrCreate({
    where: { href: '/dashboard/users' },
    defaults: { name: '用户管理', parentId: root.id, sort: 2 },
  } as never);

  return { root, users };
}

export async function seedUserMenuPreferences() {
  const { UserMenuPreference } = await useModels();
  const { admin } = await seedUsers();
  const { root, users } = await seedMenus();
  await UserMenuPreference.sync();

  await UserMenuPreference.findOrCreate({
    where: { userId: admin.id, menuId: root.id },
    defaults: { favorite: true, sort: 1 },
  } as never);
  await UserMenuPreference.findOrCreate({
    where: { userId: admin.id, menuId: users.id },
    defaults: { hidden: true, sort: 2 },
  } as never);

  return { admin, root, users };
}

export async function seedGroups() {
  const { Group } = await useModels();
  await Group.sync();

  const [headquarters] = await Group.findOrCreate({
    where: { name: '总部' },
    defaults: { description: '总部' },
  } as never);
  const [research] = await Group.findOrCreate({
    where: { name: '研发部' },
    defaults: { description: '研发部', parentId: headquarters.id },
  } as never);

  return { headquarters, research };
}

export async function seedDictionaries() {
  const { DictionaryItem, DictionaryType } = await useModels();
  await DictionaryType.sync();

  const [gender] = await DictionaryType.findOrCreate({
    where: { name: '性别' },
    defaults: { name: '性别', code: 'gender' },
  } as never);

  await DictionaryItem.sync();

  const [male] = await DictionaryItem.findOrCreate({
    where: { typeId: gender.id, value: 'male' },
    defaults: { label: '男', sort: 1 },
  } as never);
  const [female] = await DictionaryItem.findOrCreate({
    where: { typeId: gender.id, value: 'female' },
    defaults: { label: '女', sort: 2 },
  } as never);

  return { gender, male, female };
}

export async function seedLogs() {
  const { Log } = await useModels();
  await Log.sync();

  const [log] = await Log.findOrCreate({
    where: { content: '系统初始化' },
    defaults: { type: 'system' },
  } as never);

  return { log };
}

export async function seedOrganizations() {
  const { Organization } = await useModels();
  await Organization.sync();

  const [organization] = await Organization.findOrCreate({
    where: { name: '演示组织' },
    defaults: { description: '用于测试的组织' },
  } as never);

  return { organization };
}

export async function seedVerificationTokens() {
  const { VerificationToken } = await useModels();
  await VerificationToken.sync();

  const [verificationToken] = await VerificationToken.findOrCreate({
    where: { token: 'verify-member', identifier: 'member@mix.local' },
    defaults: { expires: FUTURE },
  } as never);

  return { verificationToken };
}

/** 一次性灌入全部种子数据（manual mock 的 index 使用） */
export async function seedAll() {
  const users = await seedUsers();
  const roles = await seedRoles();
  const permissions = await seedPermissions();
  const accounts = await seedAccounts();
  const userRoles = await seedUserRoles();
  const rolePermissions = await seedRolePermissions();
  const sessions = await seedSessions();
  const menus = await seedMenus();
  const userMenuPreferences = await seedUserMenuPreferences();
  const groups = await seedGroups();
  const dictionaries = await seedDictionaries();
  const logs = await seedLogs();
  const organizations = await seedOrganizations();
  const verificationTokens = await seedVerificationTokens();

  return {
    users,
    roles,
    permissions,
    accounts,
    userRoles,
    rolePermissions,
    sessions,
    menus,
    userMenuPreferences,
    groups,
    dictionaries,
    logs,
    organizations,
    verificationTokens,
  };
}
