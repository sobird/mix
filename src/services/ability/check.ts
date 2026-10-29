import { subject } from '@casl/ability';

import type { AppAbility } from './build';
import type { AppActions, AppSubject } from './types';

/**
 * 判断用户是否被允许执行某动作。
 *
 * 提供实例时按实例条件精确匹配；未提供实例时只认无条件的允许规则，
 * 避免 CASL 针对主题类型返回「可能允许」而误放行。
 */
export function isAllowed(
  ability: AppAbility,
  action: AppActions,
  subjectName: AppSubject,
  instance?: object,
): boolean {
  if (instance) {
    return ability.can(
      action,
      subject(subjectName as Exclude<AppSubject, 'all'>, instance as Record<PropertyKey, unknown>),
    );
  }

  if (!ability.can(action, subjectName)) {
    return false;
  }

  return ability.rules.some((rule) => {
    if (rule.inverted || rule.conditions !== undefined) {
      return false;
    }

    const actions = Array.isArray(rule.action) ? rule.action : [rule.action];
    const subjects = Array.isArray(rule.subject) ? rule.subject : [rule.subject];

    return (
      actions.some((ruleAction) => ruleAction === action || ruleAction === 'manage') &&
      subjects.some((ruleSubject) => ruleSubject === subjectName || ruleSubject === 'all')
    );
  });
}
