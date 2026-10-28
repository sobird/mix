/**
 * Role CRUD Actions
 *
 * sobird<i@sobird.me> at 2023/12/11 16:57:56 created.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  RoleModel, PermissionModel, PermissionCreationAttributes, sequelize,
} from '@/models';
import RolePermission from '@/models/role-permission';
import { defineAbilityFor } from '@/services/ability';
import { getServerAuthToken } from '@/services/auth';
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
      status: ActionStatus.SUCCESS,
      errors: validated.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Role.',
    };
  }

  const [, created] = await RoleModel.findOrCreate({
    defaults: validated.data,
    where: {
      name: validated.data.name,
    },
  });

  if (!created) {
    return {
      status: ActionStatus.FAILURE,
      message: '角色名已存在',
    };
  }

  revalidatePath('/dashboard/role');
}

// 创建角色成功跳转列表页
export async function createRoleActionWithRedirect(payload: RoleFormAttributes) {
  createRoleAction(payload);
  redirect('/dashboard/role');
}

export async function updateRoleAction(
  payload: RoleFormAttributes,
): Promise<RoleFormServerActionState> {
  const token = await getServerAuthToken();
  const ability = defineAbilityFor(token);

  if (ability.cannot('update', 'Role')) {
    return {
      status: ActionStatus.FAILURE,
      message: '您没有更新角色的权限',
    };
  }

  const validated = RoleFormZod.safeParse(payload);

  if (!validated.success) {
    return {
      status: ActionStatus.FAILURE,
      errors: validated.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Role.',
    };
  }

  try {
    await RoleModel.update(validated.data, {
      where: {
        id: payload.id,
      },
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return {
        status: ActionStatus.FAILURE,
        message: '角色名已存在',
      };
    }
  }

  revalidatePath('/dashboard/role');
  redirect('/dashboard/role');
}

export async function deleteRoleAction(id: string) {
  const role = await RoleModel.destroy({
    where: {
      id,
    },
  });
  revalidatePath('/dashboard/role');
  return role;
}

export const saveRolePermissions = async (roleId, permissions) => {
  // 开启事务（确保原子性）
  const transaction = await sequelize.transaction();

  try {
    // 1. 查找目标角色
    const role = await RoleModel.findByPk(roleId, { transaction });
    if (!role) throw new Error('角色不存在');

    // 2. 删除该角色所有旧权限（避免残留）
    await role.setPermissions([], { transaction });

    for await (const { subject, actions } of permissions) {
      for await (const { action, fields } of actions) {
        const [permission] = await PermissionModel.findOrCreate({
          where: { action, subject },
          transaction,
        });

        await role.addPermission(permission, {
          through: {
            rules: fields,
          },
        });
      }
    }

    // 提交事务
    await transaction.commit();
  } catch (error) {
    console.log('error', error.message);
    // 回滚事务
    await transaction.rollback();
  }
};
