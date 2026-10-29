// https://casl.js.org/v6/en/advanced/ability-to-database-query
import { Op, type WhereOptions } from 'sequelize';

import type { AppAbility } from '@/services/ability/build';
import type { AppActions, AppSubject } from '@/services/ability/types';

/** 三态访问查询：无权限、全量、或按条件过滤 */
export type AccessQuery = { kind: 'none' } | { kind: 'all' } | { kind: 'filter'; where: WhereOptions };

type Conditions = Record<string, unknown>;

type RuleLike = { inverted?: boolean; conditions?: Conditions };

const OPERATOR_NAMES = new Set(Object.keys(Op));

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * 递归地把以 `$` 开头的 Sequelize 操作符键替换为 symbol。
 *
 * 与基于 JSON 的旧实现不同，这里不会丢字段类型：`Date` 及其他非普通对象原样返回。
 */
export function symbolize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => symbolize(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const result: Record<string | symbol, unknown> = {};

  for (const [key, child] of Object.entries(value)) {
    const operatorName = key.startsWith('$') ? key.slice(1) : undefined;
    const operator =
      operatorName !== undefined && OPERATOR_NAMES.has(operatorName) ? Op[operatorName as keyof typeof Op] : undefined;

    result[operator ?? key] = symbolize(child);
  }

  return result;
}

function hasConditions(rule: RuleLike): rule is RuleLike & { conditions: Conditions } {
  return rule.conditions !== undefined && rule.conditions !== null;
}

/**
 * 把 CASL 能力换算成三态访问查询。
 *
 * - 没有允许规则，或存在无条件拒绝规则 → `none`
 * - 存在无条件允许且没有拒绝规则 → `all`
 * - 否则把有条件允许用 `$or` 合并、每条拒绝规则用 `$not` 表达，再按需包进 `$and`
 */
export function toAccessQuery(ability: AppAbility, action: AppActions, subject: AppSubject): AccessQuery {
  const rules = ability.rulesFor(action, subject);

  const allowRules = rules.filter((rule) => !rule.inverted);
  if (allowRules.length === 0) {
    return { kind: 'none' };
  }

  const denyRules = rules.filter((rule) => rule.inverted);
  if (denyRules.some((rule) => !hasConditions(rule))) {
    return { kind: 'none' };
  }

  const hasUnconditionalAllow = allowRules.some((rule) => !hasConditions(rule));
  if (hasUnconditionalAllow && denyRules.length === 0) {
    return { kind: 'all' };
  }

  const clauses: unknown[] = [];

  if (!hasUnconditionalAllow) {
    const conditionalAllows = allowRules.filter(hasConditions).map((rule) => rule.conditions);
    clauses.push(conditionalAllows.length === 1 ? conditionalAllows[0] : { $or: conditionalAllows });
  }

  for (const rule of denyRules) {
    if (hasConditions(rule)) {
      clauses.push({ $not: rule.conditions });
    }
  }

  if (clauses.length === 0) {
    return { kind: 'none' };
  }

  const where = clauses.length === 1 ? clauses[0] : { $and: clauses };

  return { kind: 'filter', where: symbolize(where) as WhereOptions };
}
