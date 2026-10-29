import type { Attributes, Model, ModelStatic } from 'sequelize';

import { toAccessQuery } from '@/lib/casl';

import type { AppAbility, AppActions, AppSubject } from './ability';

/** 分页查询参数，兼容从 URL 搜索参数传入的字符串 */
export interface PageQuery {
  pn?: string | number;
  ps?: string | number;
}

export interface PageResult<M extends Model> {
  pn: number;
  ps: number;
  count: number;
  rows: Attributes<M>[];
}

/** 将分页参数收敛为正整数；非法值回退到默认值 */
function toPositiveInteger(value: string | number | undefined, fallback: number): number {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * 按能力过滤后的分页查询。
 *
 * 与 `queryAccessible` 一致使用三态访问查询：无权限时直接返回空页，
 * 全量时不过滤，条件时以 `where` 限制范围。
 */
export async function paginateAccessible<M extends Model>(
  model: ModelStatic<M>,
  ability: AppAbility,
  action: AppActions,
  query: PageQuery,
  options: { exclude?: string[] } = {},
): Promise<PageResult<M>> {
  const ps = toPositiveInteger(query.ps, 20);
  const pn = toPositiveInteger(query.pn, 1);

  const access = toAccessQuery(ability, action, model.name as AppSubject);

  if (access.kind === 'none') {
    return { pn, ps, count: 0, rows: [] };
  }

  const { count, rows } = await model.findAndCountAll({
    ...(access.kind === 'filter' ? { where: access.where } : {}),
    offset: (pn - 1) * ps,
    limit: ps,
    order: [['createdAt', 'DESC']],
    ...(options.exclude?.length ? { attributes: { exclude: options.exclude } } : {}),
  });

  return {
    pn,
    ps,
    count,
    rows: rows.map((row) => row.toJSON()) as Attributes<M>[],
  };
}
