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

import { ForcedSubject, InferSubjects, RawRule } from '@casl/ability';
import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationAttributes,
  type CreationOptional,
  type Association,
  type NonAttribute,
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
export type RoleCreationAttributes = CreationAttributes<Role>;

export type Subjects = InferSubjects<'Role' | 'all'>;
export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage';

type RoleAbilities = [
  Actions,
  Subjects,
];

export interface PermissionTemplate {
  name: string;
  subject: string;

  rules: Omit<RawRule<RoleAbilities>, 'subject'>[]

  // [key: string]: {
  //   description: string;
  //   roles: number[];
  //   rules?: Partial<RawRule>[];
  // }
}

class Role extends BaseModel<RoleAttributes, InferCreationAttributes<Role>> {
  declare parentId?: CreationOptional<number>;

  declare name: string;

  declare description: CreationOptional<string> | null;

  declare defaultable: CreationOptional<boolean>;

  declare editable: CreationOptional<boolean>;

  declare isDefault: CreationOptional<boolean>;

  declare isBuiltin: CreationOptional<boolean>;

  // include Model
  declare Permissions: NonAttribute<Permission[]>;

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
    this.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId' });
  }

  // 系统级角色表权限定义
  static permission: PermissionTemplate = {
    name: '角色权限设置',
    subject: Role.name,
    rules: [
      {
        action: 'create',
        fields: [],
        conditions: {
          $lte: '',
        },
        inverted: false,
        reason: '',
      },
    ],
    // actions: [
    //   {
    //     name: '创建自定义角色',
    //     action: 'create',
    //     roles: [1, 2],
    //   },
    //   {
    //     name: '删除角色',
    //     action: 'delete',
    //     roles: [1, 2],
    //   },
    //   {
    //     name: '更新角色',
    //     action: 'update',
    //     roles: [1, 2],
    //   },
    //   {
    //     name: '查看角色',
    //     action: 'read',
    //     roles: [1, 2],
    //     rules: [
    //       {
    //         fields: ['id', 'title', 'content'],
    //       },
    //     ],
    //   },
    //   {
    //     name: '设置成员的默认角色',
    //     action: 'set.default',
    //     roles: [1, 2],
    //   },
    // ],
  };
}

Role.init(
  {
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
      defaultValue: 0,
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

const seeds: RoleCreationAttributes[] = [
  {
    name: '拥有者',
    description: '系统拥有者角色',
    isBuiltin: true,
    editable: false,
    defaultable: false,
  },
  {
    name: '管理员',
    description: '系统管理员角色',
    isBuiltin: true,
  },
  {
    name: '成员',
    description: '普通用户角色',
    isBuiltin: true,
    isDefault: true,
  },
];

Role.afterSync(async () => {
  await Role.bulkCreate(seeds, { individualHooks: true, validate: true });
});

Role.afterBulkSync(() => {
  console.log('Role afterBulkSync', 121212);
});

// Init Permission
Role.afterBulkCreate(() => {
  console.log('afterCreate', 1234);
});

export default Role;
