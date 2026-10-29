import { AbilityBuilder, createMongoAbility, type ForcedSubject, type MongoAbility } from '@casl/ability';

import type { AbilityGrant, AppActions, AppSubject } from './types';

/** 应用能力类型，`all` 与模型名作为主题，支持强制标记类型的实例 */
export type AppAbility = MongoAbility<[AppActions, AppSubject | ForcedSubject<Exclude<AppSubject, 'all'>>]>;

const ALL_SUBJECT = 'all';

/** 允许/拒绝规则的统一写入签名，条件来自数据库，运行时才可知 */
type RuleAdder = (
  action: AppActions,
  subject: AppSubject,
  fields?: string[],
  conditions?: Record<string, unknown>,
) => unknown;

/**
 * 从数据库授予条目构建 CASL 能力。
 *
 * 先加入允许规则，再加入反转（拒绝）规则：CASL 中后加入的规则优先，
 * 因此拒绝规则必须写在最后才能覆盖此前的允许规则。
 */
export function buildAbility(grants: AbilityGrant[]): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  let warnedAllFields = false;

  const add = (grant: AbilityGrant, inverted: boolean) => {
    const { fields, conditions } = grant.narrowing;

    let effectiveFields = fields;
    if (grant.subject === ALL_SUBJECT && fields !== undefined && fields.length > 0) {
      effectiveFields = undefined;
      if (!warnedAllFields) {
        warnedAllFields = true;
        console.warn(`[ability] 主题 "${ALL_SUBJECT}" 不支持字段限制，已忽略 fields: ${fields.join(', ')}`);
      }
    }

    const action = grant.action as AppActions;
    const subject = grant.subject as AppSubject;
    const fieldArg = effectiveFields !== undefined && effectiveFields.length > 0 ? effectiveFields : undefined;
    const addRule: RuleAdder = inverted ? cannot : can;

    addRule(action, subject, fieldArg, conditions);
  };

  for (const grant of grants) {
    if (grant.narrowing.inverted !== true) {
      add(grant, false);
    }
  }

  for (const grant of grants) {
    if (grant.narrowing.inverted === true) {
      add(grant, true);
    }
  }

  return build();
}
