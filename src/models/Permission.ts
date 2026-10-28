/**
 * Permission Model
 *
 * 权限编辑页面
 * 该权限可操作如下资源：
 *
 * 系统权限不允许被任何角色/用户修改
 *
 * 由casl中定义的subject和action来定义一个权限项，其中fields,conditions为对此资源的收紧规则
 *
 * @see https://casl.js.org/v6/en/guide/define-rules
 *
 * sobird<i@sobird.me> at 2023/12/01 9:05:12 created.
 */

import {
  DataTypes,
  type Attributes,
  type CreationAttributes,
  type Association,
  type NonAttribute,
  type CreationOptional,
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

import type { Models } from './index';
import type { Role } from './Role';
import type { RolePermission } from './RolePermission';

/** These are all the attributes in the Permission model */
export type PermissionAttributes = Attributes<Permission>;
/** Some attributes are optional in `Permission.build` and `Permission.create` calls */
export type PermissionCreationAttributes = CreationAttributes<Permission>;

export class Permission extends BaseModel<Permission> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description: string;
  declare subject: string;
  declare action: string;
  declare expires: CreationOptional<Date>;
  declare isBuiltin: CreationOptional<boolean>;
  declare RolePermission: NonAttribute<RolePermission>;

  // Role, alias 'Roles'
  declare Roles: NonAttribute<Role[]>;
  declare getRoles: BelongsToManyGetAssociationsMixin<Role>;
  declare setRoles: BelongsToManySetAssociationsMixin<Role, Role['id']>;
  declare addRole: BelongsToManyAddAssociationMixin<Role, Role['id']>;
  declare addRoles: BelongsToManyAddAssociationsMixin<Role, Role['id']>;
  declare removeRole: BelongsToManyRemoveAssociationMixin<Role, Role['id']>;
  declare removeRoles: BelongsToManyRemoveAssociationsMixin<Role, Role['id']>;
  declare hasRole: BelongsToManyHasAssociationMixin<Role, Role['id']>;
  declare hasRoles: BelongsToManyHasAssociationsMixin<Role, Role['id']>;
  declare createRole: BelongsToManyCreateAssociationMixin<Role>;
  declare countRoles: BelongsToManyCountAssociationsMixin;

  static associate({ Role, RolePermission }: Models) {
    this.belongsToMany(Role, {
      through: RolePermission,
      foreignKey: 'permissionId',
      otherKey: 'roleId',
    });
  }

  declare static associations: {
    Roles: Association<Permission, Role>;
  };
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER(),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique: true,
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
    expires: {
      type: DataTypes.DATE,
      comment: 'Permission Expires',
    },
    isBuiltin: {
      type: DataTypes.BOOLEAN,
      comment: 'Built in system permissions',
    },
  },
  {
    sequelize,
    modelName: 'Permission',
    // indexes: [
    //   {
    //     unique: true,
    //     fields: ['action', 'subject'],
    //     name: 'unique_permission',
    //   },
    // ],
    comment: '用户权限表',
  },
);
