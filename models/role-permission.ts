/**
 * RolePermission Model
 *
 * sobird<i@sobird.me> at 2023/11/30 19:51:05 created.
 */

import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '@/lib/sequelize';
import Role from './role';
import Permission from './permission';

/** These are all the attributes in the RolePermission model */
export interface RolePermissionAttributes {
  id?: number;
  PermissionId: number;
  RoleId: number;
}
/** Some attributes are optional in `RolePermission.build` and `RolePermission.create` calls */
export type RolePermissionCreationAttributes = Optional<RolePermissionAttributes, 'id'>;

class RolePermission extends Model<RolePermissionAttributes, RolePermissionCreationAttributes> {
  declare id: number;

  declare roleId: number;

  declare permissionId: number;
}

RolePermission.init(
  {
    PermissionId: {
      type: DataTypes.INTEGER,
      references: {
        model: Permission, // 'Movies' 也可以使用
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
    modelName: 'rolePermission',
  },
);

export default RolePermission;
