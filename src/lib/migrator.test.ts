// @vitest-environment node

import { sequelize } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { runMigrations } from './migrator';

useInMemoryDatabase();

describe('runMigrations', () => {
  it('runs the baseline once', async () => {
    const ran = await runMigrations(sequelize);
    expect(ran).toEqual(['001-baseline']);
    expect(await runMigrations(sequelize)).toEqual([]);
  });

  it('creates the normalized tables', async () => {
    await runMigrations(sequelize);
    const [columns] = await sequelize.query("PRAGMA table_info('role_permissions')");
    expect(columns.map((c: any) => c.name)).toEqual(expect.arrayContaining(['narrowing', 'expires_at']));
  });
});
