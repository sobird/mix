/**
 * 数据字典类型
 *
 * sobird<i@sobird.me> at 2024/01/10 22:05:01 created.
 */

import {
  DataTypes,
  type InferAttributes, InferCreationAttributes,
} from 'sequelize';
import { sequelize, BaseModel } from '@/lib/sequelize';

/** These are all the attributes in the DictionaryType model */
export type DictionaryTypeAttributes = InferAttributes<DictionaryType>;

/** Some attributes are optional in `DictionaryType.build` and `DictionaryType.create` calls */
export type DictionaryTypeCreationAttributes = InferCreationAttributes<DictionaryType>;

class DictionaryType extends BaseModel<DictionaryTypeAttributes, DictionaryTypeCreationAttributes> {
  name: string;

  code: string;

  status: string;
}

DictionaryType.init(
  {
    name: {
      type: DataTypes.STRING(120),
      unique: true,
      allowNull: false,
      comment: '字典名称',
    },
    code: {
      type: DataTypes.STRING(120),
      allowNull: false,
      comment: '字典类型',
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

export default DictionaryType;
