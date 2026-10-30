// @vitest-environment node

import { Permission, Role, RolePermission, UserRole } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createRole, createUser } from '../../tests/helpers/factories';
import { buildAbility } from './ability';
import { ForbiddenError } from './errors';
import { syncPermissionCatalog } from './permission-catalog';
import RoleService from './role';

useInMemoryDatabase();

describe('RoleService.assignDefaultRole', () => {
  beforeEach(async () => {
    await syncPermissionCatalog();
  });

  it('assigns the default role to a new user', async () => {
    const user = await createUser();

    await RoleService.assignDefaultRole(user.id);

    const roles = await user.getRoles();
    expect(roles.map((role) => role.name)).toContain('成员');
  });

  it('does not duplicate the user role when called twice', async () => {
    const user = await createUser();
    const defaultRole = await Role.findOne({ where: { isDefault: true } });
    expect(defaultRole).not.toBeNull();

    await RoleService.assignDefaultRole(user.id);
    await RoleService.assignDefaultRole(user.id);

    expect(await UserRole.count({ where: { userId: user.id, roleId: defaultRole!.id } })).toBe(1);
  });

  it('warns and does not throw when there is no default role', async () => {
    const user = await createUser();
    await Role.update({ isDefault: false }, { where: { isDefault: true } });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(RoleService.assignDefaultRole(user.id)).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalled();
    expect(await UserRole.count({ where: { userId: user.id } })).toBe(0);

    warn.mockRestore();
  });
});

describe('RoleService write authorization', () => {
  it('rejects writes from a member', async () => {
    const ability = buildAbility([{ action: 'read', subject: 'Role', narrowing: {} }]);
    await expect(RoleService.create(ability, { name: '新角色' })).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('checks the role instance on update', async () => {
    const allowed = await createRole();
    const other = await createRole();
    const ability = buildAbility([
      { action: 'update', subject: 'Role', narrowing: { conditions: { id: allowed.id } } },
    ]);
    await expect(RoleService.update(ability, other.id, { name: '改名' })).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('RoleService.savePermissions', () => {
  it('propagates failures instead of swallowing them', async () => {
    const role = await createRole();
    const ability = buildAbility([{ action: 'manage', subject: 'all', narrowing: {} }]);
    const failure = new Error('database unavailable');
    const spy = vi.spyOn(Role.prototype, 'setPermissions').mockRejectedValueOnce(failure);

    await expect(RoleService.savePermissions(ability, role.id, [])).rejects.toThrow('database unavailable');

    spy.mockRestore();
  });

  it('rejects without update permission', async () => {
    const role = await createRole();
    const ability = buildAbility([{ action: 'read', subject: 'Role', narrowing: {} }]);

    await expect(RoleService.savePermissions(ability, role.id, [])).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('RoleService.savePermissions contract', () => {
  function ownerAbility() {
    return buildAbility([{ action: 'manage', subject: 'all', narrowing: {} }]);
  }

  it('persists narrowing and expiry on the join row', async () => {
    const role = await createRole();
    const expiresAt = new Date('2026-12-31T00:00:00.000Z');

    await RoleService.savePermissions(ownerAbility(), role.id, [
      {
        subject: 'User',
        actions: [
          {
            action: 'read',
            fields: ['username'],
            conditions: { status: true },
            expiresAt: expiresAt.toISOString(),
            inverted: true,
          },
        ],
      },
    ]);

    const row = await RolePermission.findOne({
      where: { roleId: role.id },
      include: [{ model: Permission, required: true }],
    });

    expect(row?.Permission.action).toBe('read');
    expect(row?.narrowing).toEqual({ fields: ['username'], conditions: { status: true }, inverted: true });
    expect(new Date(row!.expiresAt!).toISOString()).toBe(expiresAt.toISOString());
  });

  it('stores null narrowing when only expiry is set', async () => {
    const role = await createRole();

    await RoleService.savePermissions(ownerAbility(), role.id, [
      { subject: 'User', actions: [{ action: 'read', expiresAt: '2026-12-31T00:00:00.000Z' }] },
    ]);

    const row = await RolePermission.findOne({ where: { roleId: role.id } });
    expect(row?.narrowing).toBeNull();
    expect(row?.expiresAt).not.toBeNull();
  });

  it('creates catalog-external permissions with a generated name', async () => {
    const role = await createRole();

    await RoleService.savePermissions(ownerAbility(), role.id, [{ subject: 'Group', actions: [{ action: 'read' }] }]);

    const permission = await Permission.findOne({ where: { action: 'read', subject: 'Group' } });
    expect(permission?.name).toBe('read:Group');
  });

  it('replaces existing grants instead of appending', async () => {
    const role = await createRole();

    await RoleService.savePermissions(ownerAbility(), role.id, [{ subject: 'User', actions: [{ action: 'read' }] }]);
    await RoleService.savePermissions(ownerAbility(), role.id, [{ subject: 'Role', actions: [{ action: 'read' }] }]);

    const rows = await RolePermission.findAll({
      where: { roleId: role.id },
      include: [{ model: Permission, required: true }],
    });
    expect(rows.map((row) => row.Permission.subject)).toEqual(['Role']);
  });
});

describe('RoleService.findPermissionEditor', () => {
  it('returns catalog grants including expired ones', async () => {
    await syncPermissionCatalog();
    const role = await createRole();
    const permission = await Permission.findOne({ where: { action: 'read', subject: 'User' } });
    await role.addPermission(permission!, {
      through: { narrowing: { conditions: { status: true } }, expiresAt: new Date('2020-01-01T00:00:00.000Z') },
    });

    const data = await RoleService.findPermissionEditor(
      buildAbility([{ action: 'manage', subject: 'all', narrowing: {} }]),
      role.id,
    );

    expect(data.editable).toBe(true);
    expect(data.grants).toContainEqual({
      action: 'read',
      subject: 'User',
      fields: [],
      conditions: { status: true },
      expiresAt: '2020-01-01T00:00:00.000Z',
      inverted: false,
    });
  });

  it('marks built-in roles as not editable', async () => {
    await syncPermissionCatalog();
    const owner = await Role.findOne({ where: { name: '拥有者' } });

    const data = await RoleService.findPermissionEditor(
      buildAbility([{ action: 'manage', subject: 'all', narrowing: {} }]),
      owner!.id,
    );

    expect(data.editable).toBe(false);
  });
});

describe('RoleService.listOptions', () => {
  it('returns an empty list without read access', async () => {
    await createRole();

    await expect(RoleService.listOptions(buildAbility([]))).resolves.toEqual([]);
  });

  it('returns role options for an unconditional read grant', async () => {
    const role = await createRole();
    const ability = buildAbility([{ action: 'read', subject: 'Role', narrowing: {} }]);

    await expect(RoleService.listOptions(ability)).resolves.toContainEqual({ value: role.id, label: role.name });
  });

  it('filters options to the matching row under a conditional read grant', async () => {
    const role = await createRole();
    await createRole();
    const ability = buildAbility([{ action: 'read', subject: 'Role', narrowing: { conditions: { id: role.id } } }]);

    await expect(RoleService.listOptions(ability)).resolves.toEqual([{ value: role.id, label: role.name }]);
  });

  it('falls back to a numeric label when name is pruned', async () => {
    const role = await createRole();
    const ability = buildAbility([{ action: 'read', subject: 'Role', narrowing: { fields: ['description'] } }]);

    await expect(RoleService.listOptions(ability)).resolves.toEqual([{ value: role.id, label: `#${role.id}` }]);
  });
});

describe('RoleService.findForEdit', () => {
  it('prunes the edit payload to update fields', async () => {
    const role = await createRole({ description: 'secret' });
    const ability = buildAbility([{ action: 'update', subject: 'Role', narrowing: { fields: ['name'] } }]);

    const data = await RoleService.findForEdit(ability, role.id);

    expect(data).toHaveProperty('name');
    expect(data).not.toHaveProperty('description');
  });
});

describe('RoleService.assignOwnerToFirstUser', () => {
  it('assigns owner to the earliest user only', async () => {
    const first = await createUser();
    const second = await createUser();
    await syncPermissionCatalog();
    expect(await RoleService.assignOwnerToFirstUser()).toBe(first.id);
    expect(await RoleService.assignOwnerToFirstUser()).toBeNull(); // 已存在拥有者
    const role = await first.getRoles();
    expect(role.map((r) => r.name)).toContain('拥有者');
    const secondRoles = await second.getRoles();
    expect(secondRoles.map((r) => r.name)).not.toContain('拥有者');
  });
  it('is a no-op on an empty database', async () => {
    expect(await RoleService.assignOwnerToFirstUser()).toBeNull();
  });
});

it('silently drops fields outside the update grant', async () => {
  const role = await createRole({ description: 'old' });
  const ability = buildAbility([{ action: 'update', subject: 'Role', narrowing: { fields: ['name'] } }]);

  await RoleService.update(ability, role.id, { name: 'renamed', description: 'new' });
  await role.reload();

  expect(role.name).toBe('renamed');
  expect(role.description).toBe('old');
});
