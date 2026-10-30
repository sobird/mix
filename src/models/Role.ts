/**
 * Role Model
 *
 * @PermissionRules
 * Admin Can Create any Role
 * Admin Can Read any Role
 * Admin Can Update any Role
 * Admin Can Delete non System Role
 * User Cannot Manage any Role
 *
 * sobird<i@sobird.me> at 2023/11/30 19:51:05 created.
 */

import { InferSubjects } from '@casl/ability';
import {
  DataTypes,
  type Attributes,
  type CreationAttributes,
  type CreationOptional,
  type Association,
  type NonAttribute,
  type BelongsToGetAssociationMixin,
  type BelongsToSetAssociationMixin,
  type BelongsToCreateAssociationMixin,
  type HasManyGetAssociationsMixin,
  type HasManySetAssociationsMixin,
  type HasManyAddAssociationMixin,
  type HasManyAddAssociationsMixin,
  type HasManyRemoveAssociationMixin,
  type HasManyRemoveAssociationsMixin,
  type HasManyHasAssociationMixin,
  type HasManyHasAssociationsMixin,
  type HasManyCreateAssociationMixin,
  type HasManyCountAssociationsMixin,
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
import type { Permission } from './Permission';
import type { User } from './User';

/** These are all the attributes in the Role model */
export type RoleAttributes = Attributes<Role>;
/** Some attributes are optional in `Role.build` and `Role.create` calls */
export type RoleCreationAttributes = CreationAttributes<Role>;

export type Subjects = InferSubjects<'Role' | 'all'>;
export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage';

export class Role extends BaseModel<Role> {
  declare id: CreationOptional<number>;
  declare parentId?: CreationOptional<number>;
  declare name: string;
  declare description: CreationOptional<string> | null;
  declare defaultable: CreationOptional<boolean>;
  declare editable: CreationOptional<boolean>;
  declare isDefault: CreationOptional<boolean>;
  declare isBuiltin: CreationOptional<boolean>;
  // User, alias 'Users'
  declare Users: NonAttribute<User[]>;
  declare getUsers: BelongsToManyGetAssociationsMixin<User>;
  declare setUsers: BelongsToManySetAssociationsMixin<User, User['id']>;
  declare addUser: BelongsToManyAddAssociationMixin<User, User['id']>;
  declare addUsers: BelongsToManyAddAssociationsMixin<User, User['id']>;
  declare removeUser: BelongsToManyRemoveAssociationMixin<User, User['id']>;
  declare removeUsers: BelongsToManyRemoveAssociationsMixin<User, User['id']>;
  declare hasUser: BelongsToManyHasAssociationMixin<User, User['id']>;
  declare hasUsers: BelongsToManyHasAssociationsMixin<User, User['id']>;
  declare createUser: BelongsToManyCreateAssociationMixin<User>;
  declare countUsers: BelongsToManyCountAssociationsMixin;

  // Permission, alias 'Permissions'
  declare Permissions: NonAttribute<Permission[]>;
  declare getPermissions: BelongsToManyGetAssociationsMixin<Permission>;
  declare setPermissions: BelongsToManySetAssociationsMixin<Permission, Permission['id']>;
  declare addPermission: BelongsToManyAddAssociationMixin<Permission, Permission['id']>;
  declare addPermissions: BelongsToManyAddAssociationsMixin<Permission, Permission['id']>;
  declare removePermission: BelongsToManyRemoveAssociationMixin<Permission, Permission['id']>;
  declare removePermissions: BelongsToManyRemoveAssociationsMixin<Permission, Permission['id']>;
  declare hasPermission: BelongsToManyHasAssociationMixin<Permission, Permission['id']>;
  declare hasPermissions: BelongsToManyHasAssociationsMixin<Permission, Permission['id']>;
  declare createPermission: BelongsToManyCreateAssociationMixin<Permission>;
  declare countPermissions: BelongsToManyCountAssociationsMixin;

  // Role, alias 'parent'
  declare parent: NonAttribute<Role | null>;
  declare getParent: BelongsToGetAssociationMixin<Role>;
  declare setParent: BelongsToSetAssociationMixin<Role, Role['id']>;
  declare createParent: BelongsToCreateAssociationMixin<Role>;

  // Role, alias 'children'
  declare children: NonAttribute<Role[]>;
  declare getChildren: HasManyGetAssociationsMixin<Role>;
  declare setChildren: HasManySetAssociationsMixin<Role, Role['id']>;
  declare addChild: HasManyAddAssociationMixin<Role, Role['id']>;
  declare addChildren: HasManyAddAssociationsMixin<Role, Role['id']>;
  declare removeChild: HasManyRemoveAssociationMixin<Role, Role['id']>;
  declare removeChildren: HasManyRemoveAssociationsMixin<Role, Role['id']>;
  declare hasChild: HasManyHasAssociationMixin<Role, Role['id']>;
  declare hasChildren: HasManyHasAssociationsMixin<Role, Role['id']>;
  declare createChild: HasManyCreateAssociationMixin<Role>;
  declare countChildren: HasManyCountAssociationsMixin;

  declare static associations: {
    Users: Association<Role, User>;
    Permissions: Association<Role, Permission>;
    parent: Association<Role, Role>;
    children: Association<Role, Role>;
  };

  static associate({ User, UserRole, Permission, RolePermission }: Models) {
    this.belongsToMany(User, { through: UserRole, foreignKey: 'roleId', otherKey: 'userId' });
    this.belongsToMany(Permission, {
      through: RolePermission,
      foreignKey: 'roleId',
      otherKey: 'permissionId',
    });
    this.belongsTo(Role, { as: 'parent', foreignKey: 'parentId', onDelete: 'SET NULL' });
    this.hasMany(Role, { as: 'children', foreignKey: 'parentId' });
  }
}

Role.init(
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
      unique: true,
      comment: '角色名称',
    },
    description: {
      type: DataTypes.STRING,
      comment: '角色描述',
    },
    parentId: {
      type: DataTypes.INTEGER,
      comment: '父级角色ID，null 表示根角色',
    },
    defaultable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '能否设置为默认值',
    },
    editable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '能否编辑',
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否为默认角色',
    },
    isBuiltin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否为内置角色',
    },
  },
  {
    sequelize,
    modelName: 'Role',
    indexes: [{ name: 'roles_parent_id', fields: ['parent_id'] }],
  },
);
