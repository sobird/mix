// @vitest-environment node

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createRole, createUser } from '../../tests/helpers/factories';
import { buildAbility } from './ability';
import { ForbiddenError, NotFoundError } from './errors';
import { syncPermissionCatalog } from './permission-catalog';
import { UserService } from './user';

useInMemoryDatabase();

describe('UserService.create', () => {
  it('assigns the default role when an admin creates a user', async () => {
    await syncPermissionCatalog();

    const ability = buildAbility([{ action: 'create', subject: 'User', narrowing: {} }]);
    const [user] = await UserService.create(ability, {
      username: 'new',
      email: 'new@mix.local',
      password: 'secret12',
    });
    expect((await user.getRoles()).map((role) => role.name)).toContain('成员');
  });
});

describe('UserService credential redaction', () => {
  const readAbility = buildAbility([{ action: 'read', subject: 'User', narrowing: {} }]);
  const updateAbility = buildAbility([{ action: 'update', subject: 'User', narrowing: {} }]);

  it('omits credential fields from listWithPage rows', async () => {
    await createUser({ password: 'secret12', emailVerified: new Date() });

    const page = await UserService.listWithPage(readAbility, {});

    expect(page.rows).toHaveLength(1);
    const [row] = page.rows;
    expect(row).not.toHaveProperty('password');
    expect(row).not.toHaveProperty('salt');
    expect(row).not.toHaveProperty('emailVerified');
  });

  it('omits credential fields from findForEdit', async () => {
    const user = await createUser({ password: 'secret12', emailVerified: new Date() });

    const data = await UserService.findForEdit(updateAbility, user.id);

    expect(data).not.toHaveProperty('password');
    expect(data).not.toHaveProperty('salt');
    expect(data).not.toHaveProperty('emailVerified');
    expect(data.roles).toEqual([]);
  });
});

describe('UserService.findForEdit field pruning', () => {
  it('prunes edit data to update fields and hides roles when not writable', async () => {
    const user = await createUser({ nickname: 'nick' });
    const ability = buildAbility([{ action: 'update', subject: 'User', narrowing: { fields: ['username'] } }]);

    const data = await UserService.findForEdit(ability, user.id);

    expect(data).toHaveProperty('username');
    expect(data).not.toHaveProperty('email');
    expect(data).not.toHaveProperty('nickname');
    expect(data).not.toHaveProperty('roles');
  });
});

describe('UserService.findForEdit authorization', () => {
  it('throws NotFoundError for a missing user', async () => {
    const ability = buildAbility([{ action: 'update', subject: 'User', narrowing: {} }]);

    await expect(UserService.findForEdit(ability, 999_999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ForbiddenError under a conditional-only grant', async () => {
    const user = await createUser();
    const ability = buildAbility([
      { action: 'update', subject: 'User', narrowing: { conditions: { id: user.id + 1 } } },
    ]);

    await expect(UserService.findForEdit(ability, user.id)).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('UserService.update field filtering', () => {
  it('silently drops fields outside the update grant', async () => {
    const user = await createUser({ nickname: 'nick' });
    const ability = buildAbility([{ action: 'update', subject: 'User', narrowing: { fields: ['username'] } }]);

    await UserService.update(ability, user.id, { username: 'renamed', nickname: 'changed' });
    await user.reload();

    expect(user.username).toBe('renamed');
    expect(user.nickname).toBe('nick');
  });

  it('gates role assignment behind the roles pseudo-field', async () => {
    await syncPermissionCatalog();
    const user = await createUser();
    const role = await createRole();
    const withoutRoles = buildAbility([{ action: 'update', subject: 'User', narrowing: { fields: ['username'] } }]);

    await UserService.update(withoutRoles, user.id, { roles: [role.id] });
    expect(await user.getRoles()).toEqual([]);

    const withRoles = buildAbility([{ action: 'update', subject: 'User', narrowing: { fields: ['roles'] } }]);
    await UserService.update(withRoles, user.id, { roles: [role.id] });
    expect((await user.getRoles()).map((item) => item.id)).toEqual([role.id]);
  });
});
