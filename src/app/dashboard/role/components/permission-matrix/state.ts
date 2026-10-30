import { conditionableFields, conditionsToRows, rowsToConditions, type ConditionRow } from '@/permissions/fields';
import type { RolePermissionGrant, PermissionInput } from '@/services/role';

export interface GrantDraft {
  fields: string[];
  conditions: ConditionRow[];
  expiresAt: string | null;
  inverted: boolean;
}

export type MatrixState = Record<string, Partial<Record<string, GrantDraft>>>;

/** 把持久化的授予集合整理成 `subject → action` 的草稿状态 */
export function grantsToState(grants: RolePermissionGrant[]): MatrixState {
  const state: MatrixState = {};

  for (const grant of grants) {
    const subject = (state[grant.subject] ??= {});

    subject[grant.action] = {
      fields: [...grant.fields],
      conditions: conditionsToRows(grant.conditions, conditionableFields(grant.subject)),
      expiresAt: grant.expiresAt,
      inverted: grant.inverted,
    };
  }

  return state;
}

/** 把草稿状态转换回服务层接受的权限输入，仅写入非默认限制 */
export function stateToPermissionInput(state: MatrixState): PermissionInput[] {
  const result: PermissionInput[] = [];

  for (const [subject, actions] of Object.entries(state)) {
    if (!actions) {
      continue;
    }

    const inputs: PermissionInput['actions'] = [];

    for (const [action, draft] of Object.entries(actions)) {
      if (!draft) {
        continue;
      }

      const input: PermissionInput['actions'][number] = { action };

      if (draft.fields.length > 0) {
        input.fields = draft.fields;
      }

      const conditions = rowsToConditions(draft.conditions);
      if (conditions !== null) {
        input.conditions = conditions;
      }

      if (draft.expiresAt !== null) {
        input.expiresAt = draft.expiresAt;
      }

      if (draft.inverted === true) {
        input.inverted = true;
      }

      inputs.push(input);
    }

    if (inputs.length > 0) {
      result.push({ subject, actions: inputs });
    }
  }

  return result;
}
