/**
 * 数据字典类型
 *
 * sobird<i@sobird.me> at 2024/01/10 22:05:01 created.
 */

import {
  DataTypes,
  type InferAttributes,
  InferCreationAttributes,
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

import type { DictionaryItem } from './dictionaryItem';

/** These are all the attributes in the DictionaryType model */
export type DictionaryTypeAttributes = InferAttributes<DictionaryType>;

/** Some attributes are optional in `DictionaryType.build` and `DictionaryType.create` calls */
export type DictionaryTypeCreationAttributes = InferCreationAttributes<DictionaryType>;

export class DictionaryType extends BaseModel<DictionaryTypeAttributes, DictionaryTypeCreationAttributes> {
  declare name: string;

  declare code: string;

  declare status: string;

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

  static associate({ DictionaryItem }) {
    this.hasMany(DictionaryItem, { foreignKey: 'typeId' });
  }

  declare static associations: {
    Items: Association<DictionaryType, DictionaryItem>;
  };
}

DictionaryType.init(
  {
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
