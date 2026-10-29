// @vitest-environment node

import { MENU_CATALOG } from '@/menus/catalog';
import { Menu } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createMenu } from '../../tests/helpers/factories';
import { syncMenuCatalog } from './menu-catalog';
import { syncPermissionCatalog } from './permission-catalog';

useInMemoryDatabase();

describe('syncMenuCatalog', () => {
  it('creates the catalog once and links permissions', async () => {
    await syncPermissionCatalog();
    expect((await syncMenuCatalog()).menus).toBe(MENU_CATALOG.length);
    expect((await syncMenuCatalog()).menus).toBe(0);
    const menu = await Menu.findOne({ where: { href: '/dashboard/user' } });
    expect((await menu!.getPermission())?.subject).toBe('User');
  });

  it('repairs a drifted row without deleting extra menus', async () => {
    await syncPermissionCatalog();
    await syncMenuCatalog();
    const extra = await createMenu({ href: '/legacy' });
    const menu = await Menu.findOne({ where: { href: '/dashboard/user' } });
    await menu!.update({ name: '旧名字' });
    await syncMenuCatalog();
    expect((await Menu.findByPk(menu!.id))?.name).toBe('用户管理');
    expect(await Menu.findByPk(extra.id)).not.toBeNull();
  });
});
