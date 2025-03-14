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

import { sequelize, BaseModel, PermissionTemplate } from '@/lib/sequelize';

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

  static permission: PermissionTemplate = {
    create: {
      description: '创建角色',
      roles: [1, 2], // 默认分配给这些角色
    },
    delete: {
      description: '删除角色',
      roles: [1, 2],
    },
    update: {
      description: '更新角色',
      roles: [1, 2],
    },
    read: {
      description: '查看角色',
      roles: [1, 2],
      rules: [
        {
          fields: ['id', 'title', 'content'],
        },
      ],
    },
  };
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

const seeds: RoleCreationAttributes[] = [
  { name: '拥有者', description: '系统创建者角色' },
  { name: '管理者', description: '系统管理者角色' },
  { name: '成员', description: '普通用户角色' },
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
