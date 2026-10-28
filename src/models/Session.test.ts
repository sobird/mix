// @vitest-environment node

import { ForeignKeyConstraintError, UniqueConstraintError, ValidationError } from 'sequelize';

import { Session, User } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createSession, createUser } from '../../tests/helpers/factories';

useInMemoryDatabase();

describe('Session model', () => {
  it('requires expires, sessionToken and userId', async () => {
    await expect(Session.create({ expires: null, sessionToken: null, userId: null } as never)).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('requires a unique session token', async () => {
    const user = await createUser();
    await createSession({ userId: user.id, sessionToken: 'same-token' });

    await expect(createSession({ userId: user.id, sessionToken: 'same-token' })).rejects.toBeInstanceOf(
      UniqueConstraintError,
    );
  });

  it('belongs to a user', async () => {
    const user = await createUser();
    const session = await createSession({ userId: user.id });

    expect((await session.getUser())?.id).toBe(user.id);

    const fresh = await Session.findByPk(session.id, { include: [User] });
    expect(fresh?.User.username).toBe(user.username);
  });

  it('enforces the userId foreign key', async () => {
    await expect(createSession({ userId: 9999 })).rejects.toBeInstanceOf(ForeignKeyConstraintError);
  });

  it('cascades when the user is force deleted', async () => {
    const user = await createUser();
    await createSession({ userId: user.id });

    await user.destroy({ force: true });

    expect(await Session.count()).toBe(0);
  });

  it('supports soft delete', async () => {
    const user = await createUser();
    const session = await createSession({ userId: user.id });

    await session.destroy();

    expect(await Session.findByPk(session.id)).toBeNull();
    expect(await Session.findByPk(session.id, { paranoid: false })).not.toBeNull();
  });
});
