// @vitest-environment node

import { User } from '@/models';

import { useInMemoryDatabase } from '../../../tests/helpers/database';
import { createUser } from '../../../tests/helpers/factories';
import { buildAbility } from './build';
import { queryAccessible } from './query';

useInMemoryDatabase();

afterEach(() => {
  vi.restoreAllMocks();
});

describe('queryAccessible', () => {
  it('returns an empty list without querying when no rule allows access', async () => {
    const findAll = vi.spyOn(User, 'findAll');

    await expect(queryAccessible(User, buildAbility([]), 'read')).resolves.toEqual([]);
    expect(findAll).not.toHaveBeenCalled();
  });

  it('returns every row for an unconditional allow', async () => {
    await createUser();
    await createUser();

    const rows = await queryAccessible(
      User,
      buildAbility([{ action: 'read', subject: 'User', narrowing: {} }]),
      'read',
    );

    expect(rows).toHaveLength(2);
  });

  it('returns only matching rows for a conditional allow', async () => {
    const first = await createUser();
    await createUser();

    const rows = await queryAccessible(
      User,
      buildAbility([{ action: 'read', subject: 'User', narrowing: { conditions: { id: first.id } } }]),
      'read',
    );

    expect(rows.map((row) => row.id)).toEqual([first.id]);
  });
});
