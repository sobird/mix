/**
 * prisma.ts
 *
 * sobird<i@sobird.me> at 2023/12/10 21:59:09 created.
 */

import { PrismaClient, Prisma } from '@prisma/client';

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? 1 : 0;

type Test<T> = Omit<Prisma.Args<T, 'findMany'>, 'skip' | 'take'> & { pn: number, ps: number };

const prisma = new PrismaClient().$extends({
  model: {
    $allModels: {
      async exists<T>(
        this: T,
        where: Prisma.Args<T, 'findFirst'>['where'],
      ): Promise<boolean> {
        const context = Prisma.getExtensionContext(this);
        const result = await (context as any).findFirst({ where });
        return result !== null;
      },
      async findManyByPage<T, A = Omit<Prisma.Args<T, 'findMany'>, 'skip' | 'take'> & { pn: number, ps: number }>(
        this: T,
        args: A,
      ): Promise<[count: number, rows: Prisma.Result<T, A, 'findMany'>]> {
        const context = Prisma.getExtensionContext(this) as any;
        const { pn, ps, ...rest } = args;

        const options = {
          skip: (pn - 1) * ps,
          take: ps,
          ...rest,
        };

        const count = await context.count();
        const rows = await context.findMany(options);

        return [count, rows];
      },
    },
  },
});

export default prisma;
