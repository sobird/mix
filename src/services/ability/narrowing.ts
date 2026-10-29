import type { RuleNarrowing } from './types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** 校验已知字段，未出现的字段保持省略 */
function parseNarrowingObject(raw: Record<string, unknown>): RuleNarrowing | null {
  const narrowing: RuleNarrowing = {};

  if ('fields' in raw) {
    if (!isStringArray(raw.fields)) return null;
    narrowing.fields = raw.fields;
  }

  if ('conditions' in raw) {
    if (!isPlainObject(raw.conditions)) return null;
    narrowing.conditions = raw.conditions;
  }

  if ('inverted' in raw) {
    if (typeof raw.inverted !== 'boolean') return null;
    narrowing.inverted = raw.inverted;
  }

  return narrowing;
}

/**
 * 将历史/数据库中的规则限制归一化为 {@link RuleNarrowing}。
 *
 * 返回 `null` 表示数据损坏，调用方必须跳过该授予。
 */
export function normalizeNarrowing(raw: unknown): RuleNarrowing | null {
  if (raw === undefined || raw === null) {
    return {};
  }

  if (Array.isArray(raw)) {
    if (raw.length === 0) {
      return {};
    }

    if (isStringArray(raw)) {
      return { fields: raw };
    }

    const [first] = raw;
    if (isPlainObject(first) && raw.every(isPlainObject)) {
      return parseNarrowingObject(first);
    }

    return null;
  }

  if (isPlainObject(raw)) {
    return parseNarrowingObject(raw);
  }

  return null;
}
