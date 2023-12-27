/**
 * Menu Model
 *
 * sobird<i@sobird.me> at 2023/12/05 10:56:40 created.
 */

import { Model, DataTypes, type Optional } from 'sequelize';
import { sequelize } from '@/lib/sequelize';

/** These are all the attributes in the Menu model */
export interface MenuAttributes {
  name: string;
  icon: string;
  href: string;
  description: string;
  parentId: number;
  sort: number;
}
/** Some attributes are optional in `Menu.build` and `Menu.create` calls */
export type MenuCreationAttributes = Optional<MenuAttributes, 'description'>;

class Menu extends Model<MenuAttributes, MenuCreationAttributes> {
  declare id: number;

  public userId: number;
}

Menu.init(
  {
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
