/**
 * 角色
 *
 * sobird<i@sobird.me> at 2023/09/21 14:17:06 created.
 */

import type { Attributes } from 'sequelize';

import { Role, Permission, RolePermission, User, UserRole, sequelize } from '@/models';
import { PERMISSION_CATALOG } from '@/permissions/catalog';
import type { AppAbility } from '@/services/ability/build';
import { isAllowed } from '@/services/ability/check';
import { pickWritableFields, pruneReadableFields } from '@/services/ability/fields';
import { normalizeNarrowing } from '@/services/ability/narrowing';
import { queryAccessible } from '@/services/ability/query';

import { paginateAccessible, type PageQuery } from './access';
import { ForbiddenError, NotFoundError } from './errors';

const OWNER_ROLE_NAME = '拥有者';

/** 目录条目的唯一键，与数据库 UNIQUE(action, subject) 对应 */
function catalogKey(action: string, subject: string): string {
  return `${action}\u0000${subject}`;
}

const CATALOG_KEYS = new Set(PERMISSION_CATALOG.map((entry) => catalogKey(entry.action, entry.subject)));

/** 目录内的展示名称；目录外返回 undefined，由调用方回退到 `action:subject` */
function catalogName(action: string, subject: string): string | undefined {
  return PERMISSION_CATALOG.find((entry) => entry.action === action && entry.subject === subject)?.name;
}

export interface RoleWriteData {
  name: string;
  description?: string | null;
  parentId?: number;
}

export interface PermissionInput {
  subject: string;
  actions: {
    action: string;
    fields?: string[];
    conditions?: Record<string, unknown>;
    expiresAt?: string | null;
    inverted?: boolean;
  }[];
}

/** 编辑器读取的单条授予，字段限制已归一化 */
export interface RolePermissionGrant {
  action: string;
  subject: string;
  fields: string[];
  conditions: Record<string, unknown> | null;
  expiresAt: string | null;
  inverted: boolean;
}

export interface RolePermissionEditorData {
  grants: RolePermissionGrant[];
  editable: boolean;
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

    const plain = role.get({ plain: true }) as Record<PropertyKey, unknown>;
    await role.update(pickWritableFields(ability, 'update', 'Role', plain, { ...data }));
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
        for (const { action, fields, conditions, expiresAt, inverted } of actions) {
          const name = catalogName(action, subject) ?? `${action}:${subject}`;

          // SQLite 单连接下事务内的查询必须串行，不能并发
          // oxlint-disable-next-line no-await-in-loop
          const [permission] = await Permission.findOrCreate({
            where: { action, subject },
            defaults: { action, subject, name, description: name },
            transaction,
          });

          const hasConditions = conditions !== undefined && Object.keys(conditions).length > 0;
          const narrowing =
            fields?.length || hasConditions || inverted === true
              ? {
                  fields: fields?.length ? fields : undefined,
                  conditions: hasConditions ? conditions : undefined,
                  inverted: inverted || undefined,
                }
              : null;

          // oxlint-disable-next-line no-await-in-loop
          await role.addPermission(permission, {
            through: { narrowing, expiresAt: expiresAt ? new Date(expiresAt) : null },
            transaction,
          });
        }
      }
    });
  }

  /** 读取角色权限编辑器的授予集合；内置角色不可编辑 */
  static async findPermissionEditor(ability: AppAbility, id: number | string): Promise<RolePermissionEditorData> {
    const role = await Role.findByPk(id);

    if (!role) {
      throw new NotFoundError('角色不存在');
    }

    if (!isAllowed(ability, 'update', 'Role', role)) {
      throw new ForbiddenError('您没有更新角色的权限');
    }

    const rows = await RolePermission.findAll({
      where: { roleId: role.id },
      include: [{ model: Permission, required: true }],
    });

    const grants: RolePermissionGrant[] = [];

    for (const row of rows) {
      const { action, subject } = row.Permission;

      // 仅保留目录内的授予；目录外的历史行不进入编辑器
      if (!CATALOG_KEYS.has(catalogKey(action, subject))) {
        continue;
      }

      const narrowing = normalizeNarrowing(row.narrowing);

      if (narrowing === null) {
        continue;
      }

      grants.push({
        action,
        subject,
        fields: narrowing.fields ?? [],
        conditions: narrowing.conditions ?? null,
        expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
        inverted: narrowing.inverted === true,
      });
    }

    return { grants, editable: !role.isBuiltin };
  }
}

export default RoleService;
