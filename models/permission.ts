/**
 * Permission Model
 *
 * sobird<i@sobird.me> at 2023/12/01 9:05:12 created.
 */

import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
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

import type Role from './role';

/** These are all the attributes in the Permission model */
export type PermissionAttributes = InferAttributes<Permission>;
/** Some attributes are optional in `Permission.build` and `Permission.create` calls */
export type PermissionCreationAttributes = InferCreationAttributes<Permission>;

class Permission extends BaseModel<PermissionAttributes, PermissionCreationAttributes> {
  declare name: string;

  declare description: string;

  declare action: string;

  declare subject: string;

  declare rules: object;

  declare getRoles: BelongsToManyGetAssociationsMixin<Role>;

  /** Remove all previous associations and set the new ones */
  declare setRoles: BelongsToManySetAssociationsMixin<Role, Role['id']>;

  declare addRole: BelongsToManyAddAssociationMixin<Role, Role['id']>;

  declare addRoles: BelongsToManyAddAssociationsMixin<Role, Role['id']>;

  declare removeRole: BelongsToManyRemoveAssociationMixin<Role, Role['id']>;

  declare removeRoles: BelongsToManyRemoveAssociationsMixin<Role, Role['id']>;

  declare hasRole: BelongsToManyHasAssociationMixin<Role, Role['id']>;

  declare hasRoles: BelongsToManyHasAssociationsMixin<Role, Role['id']>;

  declare createRole: BelongsToManyCreateAssociationMixin<Role>;

  declare countRoles: BelongsToManyCountAssociationsMixin;

  static associate({ Role, RolePermission }) {
    this.belongsToMany(Role, { through: RolePermission });
  }

  declare static associations: {
    Roles: Association<Permission, Role>;
  };
}

Permission.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING,
    },
    action: {
      type: DataTypes.STRING,
    },
    subject: {
      type: DataTypes.STRING,
    },
    rules: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    modelName: 'Permission',
    comment: '用户权限表',
  },
);

// Permission.beforeFind()

export default Permission;
