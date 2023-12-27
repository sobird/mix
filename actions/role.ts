/**
 * Role CRUD Actions
 *
 * sobird<i@sobird.me> at 2023/12/11 16:57:56 created.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getToken } from 'next-auth/jwt';
import { cookies } from 'next/headers';
import { RoleFormZod, RoleFormAttributes } from '@/zod/role';
import { RoleModel } from '@/models';

type RoleFormServerActionState = ServerActionState<RoleFormAttributes>;

export async function createRoleAction(
  prevState: RoleFormServerActionState,
  payload: RoleFormAttributes,
): Promise<RoleFormServerActionState> {
  const token = await getToken({
    req: {
      cookies: cookies(),
    },
  });

  console.log('token_createRoleAction', token);

  const validated = RoleFormZod.safeParse(payload);
  if (!validated.success) {
    return {
      success: false,
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
      success: false,
      message: '角色名已存在',
    };
  }

  revalidatePath('/dashboard/role');
  redirect('/dashboard/role');
}

export async function updateRoleAction(
  prevState: RoleFormServerActionState,
  payload: RoleFormAttributes,
): Promise<RoleFormServerActionState> {
  const validated = RoleFormZod.safeParse(payload);

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Role.',
    };
  }

  RoleModel.update(validated.data, {
    where: {
      id: payload.id,
    },
  });

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
