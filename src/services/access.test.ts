// @vitest-environment node

import { Role } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createRole } from '../../tests/helpers/factories';
import { buildAbility } from './ability';
import { paginateAccessible } from './access';

useInMemoryDatabase();

describe('paginateAccessible', () => {
  it('returns an empty page without read rules', async () => {
    const page = await paginateAccessible(Role, buildAbility([]), 'read', {});
    expect(page).toEqual({ pn: 1, ps: 20, count: 0, rows: [] });
  });

  it('applies conditional read as a where clause', async () => {
    const role = await createRole();
    await createRole();
    const ability = buildAbility([{ action: 'read', subject: 'Role', narrowing: { conditions: { id: role.id } } }]);
    const page = await paginateAccessible(Role, ability, 'read', {});
    expect(page.rows.map((row) => row.id)).toEqual([role.id]);
  });

  it('clamps pn/ps to positive integers and keeps the page order', async () => {
    const older = await createRole({ createdAt: new Date('2020-01-01T00:00:00.000Z') });
    const newer = await createRole({ createdAt: new Date('2021-01-01T00:00:00.000Z') });
    // 仅命中这两条，排除 afterSync 预置的内置角色
    const ability = buildAbility([
      { action: 'read', subject: 'Role', narrowing: { conditions: { id: [older.id, newer.id] } } },
    ]);

    const page = await paginateAccessible(Role, ability, 'read', { pn: '-5', ps: '1.5' });

    expect(page.pn).toBe(1);
    expect(page.ps).toBe(1);
    expect(page.count).toBe(2);
    expect(page.rows.map((row) => row.id)).toEqual([newer.id]);

    const fallback = await paginateAccessible(Role, ability, 'read', { pn: '2.9', ps: '0' });

    expect(fallback.pn).toBe(2);
    expect(fallback.ps).toBe(20);
    expect(fallback.count).toBe(2);
    expect(fallback.rows).toEqual([]);

    expect(older.id).not.toBe(newer.id);
  });
});
