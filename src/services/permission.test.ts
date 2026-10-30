// @vitest-environment node

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { buildAbility } from './ability/build';
import PermissionService from './permission';
import { syncPermissionCatalog } from './permission-catalog';

useInMemoryDatabase();

describe('Permission Service', () => {
  it('returns permissions for a reader', async () => {
    await syncPermissionCatalog();
    const rows = await PermissionService.list(buildAbility([{ action: 'read', subject: 'Permission', narrowing: {} }]));
    expect(rows.map((row) => row.subject)).toContain('User');
  });

  it('returns nothing without read rules', async () => {
    expect(await PermissionService.list(buildAbility([]))).toEqual([]);
  });
});

describe('PermissionService.list', () => {
  it('prunes fields to the read grant', async () => {
    await syncPermissionCatalog();
    const ability = buildAbility([{ action: 'read', subject: 'Permission', narrowing: { fields: ['name'] } }]);

    const [item] = await PermissionService.list(ability);

    expect(item).toHaveProperty('name');
    expect(item.action).toBeUndefined();
    expect(item.subject).toBeUndefined();
  });
});
