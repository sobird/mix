// @vitest-environment node

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createMenu, createUser } from '../../tests/helpers/factories';
import { getMenuForUser } from './menu';
import { setFavoriteMenus } from './menu-preferences';

useInMemoryDatabase();

describe('setFavoriteMenus', () => {
  it('isolates favorites per user', async () => {
    const a = await createUser();
    const b = await createUser();
    const menu = await createMenu();
    await setFavoriteMenus(a.id, [menu.id]);
    expect((await getMenuForUser(a.id)).favorites.map((item) => item.id)).toEqual([menu.id]);
    expect((await getMenuForUser(b.id)).favorites).toEqual([]);
  });

  it('rejects more than ten favorites', async () => {
    await expect(
      setFavoriteMenus(
        1,
        Array.from({ length: 11 }, (_, i) => i + 1),
      ),
    ).rejects.toThrow(/收藏菜单不能超过/);
  });
});
