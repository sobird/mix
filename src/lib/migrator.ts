import type { Sequelize } from 'sequelize';
import { SequelizeStorage, Umzug, type MigrationParams } from 'umzug';

import { MIGRATIONS } from '@/migrations';

export type Migration = {
  name: string;
  up: (params: MigrationParams<Sequelize>) => Promise<void>;
  down: (params: MigrationParams<Sequelize>) => Promise<void>;
};

/**
 * 构造共享的 Umzug 实例：迁移列表、存储表与日志配置都集中在这里，
 * 保证 `runMigrations` 与 `pendingMigrations` 使用完全一致的配置。
 */
function createMigrator(sequelize: Sequelize): Umzug<Sequelize> {
  return new Umzug({
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
}

/**
 * 返回尚未执行的迁移名，按执行顺序排列。
 *
 * 已执行的迁移记录在 `sequelize_meta` 表中；未建表时全部视为待执行。
 */
export async function pendingMigrations(sequelize: Sequelize): Promise<string[]> {
  const pending = await createMigrator(sequelize).pending();

  return pending.map((migration) => migration.name);
}

/**
 * 执行全部待执行迁移，返回本次实际执行的迁移名。
 *
 * 已执行的迁移记录在 `sequelize_meta` 表中，重复调用不会重复执行。
 */
export async function runMigrations(sequelize: Sequelize): Promise<string[]> {
  const executed = await createMigrator(sequelize).up();

  return executed.map((migration) => migration.name);
}
