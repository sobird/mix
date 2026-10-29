import type { Sequelize } from 'sequelize';
import { SequelizeStorage, Umzug, type MigrationParams } from 'umzug';

import { MIGRATIONS } from '@/migrations';

export type Migration = {
  name: string;
  up: (params: MigrationParams<Sequelize>) => Promise<void>;
  down: (params: MigrationParams<Sequelize>) => Promise<void>;
};

/**
 * 执行全部待执行迁移，返回本次实际执行的迁移名。
 *
 * 已执行的迁移记录在 `sequelize_meta` 表中，重复调用不会重复执行。
 */
export async function runMigrations(sequelize: Sequelize): Promise<string[]> {
  const umzug = new Umzug({
    migrations: MIGRATIONS,
    context: sequelize,
    storage: new SequelizeStorage({ sequelize, tableName: 'sequelize_meta' }),
    logger: {
      info: () => {},
      warn: console.warn,
      error: console.error,
      debug: () => {},
    },
  });

  const executed = await umzug.up();

  return executed.map((migration) => migration.name);
}
