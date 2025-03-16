import { defineAbility } from '@casl/ability';
import { Op } from 'sequelize';

import User from '@/models/user';

import { toSequelizeQuery } from './casl';

const today = new Date().setHours(0, 0, 0, 0);

const ability = defineAbility((can) => {
  can('read', User, { username: 'sobird' });
  can('read', User, ['username', 'nickname'], { id: '1' });
  can('update', User, ['title', 'description'], { id: '1' });
  can('read', 'Article', { createdAt: { $lte: today }, id: { $in: [1, 2, 3, 4] } });
  can('read', 'Article', { id: '$user.id' });
  can('read', 'Article', ['nage', 'age', 'address.street'], { name: 123, age: 32, $or: [{ ddd: 1 }, { aaa: 2 }] });
});

console.log('ability.rules', ability.rulesFor('read', 'Article'));

it('toSequelizeQuery', () => {
  const query = toSequelizeQuery(ability, 'read', 'Article');

  console.log('query', query);

  const expected = {
    [Symbol('or')]: [{
      createdAt: {
        [Symbol('lte')]: today,
      },
    }],
  };

  expect(query).toEqual(expected);
});

console.log('Op', Object.keys(Op));
