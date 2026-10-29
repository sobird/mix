import { Op } from 'sequelize';

import { buildAbility } from '@/services/ability/build';

import { symbolize, toAccessQuery } from './casl';

describe('toAccessQuery', () => {
  it('returns none when there are no allow rules', () => {
    expect(toAccessQuery(buildAbility([]), 'read', 'User')).toEqual({ kind: 'none' });
  });

  it('returns all for unconditional allow', () => {
    expect(toAccessQuery(buildAbility([{ action: 'read', subject: 'User', narrowing: {} }]), 'read', 'User')).toEqual({
      kind: 'all',
    });
  });

  it('returns a filter for conditional allow', () => {
    const query = toAccessQuery(
      buildAbility([{ action: 'read', subject: 'User', narrowing: { conditions: { id: 1 } } }]),
      'read',
      'User',
    );

    expect(query).toEqual({ kind: 'filter', where: { id: 1 } });
  });
});

describe('symbolize', () => {
  it('keeps Date values while symbolizing operators', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');

    expect(symbolize({ $lte: date })).toEqual({ [Op.lte]: date });
  });
});
