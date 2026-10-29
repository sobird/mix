/**
 * Role CRUD Actions
 *
 * sobird<i@sobird.me> at 2023/12/11 16:57:56 created.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getCurrentAbility } from '@/services/ability';
import { ForbiddenError, NotFoundError } from '@/services/errors';
import RoleService, { type PermissionInput } from '@/services/role';
import { RoleFormZod, RoleFormAttributes } from '@/zod/role';

import { ActionStatus } from '.';

type RoleFormServerActionState = ServerActionState<RoleFormAttributes>;

/**
 * 角色为admin的用户可以创建
 *
 * @param prevState
 * @param payload
 * @returns
 */
export async function createRoleAction(payload: RoleFormAttributes): Promise<RoleFormServerActionState> {
  const validated = RoleFormZod.safeParse(payload);
  if (!validated.success) {
    return {
      status: ActionStatus.FAILURE,
      errors: validated.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Role.',
    };
  }

  const ability = await getCurrentAbility();

  try {
    const [, created] = await RoleService.create(ability, validated.data);

    if (!created) {
      return {
        status: ActionStatus.FAILURE,
        message: '角色名已存在',
      };
    }
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return {
        status: ActionStatus.FAILURE,
        message: '您没有创建角色的权限',
      };
    }

    throw error;
  }

  revalidatePath('/dashboard/role');

  return {
    status: ActionStatus.SUCCESS,
  };
}

// 创建角色成功跳转列表页
export async function createRoleActionWithRedirect(payload: RoleFormAttributes) {
  await createRoleAction(payload);
  redirect('/dashboard/role');
}

export async function updateRoleAction(payload: RoleFormAttributes): Promise<RoleFormServerActionState> {
  const validated = RoleFormZod.safeParse(payload);

  if (!validated.success) {
    return {
      status: ActionStatus.FAILURE,
      errors: validated.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Role.',
    };
  }

  const ability = await getCurrentAbility();

  try {
    await RoleService.update(ability, payload.id as number, validated.data);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        status: ActionStatus.FAILURE,
        message: '角色不存在',
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        status: ActionStatus.FAILURE,
        message: '您没有更新角色的权限',
      };
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return {
        status: ActionStatus.FAILURE,
        message: '角色名已存在',
      };
    }

    throw error;
  }

  revalidatePath('/dashboard/role');
  redirect('/dashboard/role');
}

export async function deleteRoleAction(id: string) {
  const ability = await getCurrentAbility();

  try {
    await RoleService.remove(ability, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        status: ActionStatus.FAILURE,
        message: '角色不存在',
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        status: ActionStatus.FAILURE,
        message: '您没有删除角色的权限',
      };
    }

    throw error;
  }

  revalidatePath('/dashboard/role');
  return { status: ActionStatus.SUCCESS };
}

export const saveRolePermissions = async (roleId: number, permissions: PermissionInput[]) => {
  const ability = await getCurrentAbility();

  try {
    await RoleService.savePermissions(ability, roleId, permissions);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return {
        status: ActionStatus.FAILURE,
        message: '角色不存在',
      };
    }

    if (error instanceof ForbiddenError) {
      return {
        status: ActionStatus.FAILURE,
        message: '您没有更新角色的权限',
      };
    }

    throw error;
  }

  return {
    status: ActionStatus.SUCCESS,
  };
};
