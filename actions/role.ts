'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const FormSchema = z.object({
  name: z.string({
    invalid_type_error: '角色名称长度为3-12个字符',
  }).min(3, '角色名称长度不能少于3个字符').max(12, '角色名称长度不能大于24个字符'),
  description: z.string().optional(),
});

type RoleFormType = z.infer<typeof FormSchema>;

export type State = {
  errors?: {
    name?: string[];
    description?: string[];
  };
  message?: string | null;
};

export async function create(prevState: State, formData: RoleFormType) {
  const validatedFields = FormSchema.safeParse(formData);

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
  redirect('/dashboard/role');
}
