import type { User } from '@/models';

import AbilityService from './ability/legacy';

vi.mock('@/models');

describe('AbilityService', () => {
  it('builds abilities from the seeded roles and permissions', async () => {
    // 种子数据中 id 为 1 的是 admin，绑定管理员角色（manage all / read User / update User）
    const ability = await AbilityService.createFor({ id: 1 } as User);

    expect(ability.can('manage', 'all')).toBe(true);
    expect(ability.can('read', 'User')).toBe(true);
    expect(ability.can('update', 'User')).toBe(true);
  });

  it('returns an empty ability for an unknown user', async () => {
    const ability = await AbilityService.createFor({ id: 9999 } as User);

    expect(ability.can('read', 'User')).toBe(false);
  });
});
