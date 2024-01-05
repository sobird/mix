/**
 * models
 *
 * import { models } from '@auth/sequelize-adapter';
 *
 * @see https://github.com/sequelize/sequelize/blob/main/types/test/typescriptDocs/ModelInit.ts
 *
 * sobird<i@sobird.me> at 2021/11/16 20:33:20 created.
 */

import { sequelize } from '@/lib/sequelize';

import User from './user';
import Role from './role';
import Permission from './permission';
import Account from './account';
import Session from './session';
import VerificationToken from './verificationToken';
import Menu from './menu';
import Group from './group';
// Associations Model
import RolePermission from './role-permission';
import UserRole from './user-role';

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
Object.values(models).forEach((model: any) => {
  model.associate?.(sequelize.models);
});

export type Models = typeof models;

export { sequelize };
export default models;
