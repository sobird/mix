/**
 * Menu Model
 *
 * sobird<i@sobird.me> at 2023/12/05 10:56:40 created.
 */

import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';

import { sequelize, BaseModel } from '@/lib/sequelize';

/** These are all the attributes in the Menu model */
export type MenuAttributes = InferAttributes<Menu>;
/** Some attributes are optional in `Menu.build` and `Menu.create` calls */
export type MenuCreationAttributes = InferCreationAttributes<Menu>;

class Menu extends BaseModel<MenuAttributes, MenuCreationAttributes> {
  declare userId: number;

  declare name: string;

  declare icon: string;

  declare href: string;

  declare description: string;

  declare parentId: number;

  declare sort: number;

  static associate({ User }) {
    this.belongsTo(User, { onDelete: 'cascade' });
  }
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
      type: DataTypes.INTEGER,
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

export default Menu;
