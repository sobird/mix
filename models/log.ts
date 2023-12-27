/**
 * Log Model
 *
 * sobird<i@sobird.me> at 2023/12/03 22:01:07 created.
 */

import { Model, DataTypes, type Optional } from 'sequelize';
import { sequelize } from '@/lib/sequelize';

/** These are all the attributes in the Log model */
export interface LogAttributes {
  type: string;
  content: string;
  operator: number;
  agent: string;
}
/** Some attributes are optional in `Log.build` and `Log.create` calls */
export type LogCreationAttributes = Optional<LogAttributes, 'agent'>;

class Log extends Model<LogAttributes, LogCreationAttributes> {
  declare id: number;
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
