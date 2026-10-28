// @vitest-environment node

import { UniqueConstraintError, ValidationError } from 'sequelize';

import { VerificationToken } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createVerificationToken } from '../../tests/helpers/factories';

useInMemoryDatabase();

describe('VerificationToken model', () => {
  it('requires token, identifier and expires', async () => {
    await expect(
      VerificationToken.create({ token: null, identifier: null, expires: null } as never),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('uses token and identifier as a composite primary key', async () => {
    await createVerificationToken({ token: 'same-token', identifier: 'a@example.com' });

    await expect(createVerificationToken({ token: 'same-token', identifier: 'a@example.com' })).rejects.toBeInstanceOf(
      UniqueConstraintError,
    );
    expect(VerificationToken.primaryKeyAttributes).toEqual(['token', 'identifier']);
  });

  it('allows the same token for different identifiers', async () => {
    await createVerificationToken({ token: 'shared-token', identifier: 'a@example.com' });
    await createVerificationToken({ token: 'shared-token', identifier: 'b@example.com' });

    expect(await VerificationToken.count()).toBe(2);
  });

  it('is not paranoid: destroy removes the row permanently', async () => {
    const token = await createVerificationToken();

    await token.destroy();

    const where = { token: token.token, identifier: token.identifier };
    expect(await VerificationToken.findOne({ where, paranoid: false })).toBeNull();
    expect(await VerificationToken.count({ paranoid: false })).toBe(0);
  });
});
