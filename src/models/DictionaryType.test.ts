// @vitest-environment node

import { UniqueConstraintError, ValidationError } from 'sequelize';

import { DictionaryItem, DictionaryType } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createDictionaryItem, createDictionaryType } from '../../tests/helpers/factories';

useInMemoryDatabase();

describe('DictionaryType model', () => {
  it('requires name and code', async () => {
    await expect(DictionaryType.create({ name: null, code: null } as never)).rejects.toBeInstanceOf(ValidationError);
  });

  it('defaults status to enabled', async () => {
    const type = await createDictionaryType();

    expect(type.status).toBe('1');
  });

  it('requires a unique name', async () => {
    await createDictionaryType({ name: '性别' });

    await expect(createDictionaryType({ name: '性别' })).rejects.toBeInstanceOf(UniqueConstraintError);
  });

  it('has many items through the Items alias', async () => {
    const type = await createDictionaryType({ name: '性别' });
    const male = await createDictionaryItem({ typeId: type.id, label: '男', value: 'male' });
    const female = await createDictionaryItem({ typeId: type.id, label: '女', value: 'female' });

    const fresh = await DictionaryType.findByPk(type.id, { include: [{ association: 'Items' }] });
    expect(fresh?.Items.map((item) => item.id).sort()).toEqual([male.id, female.id].sort());
    expect(await type.countItems()).toBe(2);
  });

  it('supports soft delete without removing its items', async () => {
    const type = await createDictionaryType();
    const item = await createDictionaryItem({ typeId: type.id });

    await type.destroy();

    expect(await DictionaryType.findByPk(type.id)).toBeNull();
    expect(await DictionaryType.findByPk(type.id, { paranoid: false })).not.toBeNull();
    expect(await DictionaryItem.findByPk(item.id)).not.toBeNull();
  });
});
