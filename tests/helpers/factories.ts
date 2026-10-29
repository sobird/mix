import {
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
  type AccountCreationAttributes,
  type DictionaryItemCreationAttributes,
  type DictionaryTypeCreationAttributes,
  type GroupCreationAttributes,
  type LogCreationAttributes,
  type MenuCreationAttributes,
  type OrganizationCreationAttributes,
  type PermissionCreationAttributes,
  type RoleCreationAttributes,
  type RolePermissionCreationAttributes,
  type SessionCreationAttributes,
  type UserCreationAttributes,
  type UserMenuPreferenceCreationAttributes,
  type UserRoleCreationAttributes,
  type VerificationTokenCreationAttributes,
} from '@/models';

/**
 * 测试数据工厂：提供满足必填字段的最小实例，调用方可按需覆盖。
 * 唯一约束字段默认带自增序号，避免同一用例里重复创建时冲突。
 */
let sequence = 0;

function nextKey(prefix: string) {
  sequence += 1;
  return `${prefix}_${sequence}`;
}

const FUTURE = new Date('2099-12-31T00:00:00.000Z');

export function createUser(overrides: Partial<UserCreationAttributes> = {}) {
  const key = nextKey('user');

  return User.create({
    username: key,
    email: `${key}@example.com`,
    ...overrides,
  } as UserCreationAttributes);
}

export function createRole(overrides: Partial<RoleCreationAttributes> = {}) {
  return Role.create({ name: nextKey('role'), ...overrides } as RoleCreationAttributes);
}

export function createPermission(overrides: Partial<PermissionCreationAttributes> = {}) {
  return Permission.create({
    name: nextKey('permission'),
    action: 'read',
    subject: nextKey('subject'),
    ...overrides,
  } as PermissionCreationAttributes);
}

export function createRolePermission(overrides: Partial<RolePermissionCreationAttributes> = {}) {
  return RolePermission.create(overrides as RolePermissionCreationAttributes);
}

export function createUserRole(overrides: Partial<UserRoleCreationAttributes> = {}) {
  return UserRole.create(overrides as UserRoleCreationAttributes);
}

export function createAccount(overrides: Partial<AccountCreationAttributes> = {}) {
  return Account.create({
    type: 'credentials',
    provider: nextKey('provider'),
    providerAccountId: nextKey('provider-account'),
    userId: 1,
    ...overrides,
  } as AccountCreationAttributes);
}

export function createSession(overrides: Partial<SessionCreationAttributes> = {}) {
  return Session.create({
    expires: FUTURE,
    sessionToken: nextKey('session'),
    userId: 1,
    ...overrides,
  } as SessionCreationAttributes);
}

export function createMenu(overrides: Partial<MenuCreationAttributes> = {}) {
  return Menu.create({
    name: nextKey('menu'),
    href: `/${nextKey('menu')}`,
    ...overrides,
  } as MenuCreationAttributes);
}

export function createUserMenuPreference(overrides: Partial<UserMenuPreferenceCreationAttributes> = {}) {
  return UserMenuPreference.create(overrides as UserMenuPreferenceCreationAttributes);
}

export function createGroup(overrides: Partial<GroupCreationAttributes> = {}) {
  return Group.create({ name: nextKey('group'), ...overrides } as GroupCreationAttributes);
}

export function createDictionaryType(overrides: Partial<DictionaryTypeCreationAttributes> = {}) {
  return DictionaryType.create({
    name: nextKey('dictionary-type'),
    code: nextKey('code'),
    ...overrides,
  } as DictionaryTypeCreationAttributes);
}

export function createDictionaryItem(overrides: Partial<DictionaryItemCreationAttributes> = {}) {
  return DictionaryItem.create({
    label: nextKey('label'),
    value: nextKey('value'),
    typeId: 1,
    ...overrides,
  } as DictionaryItemCreationAttributes);
}

export function createLog(overrides: Partial<LogCreationAttributes> = {}) {
  return Log.create({ content: nextKey('content'), ...overrides } as LogCreationAttributes);
}

export function createOrganization(overrides: Partial<OrganizationCreationAttributes> = {}) {
  return Organization.create({ name: nextKey('organization'), ...overrides } as OrganizationCreationAttributes);
}

export function createVerificationToken(overrides: Partial<VerificationTokenCreationAttributes> = {}) {
  return VerificationToken.create({
    token: nextKey('token'),
    identifier: nextKey('identifier'),
    expires: FUTURE,
    ...overrides,
  } as VerificationTokenCreationAttributes);
}
