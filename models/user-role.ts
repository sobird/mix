/**
 * UserRole Model
 *
 * sobird<i@sobird.me> at 2023/11/30 19:51:05 created.
 */

import { Model, DataTypes, type Optional } from 'sequelize';
import { sequelize } from '@/lib/sequelize';
import User from './user';
import Role from './role';

/** These are all the attributes in the UserRole model */
export interface UserRoleAttributes {
  id?: number;
  UserId: number;
  RoleId: number;
}
/** Some attributes are optional in `UserRole.build` and `UserRole.create` calls */
export type UserRoleCreationAttributes = Optional<UserRoleAttributes, 'id'>;

class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> {
  declare id: number;

  public userId!: number;

  public roleId!: number;
}

UserRole.init(
  {
    UserId: {
      type: DataTypes.INTEGER,
      references: {
        model: User, // 'Movies' 也可以使用
        key: 'id',
      },
    },
    RoleId: {
      type: DataTypes.INTEGER,
      references: {
        model: Role, // 'Actors' 也可以使用
        key: 'id',
      },
    },
  },
  {
    sequelize,
  },
);

export default UserRole;
