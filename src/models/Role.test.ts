// @vitest-environment node

import { UniqueConstraintError, ValidationError } from 'sequelize';

import { Permission, Role, RolePermission, User } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createPermission, createRole, createUser } from '../../tests/helpers/factories';

useInMemoryDatabase();

describe('Role model', () => {
  describe('columns', () => {
    it('applies defaults', async () => {
      const role = await createRole();

      expect(role.defaultable).toBe(true);
      expect(role.editable).toBe(true);
      expect(role.isDefault).toBe(false);
      expect(role.isBuiltin).toBe(false);
      // 全局 omitNull 为 true，未提供的字段不会写入数据库，实例上保持 undefined
      expect(role.description).toBeUndefined();
    });

    it('requires a name', async () => {
      await expect(Role.create({ name: null } as never)).rejects.toBeInstanceOf(ValidationError);
    });

    it('requires a unique name', async () => {
      await createRole({ name: 'unique-role' });

      await expect(createRole({ name: 'unique-role' })).rejects.toBeInstanceOf(UniqueConstraintError);
    });

    it('supports soft delete', async () => {
      const role = await createRole();

      await role.destroy();

      expect(await Role.findByPk(role.id)).toBeNull();
      expect(await Role.findByPk(role.id, { paranoid: false })).not.toBeNull();
    });
  });

  describe('self-referencing tree', () => {
    it('links parent and children', async () => {
      const parent = await createRole({ name: 'parent' });
      const child = await createRole({ name: 'child', parentId: parent.id });

      expect((await child.getParent())?.id).toBe(parent.id);
      expect((await parent.getChildren()).map((role) => role.id)).toEqual([child.id]);

      const withChildren = await Role.findByPk(parent.id, { include: [Role.associations.children] });
      expect(withChildren?.children.map((role) => role.name)).toEqual(['child']);
    });

    it('sets children parentId to null when the parent is force deleted', async () => {
      const parent = await createRole({ name: 'parent' });
      const child = await createRole({ name: 'child', parentId: parent.id });

      await parent.destroy({ force: true });

      await child.reload();
      expect(child.parentId).toBeNull();
    });
  });

  describe('associations', () => {
    it('links users through UserRole', async () => {
      const role = await createRole();
      const user = await createUser();

      await role.addUser(user);

      expect(await role.countUsers()).toBe(1);
      expect((await role.getUsers()).map((item) => item.id)).toEqual([user.id]);

      const fresh = await Role.findByPk(role.id, { include: [User] });
      expect(fresh?.Users).toHaveLength(1);
    });

    it('links permissions through RolePermission and keeps the narrowing payload', async () => {
      const role = await createRole();
      const permission = await createPermission({ action: 'read', subject: 'User' });
      const narrowing = { fields: ['username', 'email'] };

      await role.addPermission(permission, { through: { narrowing } });

      const fresh = await Role.findByPk(role.id, {
        include: [{ model: Permission, through: { attributes: ['narrowing'] } }],
      });

      expect(fresh?.Permissions).toHaveLength(1);
      expect(fresh?.Permissions[0].RolePermission.narrowing).toEqual(narrowing);
      expect(await RolePermission.count()).toBe(1);
    });

    it('replaces permissions with setPermissions', async () => {
      const role = await createRole();
      const first = await createPermission({ action: 'read', subject: 'User' });
      const second = await createPermission({ action: 'update', subject: 'User' });

      await role.setPermissions([first, second]);
      await role.setPermissions([second]);

      expect((await role.getPermissions()).map((item) => item.id)).toEqual([second.id]);
      expect(await RolePermission.count()).toBe(1);
    });
  });
});
