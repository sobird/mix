/**
 * Models Index
 *
 * import { models } from '@auth/sequelize-adapter';
 *
 * @see https://github.com/sequelize/sequelize/blob/main/types/test/typescriptDocs/ModelInit.ts
 *
 * sobird<i@sobird.me> at 2021/11/16 20:33:20 created.
 */

import { sequelize } from '@/lib/sequelize';

import Account from './account';
import Group from './group';
import Menu from './menu';
import Permission from './permission';
import Role from './role';
// Associations Model
import RolePermission from './role-permission';
import Session from './session';
import User from './user';
import UserRole from './user-role';
import VerificationToken from './verificationToken';

export type { UserAttributes, UserCreationAttributes } from './user';
export type { RoleAttributes, RoleCreationAttributes } from './role';
export type { PermissionAttributes, PermissionCreationAttributes } from './permission';
export type { AccountAttributes, AccountCreationAttributes } from './account';
export type { SessionAttributes, SessionCreationAttributes } from './session';
export type { VerificationTokenAttributes, VerificationTokenCreationAttributes } from './verificationToken';
export type { MenuAttributes, MenuCreationAttributes } from './menu';
export type { GroupAttributes, GroupCreationAttributes } from './group';

// Model alias
export { User as UserModel };
export { Account as AccountModel };
export { Session as SessionModel };
export { VerificationToken as VerificationTokenModel };
export { Role as RoleModel };
export { Permission as PermissionModel };
export { Menu as MenuModel };
export { Group as GroupModel };
// Associations Model
export { RolePermission as RolePermissionModel };
export { UserRole as UserRoleModel };

const models = {
  User,
  Account,
  Session,
  VerificationToken,
  Role,
  Permission,
  Menu,
  Group,
  RolePermission,
  UserRole,
};

// 建立表关联关系
Object.values(models).forEach((model: any) => {
  model.associate?.(sequelize.models);
});

// 建立系统权限
Object.values(models).forEach((model: any) => {
  console.log('model1212', models);
});

export type Models = typeof models;

export { sequelize };
export default models;
