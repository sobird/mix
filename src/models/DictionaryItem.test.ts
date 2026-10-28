// @vitest-environment node

import { ForeignKeyConstraintError, ValidationError } from 'sequelize';

import { DictionaryItem, DictionaryType } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createDictionaryItem, createDictionaryType } from '../../tests/helpers/factories';

useInMemoryDatabase();

describe('DictionaryItem model', () => {
  it('requires label, value and typeId', async () => {
    await expect(DictionaryItem.create({ label: null, value: null, typeId: null } as never)).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('defaults sort to 0 and status to enabled', async () => {
    const type = await createDictionaryType();
    const item = await createDictionaryItem({ typeId: type.id });

    expect(item.sort).toBe(0);
    expect(item.status).toBe('1');
  });

  it('belongs to a dictionary type', async () => {
    const type = await createDictionaryType({ name: '性别' });
    const item = await createDictionaryItem({ typeId: type.id });

    expect((await item.getDictionaryType())?.id).toBe(type.id);

    const fresh = await DictionaryItem.findByPk(item.id, { include: [DictionaryType] });
    expect(fresh?.DictionaryType.name).toBe('性别');
  });

  it('enforces the typeId foreign key', async () => {
    await expect(createDictionaryItem({ typeId: 9999 })).rejects.toBeInstanceOf(ForeignKeyConstraintError);
  });

  it('supports soft delete', async () => {
    const type = await createDictionaryType();
    const item = await createDictionaryItem({ typeId: type.id });

    await item.destroy();

    expect(await DictionaryItem.findByPk(item.id)).toBeNull();
    expect(await DictionaryItem.findByPk(item.id, { paranoid: false })).not.toBeNull();
  });
});
