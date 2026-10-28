// @vitest-environment node

import { UniqueConstraintError, ValidationError } from 'sequelize';

import { Group } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createGroup } from '../../tests/helpers/factories';

useInMemoryDatabase();

describe('Group model', () => {
  it('requires a name', async () => {
    await expect(Group.create({ name: null } as never)).rejects.toBeInstanceOf(ValidationError);
  });

  it('requires a unique name', async () => {
    await createGroup({ name: '研发部' });

    await expect(createGroup({ name: '研发部' })).rejects.toBeInstanceOf(UniqueConstraintError);
  });

  it('supports a self-referencing parent/children tree', async () => {
    const parent = await createGroup({ name: '总部' });
    const child = await createGroup({ name: '研发部', parentId: parent.id });

    expect((await child.getParent())?.id).toBe(parent.id);

    const tree = await Group.findByPk(parent.id, { include: [{ association: 'children' }] });
    expect(tree?.children.map((item) => item.id)).toEqual([child.id]);
  });

  it('sets children parentId to null when the parent is force deleted', async () => {
    const parent = await createGroup();
    const child = await createGroup({ parentId: parent.id });

    await parent.destroy({ force: true });

    await child.reload();
    expect(child.parentId).toBeNull();
  });

  it('supports soft delete', async () => {
    const group = await createGroup();

    await group.destroy();

    expect(await Group.findByPk(group.id)).toBeNull();
    expect(await Group.findByPk(group.id, { paranoid: false })).not.toBeNull();
  });
});
