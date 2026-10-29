import { subject } from '@casl/ability';

import { buildAbility } from './build';

describe('buildAbility', () => {
  it('unions grants from multiple roles', () => {
    const ability = buildAbility([
      { action: 'read', subject: 'User', narrowing: {} },
      { action: 'update', subject: 'Role', narrowing: {} },
    ]);
    expect(ability.can('read', 'User')).toBe(true);
    expect(ability.can('update', 'Role')).toBe(true);
  });

  it('applies inverted grants after allow grants', () => {
    const ability = buildAbility([
      { action: 'update', subject: 'Role', narrowing: { conditions: { id: 9 }, inverted: true } },
      { action: 'update', subject: 'Role', narrowing: {} },
    ]);
    expect(ability.can('update', subject('Role', { id: 9 }))).toBe(false);
    expect(ability.can('update', subject('Role', { id: 1 }))).toBe(true);
  });

  it('evaluates conditional grants only against instances', () => {
    const ability = buildAbility([{ action: 'update', subject: 'Role', narrowing: { conditions: { id: 1 } } }]);
    expect(ability.can('update', subject('Role', { id: 1 }))).toBe(true);
    expect(ability.can('update', subject('Role', { id: 2 }))).toBe(false);
  });

  it('ignores fields for the all subject and warns once per build', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const ability = buildAbility([
      { action: 'read', subject: 'all', narrowing: { fields: ['name'] } },
      { action: 'update', subject: 'all', narrowing: { fields: ['title'] } },
    ]);

    expect(ability.can('read', 'User', 'email')).toBe(true);
    expect(ability.can('update', 'Role', 'name')).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);

    warn.mockRestore();
  });
});
