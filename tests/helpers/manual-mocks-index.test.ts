// @vitest-environment node

import { Role, User, models, sequelize } from '@/models';

vi.mock('@/models');

describe('models index manual mock', () => {
  it('re-exports the real models and seeds all sample data on load', async () => {
    expect(Object.keys(models)).toHaveLength(14);
    expect((sequelize as unknown as { options: { storage: string } }).options.storage).toBe(':memory:');

    expect(await User.count()).toBe(2);
    expect(await Role.count()).toBe(4);
    expect(await models.Permission.count()).toBe(3);
  });
});
