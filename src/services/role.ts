/**
 * 角色
 *
 * sobird<i@sobird.me> at 2023/09/21 14:17:06 created.
 */

import type { Attributes } from 'sequelize';

import { Role, Permission, User, UserRole, sequelize } from '@/models';
import type { AppAbility } from '@/services/ability/build';
import { isAllowed } from '@/services/ability/check';
import { pruneReadableFields } from '@/services/ability/fields';
import { queryAccessible } from '@/services/ability/query';

import { paginateAccessible, type PageQuery } from './access';
import { ForbiddenError, NotFoundError } from './errors';

const OWNER_ROLE_NAME = '拥有者';

export interface RoleWriteData {
  name: string;
  description?: string | null;
  parentId?: number;
}

export interface PermissionInput {
  subject: string;
  actions: { action: string; fields?: string[] }[];
}

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
   * 默认角色由 `syncPermissionCatalog` 以 `isDefault: true` 标记（内置的「成员」）；
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
    return sequelize.transaction(async (transaction) => {
      await Role.update({ isDefault: false }, { where: { isDefault: true }, transaction });
      await Role.update({ isDefault: true }, { where: { id: roleId }, transaction });
    });
  }

  /** 分页读取当前用户可访问的角色 */
  static async listWithPage(ability: AppAbility, query: PageQuery) {
    return paginateAccessible(Role, ability, 'read', query);
  }

  /** 读取当前用户可访问的角色选项，用于表单下拉；无权时返回空数组 */
  static async listOptions(ability: AppAbility): Promise<Array<{ value: number; label: string }>> {
    const roles = await queryAccessible(Role, ability, 'read');

    return roles.map((role) => {
      const pruned = pruneReadableFields(ability, 'read', 'Role', role.toJSON() as Record<string, unknown>);
      return { value: role.id, label: (pruned.name as string | undefined) ?? `#${role.id}` };
    });
  }

  /** 读取可编辑的角色，包含其权限关联 */
  static async findForEdit(ability: AppAbility, id: number | string): Promise<Attributes<Role>> {
    const role = await Role.findByPk(id, { include: [Role.associations.Permissions] });

    if (!role) {
      throw new NotFoundError('角色不存在');
    }

    if (!isAllowed(ability, 'update', 'Role', role)) {
      throw new ForbiddenError('您没有更新角色的权限');
    }

    return pruneReadableFields(ability, 'update', 'Role', role.toJSON() as Record<string, unknown>) as Attributes<Role>;
  }

  static async create(ability: AppAbility, data: RoleWriteData): Promise<[Role, boolean]> {
    if (!isAllowed(ability, 'create', 'Role')) {
      throw new ForbiddenError('您没有创建角色的权限');
    }

    return Role.findOrCreate({
      defaults: data,
      where: { name: data.name },
    });
  }

  static async update(ability: AppAbility, id: number | string, data: RoleWriteData): Promise<void> {
    const role = await Role.findByPk(id);

    if (!role) {
      throw new NotFoundError('角色不存在');
    }

    if (!isAllowed(ability, 'update', 'Role', role)) {
      throw new ForbiddenError('您没有更新角色的权限');
    }

    await role.update(data);
  }

  static async remove(ability: AppAbility, id: number | string): Promise<void> {
    const role = await Role.findByPk(id);

    if (!role) {
      throw new NotFoundError('角色不存在');
    }

    if (!isAllowed(ability, 'delete', 'Role', role)) {
      throw new ForbiddenError('您没有删除角色的权限');
    }

    await role.destroy();
  }

  /** 以给定权限集合整体替换角色的授予 */
  static async savePermissions(ability: AppAbility, roleId: number, permissions: PermissionInput[]): Promise<void> {
    const role = await Role.findByPk(roleId);

    if (!role) {
      throw new NotFoundError('角色不存在');
    }

    if (!isAllowed(ability, 'update', 'Role', role)) {
      throw new ForbiddenError('您没有更新角色的权限');
    }

    await sequelize.transaction(async (transaction) => {
      await role.setPermissions([], { transaction });

      for (const { subject, actions } of permissions) {
        for (const { action, fields } of actions) {
          // SQLite 单连接下事务内的查询必须串行，不能并发
          // oxlint-disable-next-line no-await-in-loop
          const [permission] = await Permission.findOrCreate({
            where: { action, subject },
            transaction,
          });

          // oxlint-disable-next-line no-await-in-loop
          await role.addPermission(permission, {
            through: {
              narrowing: fields?.length ? { fields } : null,
            },
            transaction,
          });
        }
      }
    });
  }
}

export default RoleService;
