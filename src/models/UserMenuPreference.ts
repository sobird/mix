/**
 * UserMenuPreference Model
 *
 * Per-user menu preferences (favorite / hidden / sort) over the global menu tree.
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
} from 'sequelize';

import { sequelize, BaseModel } from '@/lib/sequelize';

import type { Models } from './index';
import { Menu } from './Menu';
import { User } from './User';

/** These are all the attributes in the UserMenuPreference model */
export type UserMenuPreferenceAttributes = Attributes<UserMenuPreference>;
/** Some attributes are optional in `UserMenuPreference.build` and `UserMenuPreference.create` calls */
export type UserMenuPreferenceCreationAttributes = CreationAttributes<UserMenuPreference>;

export class UserMenuPreference extends BaseModel<UserMenuPreference> {
  declare userId: number;
  declare menuId: number;
  declare favorite: CreationOptional<boolean>;
  declare hidden: CreationOptional<boolean>;
  declare sort: CreationOptional<number>;

  // User, alias 'User'
  declare User: NonAttribute<User>;
  declare getUser: BelongsToGetAssociationMixin<User>;
  declare setUser: BelongsToSetAssociationMixin<User, User['id']>;
  declare createUser: BelongsToCreateAssociationMixin<User>;

  // Menu, alias 'Menu'
  declare Menu: NonAttribute<Menu>;
  declare getMenu: BelongsToGetAssociationMixin<Menu>;
  declare setMenu: BelongsToSetAssociationMixin<Menu, Menu['id']>;
  declare createMenu: BelongsToCreateAssociationMixin<Menu>;

  static associate({ User: UserModel, Menu: MenuModel }: Models) {
    this.belongsTo(UserModel, { foreignKey: 'userId', onDelete: 'CASCADE' });
    this.belongsTo(MenuModel, { foreignKey: 'menuId', onDelete: 'CASCADE' });
  }

  declare static associations: {
    User: Association<UserMenuPreference, User>;
    Menu: Association<UserMenuPreference, Menu>;
  };
}

UserMenuPreference.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    menuId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: Menu,
        key: 'id',
      },
    },
    favorite: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    hidden: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'UserMenuPreference',
    paranoid: false,
  },
);
