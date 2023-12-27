/**
 * Permission Model
 *
 * sobird<i@sobird.me> at 2023/12/01 9:05:12 created.
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
import type Role from './user';

/** These are all the attributes in the Permission model */
export interface PermissionAttributes {
  id?: number;
  name: string;
  description: string;
  operator: string;
  target: string;
  rules: object;
}
/** Some attributes are optional in `Permission.build` and `Permission.create` calls */
export type PermissionCreationAttributes = Optional<PermissionAttributes, 'id'>;

class Permission extends BaseModel<PermissionAttributes, PermissionCreationAttributes> {
  declare id: number;

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
    operator: {
      type: DataTypes.STRING,
    },
    target: {
      type: DataTypes.STRING,
    },
    rules: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    modelName: 'Permission',
  },
);

// Permission.beforeFind()

export default Permission;
