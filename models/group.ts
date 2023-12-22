/**
 * Group Model
 *
 * sobird<i@sobird.me> at 2023/11/30 19:51:05 created.
 */

import {
  Model,
  DataTypes,
  type Optional,
} from 'sequelize';
import { sequelize } from '@/lib/sequelize';

/** These are all the attributes in the Group model */
export interface GroupAttributes {
  id?: number;
  parentId: number,
  name: string;
  description: string;
}
/** Some attributes are optional in `Group.build` and `Group.create` calls */
export type GroupCreationAttributes = Optional<GroupAttributes, 'id'>;

class Group extends Model<GroupAttributes, GroupCreationAttributes> {
  declare id: number;
}

Group.init(
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
    },
  },
  {
    sequelize,
    modelName: 'group',
  },
);

export default Group;
