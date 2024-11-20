/**
 * UserRole Model
 *
 * sobird<i@sobird.me> at 2023/11/30 19:51:05 created.
 */

import {
  Model, DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';

import { sequelize } from '@/lib/sequelize';

import Role from './role';
import User from './user';

/** These are all the attributes in the UserRole model */
export type UserRoleAttributes = InferAttributes<UserRole>;
/** Some attributes are optional in `UserRole.build` and `UserRole.create` calls */
export type UserRoleCreationAttributes = InferCreationAttributes<UserRole>;

class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> {
  public userId!: number;

  public roleId!: number;
}

UserRole.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: 'id',
      },
    },
    roleId: {
      type: DataTypes.INTEGER,
      references: {
        model: Role,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'UserRole',
  },
);

export default UserRole;
