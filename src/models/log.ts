/**
 * Log Model
 *
 * sobird<i@sobird.me> at 2023/12/03 22:01:07 created.
 */

import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';

import { sequelize, BaseModel } from '@/lib/sequelize';

/** These are all the attributes in the Log model */
export type LogAttributes = InferAttributes<Log>;
/** Some attributes are optional in `Log.build` and `Log.create` calls */
export type LogCreationAttributes = InferCreationAttributes<Log>;

class Log extends BaseModel<LogAttributes, LogCreationAttributes> {
  // declare id: never;

  type: string;

  content: string;

  operator: string;

  agent: string;

  // test: number;
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

export default Log;
