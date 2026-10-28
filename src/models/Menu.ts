/**
 * Menu Model
 *
 * sobird<i@sobird.me> at 2023/12/05 10:56:40 created.
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

import type { User } from './User';

/** These are all the attributes in the Menu model */
export type MenuAttributes = Attributes<Menu>;
/** Some attributes are optional in `Menu.build` and `Menu.create` calls */
export type MenuCreationAttributes = CreationAttributes<Menu>;

export class Menu extends BaseModel<Menu> {
  declare userId: number;
  declare name: string;
  declare icon: string;
  declare href: string;
  declare description: string;
  declare parentId: number;
  declare sort: number;

  // User, alias 'User'
  declare User: NonAttribute<User>;
  declare getUser: BelongsToGetAssociationMixin<User>;
  declare setUser: BelongsToSetAssociationMixin<User, User['id']>;
  declare createUser: BelongsToCreateAssociationMixin<User>;

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

  static associate({ User }) {
    this.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
    this.belongsTo(Menu, { as: 'parent', foreignKey: 'parentId' });
    this.hasMany(Menu, { as: 'children', foreignKey: 'parentId' });
  }

  declare static associations: {
    User: Association<Menu, User>;
    parent: Association<Menu, Menu>;
    children: Association<Menu, Menu>;
  };
}

Menu.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      comment: 'user id',
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
  },
);
