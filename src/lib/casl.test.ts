import { createMongoAbility } from '@casl/ability';
import { Op } from 'sequelize';

import { buildAbility, type AppAbility } from '@/services/ability/build';

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

  it('returns none when an unconditional deny sits on top of a conditional allow', () => {
    const ability = createMongoAbility<AppAbility>([
      { action: 'read', subject: 'User', conditions: { ownerId: 1 } },
      { action: 'read', subject: 'User', inverted: true },
    ]);

    expect(toAccessQuery(ability, 'read', 'User')).toEqual({ kind: 'none' });
  });

  it('combines a conditional allow and a conditional deny with $and', () => {
    const ability = createMongoAbility<AppAbility>([
      { action: 'read', subject: 'User', conditions: { ownerId: 1 } },
      { action: 'read', subject: 'User', conditions: { id: 5 }, inverted: true },
    ]);

    expect(toAccessQuery(ability, 'read', 'User')).toEqual({
      kind: 'filter',
      where: { [Op.and]: [{ ownerId: 1 }, { [Op.not]: { id: 5 } }] },
    });
  });

  it('expresses an unconditional allow plus a conditional deny with only $not', () => {
    const ability = createMongoAbility<AppAbility>([
      { action: 'read', subject: 'User' },
      { action: 'read', subject: 'User', conditions: { id: 5 }, inverted: true },
    ]);

    expect(toAccessQuery(ability, 'read', 'User')).toEqual({
      kind: 'filter',
      where: { [Op.not]: { id: 5 } },
    });
  });

  it('merges two conditional allows into a single $or', () => {
    // CASL returns relevant rules most-recent-first, so insert in reverse to yield $or: [1, 2].
    const ability = createMongoAbility<AppAbility>([
      { action: 'read', subject: 'User', conditions: { ownerId: 2 } },
      { action: 'read', subject: 'User', conditions: { ownerId: 1 } },
    ]);

    expect(toAccessQuery(ability, 'read', 'User')).toEqual({
      kind: 'filter',
      where: { [Op.or]: [{ ownerId: 1 }, { ownerId: 2 }] },
    });
  });
});

describe('symbolize', () => {
  it('keeps Date values while symbolizing operators', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');

    expect(symbolize({ $lte: date })).toEqual({ [Op.lte]: date });
  });

  it('maps $nin to Op.notIn for Sequelize', () => {
    expect(symbolize({ id: { $nin: [1, 2] } })).toEqual({ id: { [Op.notIn]: [1, 2] } });
  });
});
