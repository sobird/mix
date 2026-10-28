/**
 * 角色
 *
 * sobird<i@sobird.me> at 2023/09/21 14:17:06 created.
 */

import { Role, Permission, sequelize } from '@/models';

// oxlint-disable-next-line typescript/no-extraneous-class
class RoleService {
  static async setDefaultRole(roleId: number) {
    return sequelize.transaction(async () => {
      await Role.update({ isDefault: false }, { where: { isDefault: true } });
      await Role.update({ isDefault: true }, { where: { id: roleId } });
    });
  }

  static async savePermissions(roleId: number, permissions) {
    const transaction = await sequelize.transaction();

    try {
      const role = await Role.findByPk(roleId, { transaction });
      if (!role) throw new Error('角色不存在');

      await role.setPermissions([], { transaction });

      for await (const { subject, actions } of permissions) {
        for await (const { action, fields } of actions) {
          const [permission] = await Permission.findOrCreate({
            where: { action, subject },
            transaction,
          });

          await role.addPermission(permission, {
            through: {
              rules: fields,
            },
          });
        }
      }
      await transaction.commit();
    } catch {
      await transaction.rollback();
    }
  }
}

export default RoleService;
