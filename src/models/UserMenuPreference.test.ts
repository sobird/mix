// @vitest-environment node

import { UniqueConstraintError } from 'sequelize';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createMenu, createUser, createUserMenuPreference } from '../../tests/helpers/factories';

useInMemoryDatabase();

describe('UserMenuPreference model', () => {
  it('stores one preference row per user and menu', async () => {
    const user = await createUser();
    const menu = await createMenu();
    await createUserMenuPreference({ userId: user.id, menuId: menu.id, favorite: true, hidden: true, sort: 2 });
    await expect(
      createUserMenuPreference({ userId: user.id, menuId: menu.id, favorite: false, hidden: false, sort: 1 }),
    ).rejects.toBeInstanceOf(UniqueConstraintError);
  });
});
