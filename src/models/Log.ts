/**
 * Log Model
 *
 * sobird<i@sobird.me> at 2023/12/03 22:01:07 created.
 */

import { DataTypes, type Attributes, type CreationAttributes } from 'sequelize';

import { sequelize, BaseModel } from '@/lib/sequelize';

/** These are all the attributes in the Log model */
export type LogAttributes = Attributes<Log>;
/** Some attributes are optional in `Log.build` and `Log.create` calls */
export type LogCreationAttributes = CreationAttributes<Log>;

export class Log extends BaseModel<Log> {
  declare type: string;

  declare content: string;

  declare operator: number;

  declare agent: string;
}

Log.init(
  {
    type: {
      type: DataTypes.STRING,
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    operator: {
      type: DataTypes.INTEGER,
    },
    agent: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: 'Log',
  },
);
