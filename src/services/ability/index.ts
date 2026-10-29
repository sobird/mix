import { cache } from 'react';

import { getSessionUserId } from '@/services/auth';

import { buildAbility, type AppAbility } from './build';
import { loadUserGrants } from './sources';

export { buildAbility } from './build';
export type { AppAbility } from './build';
export { isAllowed } from './check';
export { loadUserGrants } from './sources';
export type { AbilityGrant, AppActions, AppSubject, RuleNarrowing } from './types';

/** 请求级缓存的能力构建，同一请求内相同用户只加载一次授予 */
export const getAbility = cache(async (userId: number) => buildAbility(await loadUserGrants(userId)));

/** 当前会话用户的能力；无会话时返回空能力 */
export async function getCurrentAbility(): Promise<AppAbility> {
  const userId = await getSessionUserId();
  return userId ? getAbility(userId) : buildAbility([]);
}
