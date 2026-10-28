// @vitest-environment node

import { ValidationError } from 'sequelize';

import { Menu, User } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createMenu, createUser } from '../../tests/helpers/factories';

useInMemoryDatabase();

describe('Menu model', () => {
  it('requires name and href', async () => {
    await expect(Menu.create({ name: null, href: null } as never)).rejects.toBeInstanceOf(ValidationError);
  });

  it('leaves optional columns undefined when omitted', async () => {
    const menu = await createMenu();

    expect(menu.icon).toBeUndefined();
    expect(menu.description).toBeUndefined();
    expect(menu.parentId).toBeUndefined();
    expect(menu.sort).toBeUndefined();
  });

  it('belongs to a user', async () => {
    const user = await createUser();
    const menu = await createMenu({ userId: user.id });

    expect((await menu.getUser())?.id).toBe(user.id);

    const fresh = await Menu.findByPk(menu.id, { include: [User] });
    expect(fresh?.User.username).toBe(user.username);
  });

  it('supports a self-referencing parent/children tree', async () => {
    const parent = await createMenu({ name: '控制台' });
    const child = await createMenu({ name: '用户管理', parentId: parent.id });

    expect((await child.getParent())?.id).toBe(parent.id);

    const tree = await Menu.findByPk(parent.id, { include: [{ association: 'children' }] });
    expect(tree?.children.map((item) => item.id)).toEqual([child.id]);
  });

  it('sets children parentId to null when the parent is force deleted', async () => {
    const parent = await createMenu();
    const child = await createMenu({ parentId: parent.id });

    await parent.destroy({ force: true });

    await child.reload();
    expect(child.parentId).toBeNull();
  });

  it('cascades when the user is force deleted', async () => {
    const user = await createUser();
    await createMenu({ userId: user.id });

    await user.destroy({ force: true });

    expect(await Menu.count()).toBe(0);
  });

  it('supports soft delete', async () => {
    const menu = await createMenu();

    await menu.destroy();

    expect(await Menu.findByPk(menu.id)).toBeNull();
    expect(await Menu.findByPk(menu.id, { paranoid: false })).not.toBeNull();
  });
});
