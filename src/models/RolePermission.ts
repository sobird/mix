/**
 * RolePermission Associate(M:N) Model
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

import type { Models } from './index';
import { Permission } from './Permission';
import { Role } from './Role';

/** These are all the attributes in the RolePermission model */
export type RolePermissionAttributes = Attributes<RolePermission>;
/** Some attributes are optional in `RolePermission.build` and `RolePermission.create` calls */
export type RolePermissionCreationAttributes = CreationAttributes<RolePermission>;

export class RolePermission extends BaseModel<RolePermission> {
  declare roleId: number;
  declare permissionId: number;
  declare rules: JSON;

  // Role, alias 'Role'
  declare Role: NonAttribute<Role>;
  declare getRole: BelongsToGetAssociationMixin<Role>;
  declare setRole: BelongsToSetAssociationMixin<Role, Role['id']>;
  declare createRole: BelongsToCreateAssociationMixin<Role>;

  // Permission, alias 'Permission'
  declare Permission: NonAttribute<Permission>;
  declare getPermission: BelongsToGetAssociationMixin<Permission>;
  declare setPermission: BelongsToSetAssociationMixin<Permission, Permission['id']>;
  declare createPermission: BelongsToCreateAssociationMixin<Permission>;

  static associate({ Role: RoleModel, Permission: PermissionModel }: Models) {
    this.belongsTo(RoleModel, { foreignKey: 'roleId' });
    this.belongsTo(PermissionModel, { foreignKey: 'permissionId' });
  }

  declare static associations: {
    Role: Association<RolePermission, Role>;
    Permission: Association<RolePermission, Permission>;
  };
}

RolePermission.init(
  {
    permissionId: {
      type: DataTypes.INTEGER,
      references: {
        model: Permission,
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
    rules: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'RolePermission',
  },
);
