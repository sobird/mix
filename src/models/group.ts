/**
 * Group Model
 *
 * sobird<i@sobird.me> at 2023/11/30 19:51:05 created.
 */

import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';

import { sequelize, BaseModel } from '@/lib/sequelize';

/** These are all the attributes in the Group model */
export type GroupAttributes = InferAttributes<Group>;
/** Some attributes are optional in `Group.build` and `Group.create` calls */
export type GroupCreationAttributes = InferCreationAttributes<Group>;

class Group extends BaseModel<GroupAttributes, GroupCreationAttributes> {
  declare name: string;

  declare description: string;

  declare parentId: number;
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
    modelName: 'Group',
  },
);

export default Group;
