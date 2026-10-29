/**
 * Menu Model
 *
 * sobird<i@sobird.me> at 2023/12/05 10:56:40 created.
 */

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
} from 'sequelize';

import { sequelize, BaseModel } from '@/lib/sequelize';

import type { Models } from './index';
import { Permission } from './Permission';

/** These are all the attributes in the Menu model */
export type MenuAttributes = Attributes<Menu>;
/** Some attributes are optional in `Menu.build` and `Menu.create` calls */
export type MenuCreationAttributes = CreationAttributes<Menu>;

export class Menu extends BaseModel<Menu> {
  declare id: CreationOptional<number>;
  declare permissionId: CreationOptional<number | null>;
  declare name: string;
  declare icon: string;
  declare href: string;
  declare description: string;
  declare parentId: number;
  declare sort: number;

  // Permission, alias 'Permission'
  declare Permission: NonAttribute<Permission>;
  declare getPermission: BelongsToGetAssociationMixin<Permission>;
  declare setPermission: BelongsToSetAssociationMixin<Permission, Permission['id']>;
  declare createPermission: BelongsToCreateAssociationMixin<Permission>;

  // Menu, alias 'parent'
  declare parent: NonAttribute<Menu | null>;
  declare getParent: BelongsToGetAssociationMixin<Menu>;
  declare setParent: BelongsToSetAssociationMixin<Menu, Menu['id']>;
  declare createParent: BelongsToCreateAssociationMixin<Menu>;

  // Menu, alias 'children'
  declare children: NonAttribute<Menu[]>;
  declare getChildren: HasManyGetAssociationsMixin<Menu>;
  declare setChildren: HasManySetAssociationsMixin<Menu, Menu['id']>;
  declare addChild: HasManyAddAssociationMixin<Menu, Menu['id']>;
  declare addChildren: HasManyAddAssociationsMixin<Menu, Menu['id']>;
  declare removeChild: HasManyRemoveAssociationMixin<Menu, Menu['id']>;
  declare removeChildren: HasManyRemoveAssociationsMixin<Menu, Menu['id']>;
  declare hasChild: HasManyHasAssociationMixin<Menu, Menu['id']>;
  declare hasChildren: HasManyHasAssociationsMixin<Menu, Menu['id']>;
  declare createChild: HasManyCreateAssociationMixin<Menu>;
  declare countChildren: HasManyCountAssociationsMixin;

  static associate({ Permission: PermissionModel }: Models) {
    this.belongsTo(PermissionModel, { foreignKey: 'permissionId', onDelete: 'CASCADE' });
    this.belongsTo(Menu, { as: 'parent', foreignKey: 'parentId', onDelete: 'SET NULL' });
    this.hasMany(Menu, { as: 'children', foreignKey: 'parentId' });
  }

  declare static associations: {
    Permission: Association<Menu, Permission>;
    parent: Association<Menu, Menu>;
    children: Association<Menu, Menu>;
  };
}

Menu.init(
  {
    id: {
      type: DataTypes.INTEGER(),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    permissionId: {
      type: DataTypes.INTEGER,
      references: {
        model: Permission,
        key: 'id',
      },
      comment: 'permission id',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    href: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.STRING,
    },
    parentId: {
      type: DataTypes.INTEGER,
    },
    sort: {
      type: DataTypes.INTEGER,
    },
  },
  {
    sequelize,
    modelName: 'Menu',
    indexes: [{ name: 'menus_parent_id', fields: ['parent_id'] }],
  },
);
