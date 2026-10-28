/**
 * Organization Model
 *
 * sobird<i@sobird.me> at 2023/11/29 10:37:29 created.
 */

import {
  Model, DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';

import { sequelize } from '@/lib/sequelize';

/** These are all the attributes in the Organization model */
export type OrganizationAttributes = InferAttributes<Organization>;
/** Some attributes are optional in `Organization.build` and `Organization.create` calls */
export type OrganizationCreationAttributes = InferCreationAttributes<Organization>;

class Organization extends Model<OrganizationAttributes, OrganizationCreationAttributes> {
  name: string;

  description: string;

  // public userId: number;
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
    modelName: 'Organization',
  },
);

export default Organization;
