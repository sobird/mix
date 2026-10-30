import { Permission } from '@/models';
import type { AppAbility } from '@/services/ability';
import { pruneReadableFields } from '@/services/ability/fields';
import { queryAccessible } from '@/services/ability/query';

/** 权限列表条目，仅包含展示所需字段；除 id 外均可能被字段级授权裁剪 */
export interface PermissionListItem {
  id: number;
  name?: string;
  action?: string;
  subject?: string;
  description?: string | null;
}

// oxlint-disable-next-line typescript/no-extraneous-class
class PermissionService {
  /** 读取当前能力可见的权限，按主题、动作排序 */
  static async list(ability: AppAbility): Promise<PermissionListItem[]> {
    const rows = await queryAccessible(Permission, ability, 'read');

    return rows
      .map((row) => {
        const pruned = pruneReadableFields(ability, 'read', 'Permission', row.toJSON() as Record<string, unknown>);

        return {
          id: row.id,
          name: pruned.name as string | undefined,
          action: pruned.action as string | undefined,
          subject: pruned.subject as string | undefined,
          description: (pruned.description as string | null | undefined) ?? null,
        };
      })
      .sort(
        (a, b) => (a.subject ?? '').localeCompare(b.subject ?? '') || (a.action ?? '').localeCompare(b.action ?? ''),
      );
  }
}

export default PermissionService;
