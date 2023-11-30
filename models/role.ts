/**
 * Role Model
 *
 * A Role holds information about a user's current signin state.
 *
 * sobird<i@sobird.me> at 2023/11/30 19:51:05 created.
 */

import { Model, DataTypes, type Optional } from 'sequelize';
import sequelize from '@/lib/sequelize';

/** These are all the attributes in the Role model */
export interface RoleAttributes {
  id?: number;
  name: string;
  description: string;
}
/** Some attributes are optional in `Role.build` and `Role.create` calls */
export type RoleCreationAttributes = Optional<RoleAttributes, 'id'>;

class Role extends Model<RoleAttributes, RoleCreationAttributes> {
  declare id: number;

  public userId!: number;
}

Role.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
  },
);

export default Role;
