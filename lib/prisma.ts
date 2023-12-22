/**
 * prisma.ts
 *
 * @deprecated 使用 Sequelize
 *
 * sobird<i@sobird.me> at 2023/12/10 21:59:09 created.
 */

import { PrismaClient, Prisma } from '@prisma/client';

/**
 * @deprecated
 */
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
      async findOrCreate<T, A = Prisma.Args<T, 'create'>>(
        this: T,
        args: A & { where: Prisma.Args<T, 'findFirst'>['where'], },
      ): Promise<[Prisma.Result<T, A, 'findFirst'>, boolean]> {
        const { where, ...rest } = args;
        const context = Prisma.getExtensionContext(this) as any;
        if (!args || !where || arguments.length > 1) {
          throw new Error(
            'Missing where attribute in the options parameter passed to findOrCreate. ',
          );
        }
        const found = await context.findFirst({ where });
        if (found) {
          return [found, true];
        }

        const created = await context.create(rest);
        return [created, false];
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
