import type { Model, ModelStatic } from 'sequelize';

import { toAccessQuery } from '@/lib/casl';

import type { AppAbility } from './build';
import type { AppActions, AppSubject } from './types';

/** 按三态访问查询读取模型记录：无权 → 空数组，全量 → 全部记录，条件 → 过滤后的记录 */
export async function queryAccessible<M extends Model>(
  model: ModelStatic<M>,
  ability: AppAbility,
  action: AppActions,
): Promise<M[]> {
  const query = toAccessQuery(ability, action, model.name as AppSubject);

  switch (query.kind) {
    case 'none':
      return [];
    case 'all':
      return model.findAll();
    case 'filter':
      return model.findAll({ where: query.where });
  }
}
