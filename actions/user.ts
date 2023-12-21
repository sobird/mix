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
