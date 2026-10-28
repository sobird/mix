/**
 * 数据字典类型
 *
 * sobird<i@sobird.me> at 2024/01/10 22:05:01 created.
 */

import {
  DataTypes,
  type Attributes,
  type CreationAttributes,
  type CreationOptional,
  type Association,
  type NonAttribute,
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

import type { DictionaryItem } from './DictionaryItem';
import type { Models } from './index';

/** These are all the attributes in the DictionaryType model */
export type DictionaryTypeAttributes = Attributes<DictionaryType>;

/** Some attributes are optional in `DictionaryType.build` and `DictionaryType.create` calls */
export type DictionaryTypeCreationAttributes = CreationAttributes<DictionaryType>;

export class DictionaryType extends BaseModel<DictionaryType> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare code: string;
  declare status: string;

  // DictionaryItem, alias 'Items'
  declare Items: NonAttribute<DictionaryItem[]>;
  declare getItems: HasManyGetAssociationsMixin<DictionaryItem>;
  declare setItems: HasManySetAssociationsMixin<DictionaryItem, DictionaryItem['id']>;
  declare addItem: HasManyAddAssociationMixin<DictionaryItem, DictionaryItem['id']>;
  declare addItems: HasManyAddAssociationsMixin<DictionaryItem, DictionaryItem['id']>;
  declare removeItem: HasManyRemoveAssociationMixin<DictionaryItem, DictionaryItem['id']>;
  declare removeItems: HasManyRemoveAssociationsMixin<DictionaryItem, DictionaryItem['id']>;
  declare hasItem: HasManyHasAssociationMixin<DictionaryItem, DictionaryItem['id']>;
  declare hasItems: HasManyHasAssociationsMixin<DictionaryItem, DictionaryItem['id']>;
  declare createItem: HasManyCreateAssociationMixin<DictionaryItem>;
  declare countItems: HasManyCountAssociationsMixin;

  static associate({ DictionaryItem }: Models) {
    this.hasMany(DictionaryItem, { as: 'Items', foreignKey: 'typeId' });
  }

  declare static associations: {
    Items: Association<DictionaryType, DictionaryItem>;
  };
}

DictionaryType.init(
  {
    id: {
      type: DataTypes.INTEGER(),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      unique: true,
      allowNull: false,
      comment: 'Dictionary Name',
    },
    code: {
      type: DataTypes.STRING(120),
      allowNull: false,
      comment: 'Dictionary Type',
    },
    status: {
      type: DataTypes.CHAR(1),
      defaultValue: '1',
      comment: '状态（1正常 0停用）',
    },
  },
  {
    sequelize,
    modelName: 'DictionaryType',
  },
);
