'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { RoleModel } from '@/models';

export async function createRole(formData: FormData) {
  await RoleModel.create({
    name: formData.name,
    description: formData.description,
  });

  revalidatePath('/dashboard/role');
  redirect('/dashboard/role');
}

export async function updateRole(formData: FormData) {
  await RoleModel.update({
    name: formData.name,
    description: formData.description,
  }, {
    where: {
      id: formData.id,
    },
  });

  revalidatePath('/dashboard/role');
  redirect('/dashboard/role');
}

export async function deleteRole(id: number) {
  await RoleModel.destroy({
    where: {
      id,
    },
  });

  revalidatePath('/dashboard/role');
}
