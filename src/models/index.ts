/**
 * Models Index
 *
 * @see https://github.com/sequelize/sequelize/blob/main/types/test/typescriptDocs/ModelInit.ts
 *
 * sobird<i@sobird.me> at 2021/11/16 20:33:20 created.
 */

import { sequelize } from '@/lib/sequelize';

import { Account } from './account';
import { DictionaryItem } from './dictionaryItem';
import { DictionaryType } from './dictionaryType';
import { Group } from './group';
import { Log } from './log';
import { Menu } from './menu';
import { Organization } from './organization';
import { Permission } from './permission';
import { Role } from './role';
import { RolePermission } from './role-permission';
import { Session } from './session';
import { User } from './user';
import { UserRole } from './user-role';
import { VerificationToken } from './verificationToken';

export type { UserAttributes, UserCreationAttributes } from './user';
export type { RoleAttributes, RoleCreationAttributes } from './role';
export type { PermissionAttributes, PermissionCreationAttributes } from './permission';
export type { AccountAttributes, AccountCreationAttributes } from './account';
export type { SessionAttributes, SessionCreationAttributes } from './session';
export type { VerificationTokenAttributes, VerificationTokenCreationAttributes } from './verificationToken';
export type { MenuAttributes, MenuCreationAttributes } from './menu';
export type { GroupAttributes, GroupCreationAttributes } from './group';
export type { LogAttributes, LogCreationAttributes } from './log';
export type { OrganizationAttributes, OrganizationCreationAttributes } from './organization';
export type { DictionaryItemAttributes, DictionaryItemCreationAttributes } from './dictionaryItem';
export type { DictionaryTypeAttributes, DictionaryTypeCreationAttributes } from './dictionaryType';
export type { RolePermissionAttributes, RolePermissionCreationAttributes } from './role-permission';
export type { UserRoleAttributes, UserRoleCreationAttributes } from './user-role';

export {
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
  UserRole,
  VerificationToken,
};

const models = {
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
  UserRole,
  VerificationToken,
};

// 建立表关联关系
Object.values(models).forEach((model: any) => {
  model.associate?.(sequelize.models);
});

export { models, sequelize };
export type Models = typeof models;
