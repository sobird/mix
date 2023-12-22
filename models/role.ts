/**
 * Role Model
 *
 * sobird<i@sobird.me> at 2023/11/30 19:51:05 created.
 */

import {
  DataTypes,
  type Optional,
  BelongsToManyGetAssociationsMixin,
  BelongsToManySetAssociationsMixin,
  BelongsToManyAddAssociationMixin,
  BelongsToManyAddAssociationsMixin,
  BelongsToManyRemoveAssociationMixin,
  BelongsToManyRemoveAssociationsMixin,
  BelongsToManyHasAssociationMixin,
  BelongsToManyHasAssociationsMixin,
  BelongsToManyCreateAssociationMixin,
  BelongsToManyCountAssociationsMixin,
} from 'sequelize';
import { sequelize, BaseModel } from '@/lib/sequelize';
import type User from './user';
import type Permission from './permission';

/** These are all the attributes in the Role model */
export interface RoleAttributes {
  id?: number;
  parentId?: number,
  name: string;
  description: string;
}
/** Some attributes are optional in `Role.build` and `Role.create` calls */
export type RoleCreationAttributes = Optional<RoleAttributes, 'id'>;

class Role extends BaseModel<RoleAttributes, RoleCreationAttributes> {
  declare id: number;

  declare getUsers: BelongsToManyGetAssociationsMixin<User>;

  /** Remove all previous associations and set the new ones */
  declare setUsers: BelongsToManySetAssociationsMixin<User, User['id']>;

  declare addUser: BelongsToManyAddAssociationMixin<User, User['id']>;

  declare addUsers: BelongsToManyAddAssociationsMixin<User, User['id']>;

  declare removeUser: BelongsToManyRemoveAssociationMixin<User, User['id']>;

  declare removeUsers: BelongsToManyRemoveAssociationsMixin<User, User['id']>;

  declare hasUser: BelongsToManyHasAssociationMixin<User, User['id']>;

  declare hasUsers: BelongsToManyHasAssociationsMixin<User, User['id']>;

  declare createUser: BelongsToManyCreateAssociationMixin<User>;

  declare countUsers: BelongsToManyCountAssociationsMixin;

  declare getPermissions: BelongsToManyGetAssociationsMixin<Permission>;

  /** Remove all previous associations and set the new ones */
  declare setPermissions: BelongsToManySetAssociationsMixin<Permission, Permission['id']>;

  declare addPermission: BelongsToManyAddAssociationMixin<Permission, Permission['id']>;

  declare addPermissions: BelongsToManyAddAssociationsMixin<Permission, Permission['id']>;

  declare removePermission: BelongsToManyRemoveAssociationMixin<Permission, Permission['id']>;

  declare removePermissions: BelongsToManyRemoveAssociationsMixin<Permission, Permission['id']>;

  declare hasPermission: BelongsToManyHasAssociationMixin<Permission, Permission['id']>;

  declare hasPermissions: BelongsToManyHasAssociationsMixin<Permission, Permission['id']>;

  declare createPermission: BelongsToManyCreateAssociationMixin<Permission>;

  declare countPermissions: BelongsToManyCountAssociationsMixin;
}

Role.init(
  {
    id: {
      type: DataTypes.UUIDV4,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notNull: {
          msg: '请输入角色名称',
        },
      },
    },
    description: {
      type: DataTypes.STRING,
    },
    parentId: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    // modelName: 'role',
  },
);

export default Role;
