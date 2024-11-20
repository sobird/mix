/**
 * Role Model
 *
 * sobird<i@sobird.me> at 2023/11/30 19:51:05 created.
 */

import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type Association,
  type BelongsToManyGetAssociationsMixin,
  type BelongsToManySetAssociationsMixin,
  type BelongsToManyAddAssociationMixin,
  type BelongsToManyAddAssociationsMixin,
  type BelongsToManyRemoveAssociationMixin,
  type BelongsToManyRemoveAssociationsMixin,
  type BelongsToManyHasAssociationMixin,
  type BelongsToManyHasAssociationsMixin,
  type BelongsToManyCreateAssociationMixin,
  type BelongsToManyCountAssociationsMixin,
} from 'sequelize';

import { sequelize, BaseModel } from '@/lib/sequelize';

import type Permission from './permission';
import type User from './user';

/** These are all the attributes in the Role model */
export type RoleAttributes = InferAttributes<Role>;
/** Some attributes are optional in `Role.build` and `Role.create` calls */
export type RoleCreationAttributes = InferCreationAttributes<Role>;

class Role extends BaseModel<RoleAttributes, RoleCreationAttributes> {
  declare parentId?: CreationOptional<number>;

  declare name: string;

  declare description: CreationOptional<string> | null;

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

  declare static associations: {
    Users: Association<Role, User>;
    Permissions: Association<Role, Permission>;
  };

  static associate({
    User, UserRole, Permission, RolePermission,
  }) {
    this.belongsToMany(User, { through: UserRole });
    this.belongsToMany(Permission, { through: RolePermission });
  }
}

Role.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
    // defaultScope: {
    //   where: {
    //     parentId: 1,
    //   },
    // },
    scopes: {
      random(test) {
        console.log('test', test);
        return {
          where: {
            id: Math.random(),
          },
        };
      },

      parent: {
        where: {
          parentId: 1,
        },
      },
    },
    sequelize,
    modelName: 'Role',
  },
);

export default Role;
