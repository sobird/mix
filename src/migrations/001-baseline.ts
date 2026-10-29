import '@/models';
import type { Migration } from '@/lib/migrator';

/**
 * 基线迁移：当前模型即最终库结构。
 *
 * 目标库为空，本地旧库可删除后重建，因此直接调用 `context.sync()`，
 * 由 Sequelize 依据模型生成归一化表结构，无需手写 CREATE TABLE。
 */
export const baseline: Migration = {
  name: '001-baseline',
  async up({ context }) {
    await context.sync();
  },
  async down({ context }) {
    await context.drop();
  },
};
