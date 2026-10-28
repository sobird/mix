/**
 * Organization Model
 *
 * sobird<i@sobird.me> at 2023/11/29 10:37:29 created.
 */

import { DataTypes, type Attributes, type CreationAttributes } from 'sequelize';

import { sequelize, BaseModel } from '@/lib/sequelize';

/** These are all the attributes in the Organization model */
export type OrganizationAttributes = Attributes<Organization>;
/** Some attributes are optional in `Organization.build` and `Organization.create` calls */
export type OrganizationCreationAttributes = CreationAttributes<Organization>;

export class Organization extends BaseModel<Organization> {
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
