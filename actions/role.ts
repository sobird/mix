/**
 * Role CRUD
 *
 * sobird<i@sobird.me> at 2023/12/11 16:57:56 created.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { RoleZod, RoleFormAttributes } from '@/zod/role';

export async function create(prevState: ActionState<RoleFormAttributes>, formData: RoleFormAttributes) {
  const validatedFields = RoleZod.safeParse(formData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Role.',
    };
  }

  try {
    await prisma.role.create({
      data: validatedFields.data,
    });
  } catch (error) {
    console.log('error', error);
  }

  revalidatePath('/dashboard/role');
  // redirect('/dashboard/role');
}

export async function update(prevState: ActionState<RoleFormAttributes>, formData: RoleFormAttributes) {
  const validatedFields = RoleZod.safeParse(formData);

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
        id: formData.id,
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
    await prisma.role.delete({
      where: {
        id,
      },
    });
  } catch (error) {
    console.log('error', error);
  }

  revalidatePath('/dashboard/role');
}
