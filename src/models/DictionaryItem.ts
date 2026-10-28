/**
 * 数据字典数据表
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
  type BelongsToGetAssociationMixin,
  type BelongsToSetAssociationMixin,
  type BelongsToCreateAssociationMixin,
} from 'sequelize';

import { sequelize, BaseModel } from '@/lib/sequelize';

import type { DictionaryType } from './DictionaryType';
import type { Models } from './index';

/** These are all the attributes in the DictionaryItem model */
export type DictionaryItemAttributes = Attributes<DictionaryItem>;

/** Some attributes are optional in `DictionaryItem.build` and `DictionaryItem.create` calls */
export type DictionaryItemCreationAttributes = CreationAttributes<DictionaryItem>;

export class DictionaryItem extends BaseModel<DictionaryItem> {
  declare id: CreationOptional<number>;
  declare label: string;
  declare value: string;
  declare sort: number;
  declare status: string;
  declare typeId: number;

  // DictionaryType, alias 'DictionaryType'
  declare DictionaryType: NonAttribute<DictionaryType>;
  declare getDictionaryType: BelongsToGetAssociationMixin<DictionaryType>;
  declare setDictionaryType: BelongsToSetAssociationMixin<DictionaryType, DictionaryType['id']>;
  declare createDictionaryType: BelongsToCreateAssociationMixin<DictionaryType>;

  static associate({ DictionaryType }: Models) {
    this.belongsTo(DictionaryType, { foreignKey: 'typeId' });
  }

  declare static associations: {
    DictionaryType: Association<DictionaryItem, DictionaryType>;
  };
}

DictionaryItem.init(
  {
    id: {
      type: DataTypes.INTEGER(),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    label: {
      type: DataTypes.STRING(120),
      allowNull: false,
      comment: '字典名称',
    },
    value: {
      type: DataTypes.STRING(120),
      allowNull: false,
      comment: '字典类型',
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.CHAR(1),
      defaultValue: '1',
      comment: '状态（1正常 0停用）',
    },
    typeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'DictionaryItem',
    indexes: [{ name: 'dictionary_items_type_id', fields: ['typeId'] }],
  },
);
