// @vitest-environment node

import { ForeignKeyConstraintError, UniqueConstraintError, ValidationError } from 'sequelize';

import { Role, User, UserRole } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createRole, createUser, createUserRole } from '../../tests/helpers/factories';

useInMemoryDatabase();

describe('UserRole model', () => {
  it('requires userId and roleId', async () => {
    await expect(UserRole.create({ userId: null, roleId: null } as never)).rejects.toBeInstanceOf(ValidationError);
  });

  it('enforces foreign keys', async () => {
    await expect(createUserRole({ userId: 9999, roleId: 9999 })).rejects.toBeInstanceOf(ForeignKeyConstraintError);
  });

  it('treats the user/role pair as a composite primary key', async () => {
    const user = await createUser();
    const role = await createRole();

    await createUserRole({ userId: user.id, roleId: role.id });

    await expect(createUserRole({ userId: user.id, roleId: role.id })).rejects.toBeInstanceOf(UniqueConstraintError);
    expect(UserRole.primaryKeyAttributes).toEqual(['userId', 'roleId']);
  });

  it('belongs to user and role', async () => {
    const user = await createUser();
    const role = await createRole();
    await createUserRole({ userId: user.id, roleId: role.id });

    const fresh = await UserRole.findOne({
      where: { userId: user.id, roleId: role.id },
      include: [User, Role],
    });
    expect(fresh?.User.username).toBe(user.username);
    expect(fresh?.Role.name).toBe(role.name);
  });

  it('is not paranoid: destroy removes the row permanently', async () => {
    const user = await createUser();
    const role = await createRole();
    const userRole = await createUserRole({ userId: user.id, roleId: role.id });

    await userRole.destroy();

    const where = { userId: user.id, roleId: role.id };
    expect(await UserRole.findOne({ where, paranoid: false })).toBeNull();
  });
});
