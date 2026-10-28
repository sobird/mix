// @vitest-environment node

import { models, Role, RolePermission, User, UserRole } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createUser } from '../../tests/helpers/factories';

useInMemoryDatabase();

describe('models registry', () => {
  it('registers every model', () => {
    expect(Object.keys(models).sort()).toEqual(
      [
        'Account',
        'DictionaryItem',
        'DictionaryType',
        'Group',
        'Log',
        'Menu',
        'Organization',
        'Permission',
        'Role',
        'RolePermission',
        'Session',
        'User',
        'UserRole',
        'VerificationToken',
      ].sort(),
    );
  });

  it('shares a single sequelize instance', () => {
    for (const model of Object.values(models)) {
      expect(model.sequelize).toBe(models.User.sequelize);
    }
  });

  it('wires up the many-to-many associations with their through models', () => {
    const throughModel = (association: object) => (association as { through: { model: unknown } }).through.model;

    expect(throughModel(User.associations.Roles)).toBe(UserRole);
    expect(throughModel(Role.associations.Users)).toBe(UserRole);
    expect(throughModel(Role.associations.Permissions)).toBe(RolePermission);
  });

  it('wires up the hasMany associations', () => {
    expect(User.associations.Accounts.target).toBe(models.Account);
    expect(User.associations.Sessions.target).toBe(models.Session);
    expect(User.associations.Menus.target).toBe(models.Menu);
    expect(models.DictionaryType.associations.Items.target).toBe(models.DictionaryItem);
  });
});

describe('BaseModel.findManyByPage', () => {
  function seedUsers() {
    const base = new Date('2024-01-01T00:00:00.000Z').getTime();

    return Promise.all(
      [0, 1, 2].map((index) =>
        createUser({
          username: `page_${index + 1}`,
          email: `page_${index + 1}@example.com`,
          createdAt: new Date(base + index * 1000),
        }),
      ),
    );
  }

  it('defaults to the first page of 20 rows', async () => {
    await seedUsers();

    const result = await User.findManyByPage({} as never);

    expect(result).toMatchObject({ ps: 20, pn: 1, count: 3 });
    expect(result.rows).toHaveLength(3);
  });

  it('falls back to defaults for invalid pagination params', async () => {
    await seedUsers();

    const result = await User.findManyByPage({ ps: 0, pn: 'abc' } as never);

    expect(result).toMatchObject({ ps: 20, pn: 1 });
  });

  it('returns rows ordered by createdAt descending across pages', async () => {
    const [first, second, third] = await seedUsers();

    const page1 = await User.findManyByPage({ ps: 2, pn: 1 } as never);
    const page2 = await User.findManyByPage({ ps: 2, pn: 2 } as never);

    expect(page1.count).toBe(3);
    expect(page1.rows.map((row) => row.id)).toEqual([third.id, second.id]);
    expect(page2.rows.map((row) => row.id)).toEqual([first.id]);
  });

  it('returns an empty page when there is no data', async () => {
    const result = await User.findManyByPage({ ps: 10, pn: 2 } as never);

    expect(result).toEqual({ ps: 10, pn: 2, count: 0, rows: [] });
  });
});
