/**
 * Role CRUD Actions
 *
 * sobird<i@sobird.me> at 2023/12/11 16:57:56 created.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { RoleZod, RoleFormAttributes } from '@/zod/role';
import { RoleModel } from '@/models';

export async function create(prevState: ServerActionState<RoleFormAttributes>, payload: RoleFormAttributes) {
  const validatedFields = RoleZod.safeParse(payload);
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Role.',
    };
  }

  try {
    const user2 = await RoleModel.create(validatedFields.data);
    console.log('user2', user2);
  } catch (error) {
    console.log('error', error);
  }

  redirect('/dashboard/role');

  return;
  // Mutate data
  try {
    const [role, found] = await prisma.role.findOrCreate({
      data: validatedFields.data,
      where: {
        name: validatedFields.data.name,
      },
    });

    if (found) {
      return {
        success: false,
        message: '角色名称已存在',
        data: role,
      };
    }

    revalidatePath('/dashboard/role');
    return {
      success: true,
      data: role,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

export async function update(prevState: ServerActionState<RoleFormAttributes>, payload: RoleFormAttributes) {
  const validatedFields = RoleZod.safeParse(payload);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Role.',
    };
  }

  try {
    await prisma.role.update({
      data: validatedFields.data,
      where: {
        id: payload.id,
      },
    });
  } catch (error) {
    console.log('error', error);
  }

  revalidatePath('/dashboard/role');
  redirect('/dashboard/role');
}

export async function destroy(id: string) {
  try {
    const role = await prisma.role.delete({
      where: {
        id,
      },
    });
    revalidatePath('/dashboard/role');
    return role;
  } catch (error) {
    console.log('error', error);
  }
}
