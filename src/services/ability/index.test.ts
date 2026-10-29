import { getSessionUserId } from '@/services/auth';

import { buildAbility } from './build';
import { getAbility, getCurrentAbility, isAllowed } from './index';
import { loadUserGrants } from './sources';
import type { AbilityGrant } from './types';

vi.mock('@/services/auth', () => ({ getSessionUserId: vi.fn<() => Promise<number | null>>() }));
vi.mock('./sources', () => ({ loadUserGrants: vi.fn<() => Promise<AbilityGrant[]>>() }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('getCurrentAbility', () => {
  it('returns an empty ability without a session', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(null);

    const ability = await getCurrentAbility();

    expect(ability.can('read', 'User')).toBe(false);
    expect(loadUserGrants).not.toHaveBeenCalled();
  });

  it('loads grants for the session user', async () => {
    vi.mocked(getSessionUserId).mockResolvedValue(7);
    vi.mocked(loadUserGrants).mockResolvedValue([{ action: 'read', subject: 'User', narrowing: {} }]);

    const ability = await getCurrentAbility();

    expect(loadUserGrants).toHaveBeenCalledWith(7);
    expect(ability.can('read', 'User')).toBe(true);
  });
});

describe('getAbility', () => {
  it('loads grants for the given user id', async () => {
    vi.mocked(loadUserGrants).mockResolvedValue([{ action: 'read', subject: 'Role', narrowing: {} }]);

    const ability = await getAbility(42);

    expect(loadUserGrants).toHaveBeenCalledWith(42);
    expect(ability.can('read', 'Role')).toBe(true);
  });
});

describe('isAllowed', () => {
  it('checks instances when provided', () => {
    const ability = buildAbility([{ action: 'update', subject: 'Role', narrowing: { conditions: { id: 1 } } }]);

    expect(isAllowed(ability, 'update', 'Role', { id: 1 })).toBe(true);
    expect(isAllowed(ability, 'update', 'Role', { id: 2 })).toBe(false);
    expect(isAllowed(ability, 'update', 'Role')).toBe(false);
  });

  it('honors unconditional rules without an instance', () => {
    const ability = buildAbility([
      { action: 'read', subject: 'User', narrowing: {} },
      { action: 'manage', subject: 'all', narrowing: {} },
    ]);

    expect(isAllowed(ability, 'read', 'User')).toBe(true);
    expect(isAllowed(ability, 'update', 'Role')).toBe(true);
    expect(isAllowed(ability, 'delete', 'Permission')).toBe(true);
  });

  it('does not treat inverted unconditional rules as allow', () => {
    const ability = buildAbility([
      { action: 'read', subject: 'User', narrowing: {} },
      { action: 'read', subject: 'User', narrowing: { inverted: true } },
    ]);

    expect(isAllowed(ability, 'read', 'User')).toBe(false);
  });
});
