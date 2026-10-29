import { Permission } from '@/models';
import type { AppAbility } from '@/services/ability';
import { queryAccessible } from '@/services/ability/query';

/** 权限列表条目，仅包含展示所需字段 */
export interface PermissionListItem {
  id: number;
  name: string;
  action: string;
  subject: string;
  description: string | null;
}

// oxlint-disable-next-line typescript/no-extraneous-class
class PermissionService {
  /** 读取当前能力可见的权限，按主题、动作排序 */
  static async list(ability: AppAbility): Promise<PermissionListItem[]> {
    const rows = await queryAccessible(Permission, ability, 'read');

    return rows
      .map((row) => ({
        id: row.id,
        name: row.name,
        action: row.action,
        subject: row.subject,
        description: row.description ?? null,
      }))
      .sort((a, b) => a.subject.localeCompare(b.subject) || a.action.localeCompare(b.action));
  }
}

export default PermissionService;
