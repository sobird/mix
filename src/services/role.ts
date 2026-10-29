/**
 * 角色
 *
 * sobird<i@sobird.me> at 2023/09/21 14:17:06 created.
 */

import { Role, Permission, User, UserRole, sequelize } from '@/models';

const OWNER_ROLE_NAME = '拥有者';

const OWNER_ROLE_DEFAULTS = {
  name: OWNER_ROLE_NAME,
  description: '系统拥有者角色',
  isBuiltin: true,
  editable: false,
  defaultable: false,
};

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

  /**
   * 将首个用户提升为拥有者。
   *
   * - 若已有任意用户持有「拥有者」角色，返回 null；
   * - 空库同样返回 null；
   * - 否则授予创建时间最早（id 最小）的用户，并返回其 id。
   */
  static async assignOwnerToFirstUser(): Promise<number | null> {
    const ownerRole = await Role.findOne({ where: { name: OWNER_ROLE_NAME } });

    if (ownerRole) {
      const existing = await UserRole.findOne({ where: { roleId: ownerRole.id } });
      if (existing) return null;
    }

    const firstUser = await User.findOne({ order: [['id', 'ASC']] });
    if (!firstUser) return null;

    const role = ownerRole ?? (await Role.create(OWNER_ROLE_DEFAULTS));

    await UserRole.findOrCreate({ where: { userId: firstUser.id, roleId: role.id } });

    return firstUser.id;
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
