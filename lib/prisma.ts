/**
 * prisma.ts
 *
 * sobird<i@sobird.me> at 2023/12/10 21:59:09 created.
 */

import { PrismaClient, Prisma } from '@prisma/client';

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
      async findManyByPage<T, A = Prisma.Args<T, 'findMany'>>(
        this: T,
        page: PaginationSearchParams,
        args?: A,
      ): Promise<{ count: number, rows: Prisma.Result<T, A, 'findMany'> } & PaginationSearchParams> {
        const context = Prisma.getExtensionContext(this) as any;
        const pn = Number(page.pn) || 1;
        const ps = Number(page.ps) || 20;

        const options = {
          skip: (pn - 1) * ps,
          take: ps,
          ...args,
        };

        const count = await context.count();
        const rows = await context.findMany(options);

        return {
          count, rows, pn, ps,
        };
      },
    },
  },
});

export default prisma;
