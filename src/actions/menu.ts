/**
 * 菜单偏好 Actions
 */

'use server';

import { revalidatePath } from 'next/cache';

import { getSessionUserId } from '@/services/auth';
import { setFavoriteMenus } from '@/services/menu-preferences';

import { ActionStatus } from '.';

/** 保存当前会话用户的收藏菜单 */
export async function updateMenuPreferencesAction(
  menuIds: number[],
): Promise<{ status: ActionStatus; message?: string }> {
  const userId = await getSessionUserId();

  if (!userId) {
    return { status: ActionStatus.FAILURE };
  }

  await setFavoriteMenus(userId, menuIds);
  revalidatePath('/dashboard', 'layout');

  return { status: ActionStatus.SUCCESS };
}
