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
import { UserMenuPreference } from './UserMenuPreference';
import { UserRole } from './UserRole';
import { VerificationToken } from './VerificationToken';

export * from './Account';
export * from './DictionaryItem';
export * from './DictionaryType';
export * from './Group';
export * from './Log';
export * from './Menu';
export * from './Organization';
export * from './Permission';
export * from './Role';
export * from './RolePermission';
export * from './Session';
export * from './User';
export * from './UserMenuPreference';
export * from './UserRole';
export * from './VerificationToken';

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
  UserMenuPreference,
  UserRole,
  VerificationToken,
};

// 建立表关联关系
Object.values(models).forEach((model) => {
  model.associate?.(models);
});

export { models, sequelize };
export type Models = typeof models;
