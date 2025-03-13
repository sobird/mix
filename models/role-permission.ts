/**
 * RolePermission Associate(M:N) Model
 *
 * sobird<i@sobird.me> at 2023/11/30 19:51:05 created.
 */

import {
  Model, DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';

import { sequelize } from '@/lib/sequelize';

import Permission from './permission';
import Role from './role';

/** These are all the attributes in the RolePermission model */
export type RolePermissionAttributes = InferAttributes<RolePermission>;
/** Some attributes are optional in `RolePermission.build` and `RolePermission.create` calls */
export type RolePermissionCreationAttributes = InferCreationAttributes<RolePermission>;

class RolePermission extends Model<RolePermissionAttributes, RolePermissionCreationAttributes> {
  declare roleId: number;

  declare permissionId: number;
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
  },
  {
    sequelize,
    modelName: 'RolePermission',
  },
);

export default RolePermission;
