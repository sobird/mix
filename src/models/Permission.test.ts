// @vitest-environment node

import { UniqueConstraintError, ValidationError } from 'sequelize';

import { Permission, Role, RolePermission } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createPermission, createRole } from '../../tests/helpers/factories';

useInMemoryDatabase();

describe('Permission model', () => {
  describe('columns', () => {
    it('creates a permission with action and subject', async () => {
      const permission = await createPermission({ action: 'read', subject: 'User', description: '查看用户' });

      expect(permission.id).toBeGreaterThan(0);
      expect(permission.action).toBe('read');
      expect(permission.subject).toBe('User');
      expect(permission.description).toBe('查看用户');
      expect(permission.createdAt).toBeInstanceOf(Date);
    });

    it('requires a name', async () => {
      await expect(Permission.create({ name: null } as never)).rejects.toBeInstanceOf(ValidationError);
    });

    it('requires action and subject', async () => {
      await expect(Permission.create({ name: 'x' } as never)).rejects.toBeInstanceOf(ValidationError);
    });

    it('rejects duplicate action/subject', async () => {
      await createPermission({ action: 'read', subject: 'User' });

      await expect(createPermission({ action: 'read', subject: 'User' })).rejects.toBeInstanceOf(UniqueConstraintError);
    });

    it('supports soft delete', async () => {
      const permission = await createPermission();

      await permission.destroy();

      expect(await Permission.findByPk(permission.id)).toBeNull();
      expect(await Permission.findByPk(permission.id, { paranoid: false })).not.toBeNull();
    });
  });

  describe('associations', () => {
    it('links roles through RolePermission', async () => {
      const permission = await createPermission({ action: 'manage', subject: 'all' });
      const role = await createRole();

      await permission.addRole(role);

      expect((await permission.getRoles()).map((item) => item.id)).toEqual([role.id]);
      expect(await permission.countRoles()).toBe(1);
      expect(await RolePermission.count()).toBe(1);

      const fresh = await Permission.findByPk(permission.id, { include: [Role] });
      expect(fresh?.Roles).toHaveLength(1);
    });
  });
});
