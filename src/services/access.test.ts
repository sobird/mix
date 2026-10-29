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
});
