import { subject as caslSubject } from '@casl/ability';

import type { AppAbility } from './build';
import type { AppActions, AppSubject } from './types';

/** 行数据的系统字段，读取裁剪时无条件保留 */
const SYSTEM_FIELDS = new Set(['id', 'createdAt', 'updatedAt']);

/** 判断某个字段是否在字段级授权范围内 */
export function canAccessField(
  ability: AppAbility,
  action: AppActions,
  subjectName: Exclude<AppSubject, 'all'>,
  instance: Record<PropertyKey, unknown>,
  field: string,
): boolean {
  return ability.can(action, caslSubject(subjectName, instance), field);
}

/** 按字段级读权限裁剪行数据，系统字段始终保留，不修改入参 */
export function pruneReadableFields<T extends Record<string, unknown>>(
  ability: AppAbility,
  action: AppActions,
  subjectName: Exclude<AppSubject, 'all'>,
  row: T,
): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(row)) {
    if (
      SYSTEM_FIELDS.has(key) ||
      canAccessField(ability, action, subjectName, row as Record<PropertyKey, unknown>, key)
    ) {
      result[key as keyof T] = value as T[keyof T];
    }
  }

  return result;
}

/** 按字段级写权限筛选待写入数据，不保留系统字段，不修改入参 */
export function pickWritableFields<T extends Record<string, unknown>>(
  ability: AppAbility,
  action: AppActions,
  subjectName: Exclude<AppSubject, 'all'>,
  instance: Record<PropertyKey, unknown>,
  data: T,
): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(data)) {
    if (canAccessField(ability, action, subjectName, instance, key)) {
      result[key as keyof T] = value as T[keyof T];
    }
  }

  return result;
}
