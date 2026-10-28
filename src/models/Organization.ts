/**
 * Organization Model
 *
 * sobird<i@sobird.me> at 2023/11/29 10:37:29 created.
 */

import { DataTypes, type InferAttributes, type InferCreationAttributes } from 'sequelize';

import { sequelize, BaseModel } from '@/lib/sequelize';

/** These are all the attributes in the Organization model */
export type OrganizationAttributes = InferAttributes<Organization>;
/** Some attributes are optional in `Organization.build` and `Organization.create` calls */
export type OrganizationCreationAttributes = InferCreationAttributes<Organization>;

export class Organization extends BaseModel<OrganizationAttributes, OrganizationCreationAttributes> {
  declare name: string;

  declare description: string;

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
