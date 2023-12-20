'use server';

import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { SignUpZodWithRefine, SignUpAttributes } from '@/zod/user';

/**
 * 用户是否存在
 *
 * @param where
 * @returns
 */
export async function exists(where: Prisma.UserWhereInput) {
  return prisma.user.exists(where);
}

export async function signup(prevState, payload: SignUpAttributes) {
  console.log('data', payload);
  const validatedFields = await SignUpZodWithRefine.safeParseAsync(payload);
  console.log('validatedFields', validatedFields);
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Sign Up.',
    };
  }

  // const [user, created] = await prisma.user.findOrCreate({
  //   defaults: attributes,
  //   where: {
  //     username: attributes.username,
  //   },
  // });
  // return [user, created];
}
