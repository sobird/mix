/**
 * UserRole Model
 *
 * sobird<i@sobird.me> at 2023/11/30 19:51:05 created.
 */

import {
  DataTypes,
  type Attributes,
  type CreationAttributes,
  type Association,
  type NonAttribute,
  type BelongsToGetAssociationMixin,
  type BelongsToSetAssociationMixin,
  type BelongsToCreateAssociationMixin,
} from 'sequelize';

import { sequelize, BaseModel } from '@/lib/sequelize';

import { Role } from './Role';
import { User } from './User';

/** These are all the attributes in the UserRole model */
export type UserRoleAttributes = Attributes<UserRole>;
/** Some attributes are optional in `UserRole.build` and `UserRole.create` calls */
export type UserRoleCreationAttributes = CreationAttributes<UserRole>;

export class UserRole extends BaseModel<UserRole> {
  declare userId: number;

  declare roleId: number;

  declare User: NonAttribute<User>;

  declare getUser: BelongsToGetAssociationMixin<User>;

  declare setUser: BelongsToSetAssociationMixin<User, User['id']>;

  declare createUser: BelongsToCreateAssociationMixin<User>;

  declare Role: NonAttribute<Role>;

  declare getRole: BelongsToGetAssociationMixin<Role>;

  declare setRole: BelongsToSetAssociationMixin<Role, Role['id']>;

  declare createRole: BelongsToCreateAssociationMixin<Role>;

  static associate({ User: UserModel, Role: RoleModel }) {
    this.belongsTo(UserModel, { foreignKey: 'userId' });
    this.belongsTo(RoleModel, { foreignKey: 'roleId' });
  }

  declare static associations: {
    User: Association<UserRole, User>;
    Role: Association<UserRole, Role>;
  };
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
