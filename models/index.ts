/**
 * models
 *
 * import { models } from '@auth/sequelize-adapter';
 *
 * @see https://github.com/sequelize/sequelize/blob/main/types/test/typescriptDocs/ModelInit.ts
 *
 * sobird<i@sobird.me> at 2021/11/16 20:33:20 created.
 */

import sequelize from '@/lib/sequelize';
import User from './user';
import Account from './account';
import Session from './session';
import VerificationToken from './verificationToken';
import Role from './role';
import UserRole from './userRole';

export const UserModel = User;
export const AccountModel = Account;
export const SessionModel = Session;
export const VerificationTokenModel = VerificationToken;
export const RoleModel = Role;

Account.belongsTo(User, { onDelete: 'cascade' });
Session.belongsTo(User, { onDelete: 'cascade' });

// UserRole
User.belongsToMany(Role, { through: UserRole });
Role.belongsToMany(User, { through: UserRole });

export default sequelize;
