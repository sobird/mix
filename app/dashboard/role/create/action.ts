'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { RoleModel } from '@/models';

const FormSchema = z.object({
  name: z.string({
    invalid_type_error: '名称长度为3-12个字符',
  }).min(3, '最少3个字符').max(12),
  description: z.string().optional(),
});

type MyDataType = z.infer<typeof FormSchema>;

export type State = {
  errors?: {
    name?: string[];
    description?: string[];
  };
  message?: string | null;
};

export async function createRole(prevState: State, formData: FormData) {
  const validatedFields = FormSchema.safeParse({
    name: formData.name,
    description: formData.description,
  });

  console.log('validatedFields', validatedFields);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Role.',
    };
  }

  await RoleModel.create(validatedFields.data);

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
