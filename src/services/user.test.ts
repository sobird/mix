// @vitest-environment node

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { buildAbility } from './ability';
import { UserService } from './user';

useInMemoryDatabase();

describe('UserService.create', () => {
  it('assigns the default role when an admin creates a user', async () => {
    const ability = buildAbility([{ action: 'create', subject: 'User', narrowing: {} }]);
    const [user] = await UserService.create(ability, {
      username: 'new',
      email: 'new@mix.local',
      password: 'secret12',
    });
    expect((await user.getRoles()).map((role) => role.name)).toContain('成员');
  });
});
