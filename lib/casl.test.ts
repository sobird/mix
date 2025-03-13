import { defineAbility } from '@casl/ability';

import User from '@/models/user';

import { toSequelizeQuery } from './casl';

const today = new Date().setHours(0, 0, 0, 0);

const ability = defineAbility((can) => {
  can('read', User, { username: 'sobird' });
  can('read', User, ['username', 'nickname'], { id: '1' });
  can('update', User, ['title', 'description'], { id: '1' });
  can('read', 'Article', { createdAt: { $lte: today } });
});

it('toSequelizeQuery', () => {
  const query = toSequelizeQuery(ability, 'read', 'Article');

  const expected = {
    [Symbol('or')]: [{
      createdAt: {
        [Symbol('lte')]: today,
      },
    }],
  };

  expect(query).toEqual(expected);
});
