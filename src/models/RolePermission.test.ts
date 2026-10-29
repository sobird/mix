// @vitest-environment node

import { ForeignKeyConstraintError, UniqueConstraintError, ValidationError } from 'sequelize';

import { Permission, Role, RolePermission } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createPermission, createRole, createRolePermission } from '../../tests/helpers/factories';

useInMemoryDatabase();

describe('RolePermission model', () => {
  it('leaves narrowing null by default', async () => {
    const role = await createRole();
    const permission = await createPermission();

    const rolePermission = await createRolePermission({ roleId: role.id, permissionId: permission.id });

    await rolePermission.reload();
    expect(rolePermission.narrowing).toBeNull();
  });

  it('stores narrowing as JSON and expiresAt', async () => {
    const role = await createRole();
    const permission = await createPermission();
    const narrowing = { fields: ['email'] };
    const future = new Date('2099-12-31T00:00:00.000Z');

    const rolePermission = await createRolePermission({
      roleId: role.id,
      permissionId: permission.id,
      narrowing,
      expiresAt: future,
    });

    await rolePermission.reload();
    expect(rolePermission.narrowing).toEqual(narrowing);
    expect(rolePermission.expiresAt?.toISOString()).toBe(future.toISOString());
  });

  it('requires roleId and permissionId', async () => {
    await expect(RolePermission.create({ roleId: null, permissionId: null } as never)).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('enforces foreign keys', async () => {
    await expect(createRolePermission({ roleId: 9999, permissionId: 9999 })).rejects.toBeInstanceOf(
      ForeignKeyConstraintError,
    );
  });

  it('treats the role/permission pair as a composite primary key', async () => {
    const role = await createRole();
    const permission = await createPermission();

    await createRolePermission({ roleId: role.id, permissionId: permission.id });

    await expect(createRolePermission({ roleId: role.id, permissionId: permission.id })).rejects.toBeInstanceOf(
      UniqueConstraintError,
    );
    expect(RolePermission.primaryKeyAttributes).toEqual(['permissionId', 'roleId']);
  });

  it('belongs to role and permission', async () => {
    const role = await createRole();
    const permission = await createPermission({ action: 'read', subject: 'User' });
    const rolePermission = await createRolePermission({ roleId: role.id, permissionId: permission.id });

    expect((await rolePermission.getRole())?.id).toBe(role.id);
    expect((await rolePermission.getPermission())?.id).toBe(permission.id);

    const fresh = await RolePermission.findOne({
      where: { roleId: role.id, permissionId: permission.id },
      include: [Role, Permission],
    });
    expect(fresh?.Role.name).toBe(role.name);
    expect(fresh?.Permission.action).toBe('read');
  });

  it('is not paranoid: destroy removes the row permanently', async () => {
    const role = await createRole();
    const permission = await createPermission();
    const rolePermission = await createRolePermission({ roleId: role.id, permissionId: permission.id });

    await rolePermission.destroy();

    const where = { roleId: role.id, permissionId: permission.id };
    expect(await RolePermission.findOne({ where, paranoid: false })).toBeNull();
  });
});
