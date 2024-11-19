/**
 * 数据字典数据表
 *
 * sobird<i@sobird.me> at 2024/01/10 22:05:01 created.
 */

import {
  DataTypes,
  type InferAttributes, InferCreationAttributes,
} from 'sequelize';

import { BaseModel } from '@/lib/sequelize';

/** These are all the attributes in the DictionaryItem model */
export type DictionaryItemAttributes = InferAttributes<DictionaryItem>;

/** Some attributes are optional in `DictionaryItem.build` and `DictionaryItem.create` calls */
export type DictionaryItemCreationAttributes = InferCreationAttributes<DictionaryItem>;

class DictionaryItem extends BaseModel<DictionaryItemAttributes, DictionaryItemCreationAttributes> {
  label: string;

  value: string;

  sort: number;

  status: string;

  typeId: number;
}

DictionaryItem.define(
  {
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
    modelName: 'DictionaryItem',
  },
);

export default DictionaryItem;
