/**
 * Group Model
 *
 * sobird<i@sobird.me> at 2023/11/30 19:51:05 created.
 */

import {
  DataTypes,
  type Attributes,
  type CreationAttributes,
  type Association,
  type NonAttribute,
  type BelongsToGetAssociationMixin,
  type BelongsToSetAssociationMixin,
  type BelongsToCreateAssociationMixin,
  type HasManyGetAssociationsMixin,
  type HasManySetAssociationsMixin,
  type HasManyAddAssociationMixin,
  type HasManyAddAssociationsMixin,
  type HasManyRemoveAssociationMixin,
  type HasManyRemoveAssociationsMixin,
  type HasManyHasAssociationMixin,
  type HasManyHasAssociationsMixin,
  type HasManyCreateAssociationMixin,
  type HasManyCountAssociationsMixin,
} from 'sequelize';

import { sequelize, BaseModel } from '@/lib/sequelize';

/** These are all the attributes in the Group model */
export type GroupAttributes = Attributes<Group>;
/** Some attributes are optional in `Group.build` and `Group.create` calls */
export type GroupCreationAttributes = CreationAttributes<Group>;

export class Group extends BaseModel<Group> {
  declare name: string;
  declare description: string;
  declare parentId: number;

  // Group, alias 'parent'
  declare parent: NonAttribute<Group | null>;
  declare getParent: BelongsToGetAssociationMixin<Group>;
  declare setParent: BelongsToSetAssociationMixin<Group, Group['id']>;
  declare createParent: BelongsToCreateAssociationMixin<Group>;

  // Group, alias 'children'
  declare children: NonAttribute<Group[]>;
  declare getChildren: HasManyGetAssociationsMixin<Group>;
  declare setChildren: HasManySetAssociationsMixin<Group, Group['id']>;
  declare addChild: HasManyAddAssociationMixin<Group, Group['id']>;
  declare addChildren: HasManyAddAssociationsMixin<Group, Group['id']>;
  declare removeChild: HasManyRemoveAssociationMixin<Group, Group['id']>;
  declare removeChildren: HasManyRemoveAssociationsMixin<Group, Group['id']>;
  declare hasChild: HasManyHasAssociationMixin<Group, Group['id']>;
  declare hasChildren: HasManyHasAssociationsMixin<Group, Group['id']>;
  declare createChild: HasManyCreateAssociationMixin<Group>;
  declare countChildren: HasManyCountAssociationsMixin;

  static associate() {
    this.belongsTo(Group, { as: 'parent', foreignKey: 'parentId' });
    this.hasMany(Group, { as: 'children', foreignKey: 'parentId' });
  }

  declare static associations: {
    parent: Association<Group, Group>;
    children: Association<Group, Group>;
  };
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
