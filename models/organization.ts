/**
 * Organization Model
 *
 * sobird<i@sobird.me> at 2023/11/29 10:37:29 created.
 */

import { Model, DataTypes, type Optional } from 'sequelize';
import { sequelize } from '@/lib/sequelize';

/** These are all the attributes in the Organization model */
export interface OrganizationAttributes {
  name: string;
  description: string;
}
/** Some attributes are optional in `Organization.build` and `Organization.create` calls */
export type OrganizationCreationAttributes = Optional<OrganizationAttributes, 'description'>;

class Organization extends Model<OrganizationAttributes, OrganizationCreationAttributes> {
  declare id: number;

  public userId: number;
}

Organization.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
  },
);

export default Organization;
