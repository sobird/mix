'use server';

import prisma from '@/lib/prisma';
import { SignUpFormZod, SignUpAttributes } from '@/zod/user';

export async function signup(attributes: SignUpAttributes) {
  const [user, created] = await prisma.user.findOrCreate({
    defaults: attributes,
    where: {
      username: attributes.username,
    },
  });
  return [user, created];
}
