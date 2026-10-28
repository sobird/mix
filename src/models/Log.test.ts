// @vitest-environment node

import { ValidationError } from 'sequelize';

import { Log } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createLog } from '../../tests/helpers/factories';

useInMemoryDatabase();

describe('Log model', () => {
  it('requires content', async () => {
    await expect(Log.create({ content: null } as never)).rejects.toBeInstanceOf(ValidationError);
  });

  it('leaves optional columns undefined when omitted', async () => {
    const log = await createLog();

    expect(log.type).toBeUndefined();
    expect(log.operator).toBeUndefined();
    expect(log.agent).toBeUndefined();
  });

  it('stores type, operator and agent', async () => {
    const log = await createLog({ type: 'login', operator: 7, agent: 'Mozilla/5.0' });

    await log.reload();
    expect(log.type).toBe('login');
    expect(log.operator).toBe(7);
    expect(log.agent).toBe('Mozilla/5.0');
  });

  it('supports soft delete', async () => {
    const log = await createLog();

    await log.destroy();

    expect(await Log.findByPk(log.id)).toBeNull();
    expect(await Log.findByPk(log.id, { paranoid: false })).not.toBeNull();
  });
});
