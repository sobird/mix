/**
 * Role Model
 *
 * A Role holds information about a user's current signin state.
 *
 * sobird<i@sobird.me> at 2023/11/30 19:51:05 created.
 */

import {
  Model,
  DataTypes,
  type Optional,
  BelongsToManyGetAssociationsMixin,
  BelongsToManySetAssociationsMixin,
  BelongsToManyAddAssociationMixin,
  BelongsToManyAddAssociationsMixin,
  BelongsToManyRemoveAssociationMixin,
  BelongsToManyRemoveAssociationsMixin,
  BelongsToManyHasAssociationMixin,
  BelongsToManyHasAssociationsMixin,
  BelongsToManyCreateAssociationMixin,
  BelongsToManyCountAssociationsMixin,
} from 'sequelize';
import sequelize from '@/lib/sequelize';
import type User from './user';

/** These are all the attributes in the Role model */
export interface RoleAttributes {
  id?: number;
  parentId: number,
  name: string;
  description: string;
}
/** Some attributes are optional in `Role.build` and `Role.create` calls */
export type RoleCreationAttributes = Optional<RoleAttributes, 'id'>;

class Role extends Model<RoleAttributes, RoleCreationAttributes> {
  declare id: number;

  declare getUsers: BelongsToManyGetAssociationsMixin<User>;

  /** Remove all previous associations and set the new ones */
  declare setUsers: BelongsToManySetAssociationsMixin<User, User['id']>;

  declare addUser: BelongsToManyAddAssociationMixin<User, User['id']>;

  declare addUsers: BelongsToManyAddAssociationsMixin<User, User['id']>;

  declare removeUser: BelongsToManyRemoveAssociationMixin<User, User['id']>;

  declare removeUsers: BelongsToManyRemoveAssociationsMixin<User, User['id']>;

  declare hasUser: BelongsToManyHasAssociationMixin<User, User['id']>;

  declare hasUsers: BelongsToManyHasAssociationsMixin<User, User['id']>;

  declare createUser: BelongsToManyCreateAssociationMixin<User>;

  declare countUsers: BelongsToManyCountAssociationsMixin;
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
    parentId: {
      type: DataTypes.INTEGER,
    },
  },
  {
    sequelize,
  },
);

export default Role;
