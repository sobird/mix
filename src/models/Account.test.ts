// @vitest-environment node

import { ForeignKeyConstraintError, ValidationError } from 'sequelize';

import { Account, User } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createAccount, createUser } from '../../tests/helpers/factories';

useInMemoryDatabase();

describe('Account model', () => {
  it('requires type and userId', async () => {
    await expect(Account.create({ type: null, userId: null } as never)).rejects.toBeInstanceOf(ValidationError);
  });

  it('stores provider token fields', async () => {
    const user = await createUser();

    const account = await createAccount({
      userId: user.id,
      type: 'oauth',
      provider: 'github',
      providerAccountId: 'github-1',
      access_token: 'access',
      refresh_token: 'refresh',
      expires_at: 1893456000,
      token_type: 'bearer',
      scope: 'read:user',
      id_token: 'id-token',
      session_state: 'state',
    });

    await account.reload();
    expect(account.provider).toBe('github');
    expect(account.providerAccountId).toBe('github-1');
    expect(account.access_token).toBe('access');
    expect(account.refresh_token).toBe('refresh');
    expect(account.expires_at).toBe(1893456000);
    expect(account.token_type).toBe('bearer');
    expect(account.scope).toBe('read:user');
    expect(account.id_token).toBe('id-token');
    expect(account.session_state).toBe('state');
  });

  it('belongs to a user', async () => {
    const user = await createUser();
    const account = await createAccount({ userId: user.id });

    expect((await account.getUser())?.id).toBe(user.id);

    const fresh = await Account.findByPk(account.id, { include: [User] });
    expect(fresh?.User.username).toBe(user.username);
  });

  it('enforces the userId foreign key', async () => {
    await expect(createAccount({ userId: 9999 })).rejects.toBeInstanceOf(ForeignKeyConstraintError);
  });

  it('cascades when the user is force deleted', async () => {
    const user = await createUser();
    await createAccount({ userId: user.id });

    await user.destroy({ force: true });

    expect(await Account.count()).toBe(0);
  });

  it('supports soft delete', async () => {
    const user = await createUser();
    const account = await createAccount({ userId: user.id });

    await account.destroy();

    expect(await Account.findByPk(account.id)).toBeNull();
    expect(await Account.findByPk(account.id, { paranoid: false })).not.toBeNull();
  });
});
