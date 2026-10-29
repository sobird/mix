/**
 * 角色
 *
 * sobird<i@sobird.me> at 2023/09/21 14:17:06 created.
 */

import { Role, Permission, UserRole, sequelize } from '@/models';

// oxlint-disable-next-line typescript/no-extraneous-class
class RoleService {
  /**
   * 为新用户分配默认角色。
   *
   * 默认角色由 `Role.afterSync` 以 `isDefault: true` 标记（内置的「成员」）；
   * 若系统未配置默认角色，则仅告警并跳过，不影响注册/创建流程。
   */
  static async assignDefaultRole(userId: number): Promise<void> {
    const role = await Role.findOne({ where: { isDefault: true } });

    if (!role) {
      console.warn('[role] 未找到默认角色，跳过分配');
      return;
    }

    await UserRole.findOrCreate({ where: { userId, roleId: role.id } });
  }

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
              narrowing: fields?.length ? { fields } : null,
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
