// @vitest-environment node

import { ValidationError } from 'sequelize';

import { Menu } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createMenu, createPermission } from '../../tests/helpers/factories';

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

  it('links to a permission instead of a user', async () => {
    const permission = await createPermission({ action: 'read', subject: 'User' });
    const menu = await createMenu({ permissionId: permission.id });
    expect((await menu.getPermission())?.id).toBe(permission.id);
  });

  it('allows a permission-less menu for always-visible entries', async () => {
    const menu = await createMenu({ permissionId: null });
    expect(menu.permissionId).toBeNull();
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

  it('supports soft delete', async () => {
    const menu = await createMenu();

    await menu.destroy();

    expect(await Menu.findByPk(menu.id)).toBeNull();
    expect(await Menu.findByPk(menu.id, { paranoid: false })).not.toBeNull();
  });
});
