/**
 * Models Index
 *
 * @see https://github.com/sequelize/sequelize/blob/main/types/test/typescriptDocs/ModelInit.ts
 *
 * sobird<i@sobird.me> at 2021/11/16 20:33:20 created.
 */

import { sequelize } from '@/lib/sequelize';

import { Account } from './Account';
import { DictionaryItem } from './DictionaryItem';
import { DictionaryType } from './DictionaryType';
import { Group } from './Group';
import { Log } from './Log';
import { Menu } from './Menu';
import { Organization } from './Organization';
import { Permission } from './Permission';
import { Role } from './Role';
import { RolePermission } from './RolePermission';
import { Session } from './Session';
import { User } from './User';
import { UserRole } from './UserRole';
import { VerificationToken } from './VerificationToken';

export type { UserAttributes, UserCreationAttributes } from './User';
export type { RoleAttributes, RoleCreationAttributes } from './Role';
export type { PermissionAttributes, PermissionCreationAttributes } from './Permission';
export type { AccountAttributes, AccountCreationAttributes } from './Account';
export type { SessionAttributes, SessionCreationAttributes } from './Session';
export type { VerificationTokenAttributes, VerificationTokenCreationAttributes } from './VerificationToken';
export type { MenuAttributes, MenuCreationAttributes } from './Menu';
export type { GroupAttributes, GroupCreationAttributes } from './Group';
export type { LogAttributes, LogCreationAttributes } from './Log';
export type { OrganizationAttributes, OrganizationCreationAttributes } from './Organization';
export type { DictionaryItemAttributes, DictionaryItemCreationAttributes } from './DictionaryItem';
export type { DictionaryTypeAttributes, DictionaryTypeCreationAttributes } from './DictionaryType';
export type { RolePermissionAttributes, RolePermissionCreationAttributes } from './RolePermission';
export type { UserRoleAttributes, UserRoleCreationAttributes } from './UserRole';

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
