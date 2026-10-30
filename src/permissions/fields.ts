export type FieldKind = 'boolean' | 'number' | 'enum' | 'string';

export interface FieldMeta {
  name: string;
  label: string;
  kind: FieldKind;
  options?: { value: string; label: string }[];
}

export type ConditionOperator = 'eq' | 'ne' | 'in' | 'nin';

export interface ConditionRow {
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean | Array<string | number>;
}

interface SubjectFieldMeta {
  restrictable: FieldMeta[];
  conditionable: FieldMeta[];
}

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'unknown', label: '未知' },
];

const ACTION_OPTIONS = [
  { value: 'create', label: '创建' },
  { value: 'read', label: '查看' },
  { value: 'update', label: '更新' },
  { value: 'delete', label: '删除' },
  { value: 'manage', label: '管理' },
];

const SUBJECT_OPTIONS = [
  { value: 'User', label: '用户' },
  { value: 'Role', label: '角色' },
  { value: 'Permission', label: '权限' },
  { value: 'all', label: '全部' },
];

/** 各 subject 可限制与可用于条件的字段，顺序即界面展示顺序 */
const SUBJECT_FIELD_META: Record<string, SubjectFieldMeta> = {
  User: {
    restrictable: [
      { name: 'username', label: '用户名', kind: 'string' },
      { name: 'email', label: '邮箱', kind: 'string' },
      { name: 'nickname', label: '用户昵称', kind: 'string' },
      { name: 'realname', label: '真实姓名', kind: 'string' },
      { name: 'mobile', label: '手机号码', kind: 'string' },
      { name: 'gender', label: '性别', kind: 'enum', options: GENDER_OPTIONS },
      { name: 'status', label: '状态', kind: 'boolean' },
      { name: 'createdBy', label: '创建人', kind: 'number' },
      { name: 'updatedBy', label: '更新人', kind: 'number' },
      { name: 'roles', label: '角色', kind: 'string' },
    ],
    conditionable: [
      { name: 'id', label: 'ID', kind: 'number' },
      { name: 'status', label: '状态', kind: 'boolean' },
      { name: 'gender', label: '性别', kind: 'enum', options: GENDER_OPTIONS },
      { name: 'createdBy', label: '创建人', kind: 'number' },
    ],
  },
  Role: {
    restrictable: [
      { name: 'name', label: '名称', kind: 'string' },
      { name: 'description', label: '备注', kind: 'string' },
      { name: 'isBuiltin', label: '内置', kind: 'boolean' },
      { name: 'isDefault', label: '默认', kind: 'boolean' },
      { name: 'editable', label: '可编辑', kind: 'boolean' },
      { name: 'defaultable', label: '可设默认', kind: 'boolean' },
      { name: 'parentId', label: '父级 ID', kind: 'number' },
    ],
    conditionable: [
      { name: 'id', label: 'ID', kind: 'number' },
      { name: 'isBuiltin', label: '内置', kind: 'boolean' },
      { name: 'isDefault', label: '默认', kind: 'boolean' },
      { name: 'parentId', label: '父级 ID', kind: 'number' },
    ],
  },
  Permission: {
    restrictable: [
      { name: 'name', label: '名称', kind: 'string' },
      { name: 'description', label: '备注', kind: 'string' },
      { name: 'action', label: '动作', kind: 'enum', options: ACTION_OPTIONS },
      { name: 'subject', label: '主题', kind: 'enum', options: SUBJECT_OPTIONS },
    ],
    conditionable: [
      { name: 'id', label: 'ID', kind: 'number' },
      { name: 'action', label: '动作', kind: 'enum', options: ACTION_OPTIONS },
      { name: 'subject', label: '主题', kind: 'enum', options: SUBJECT_OPTIONS },
    ],
  },
};

/** 可做字段限制的字段；未知 subject（含 all）返回空数组 */
export function restrictableFields(subject: string): FieldMeta[] {
  return SUBJECT_FIELD_META[subject]?.restrictable ?? [];
}

/** 可参与数据条件的字段；未知 subject（含 all）返回空数组 */
export function conditionableFields(subject: string): FieldMeta[] {
  return SUBJECT_FIELD_META[subject]?.conditionable ?? [];
}

/** 条件行转条件对象；空行返回 null，重复字段以最后一行为准 */
export function rowsToConditions(rows: ConditionRow[]): Record<string, unknown> | null {
  if (rows.length === 0) {
    return null;
  }

  const conditions: Record<string, unknown> = {};
  for (const row of rows) {
    switch (row.operator) {
      case 'eq':
        conditions[row.field] = row.value;
        break;
      case 'ne':
        conditions[row.field] = { $ne: row.value };
        break;
      case 'in':
        conditions[row.field] = { $in: row.value };
        break;
      case 'nin':
        conditions[row.field] = { $nin: row.value };
        break;
    }
  }

  return conditions;
}

/** 按 fields 元数据顺序把条件对象还原成条件行，仅识别标量与 $ne/$in/$nin */
export function conditionsToRows(
  conditions: Record<string, unknown> | null | undefined,
  fields: FieldMeta[],
): ConditionRow[] {
  if (!conditions) {
    return [];
  }

  const rows: ConditionRow[] = [];
  for (const field of fields) {
    if (!(field.name in conditions)) {
      continue;
    }

    const row = toConditionRow(field.name, conditions[field.name]);
    if (row) {
      rows.push(row);
    }
  }

  return rows;
}

function toConditionRow(field: string, value: unknown): ConditionRow | null {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return { field, operator: 'eq', value };
  }

  if (!isPlainObject(value)) {
    return null;
  }

  if ('$ne' in value) {
    const operand = value.$ne;
    if (typeof operand === 'string' || typeof operand === 'number' || typeof operand === 'boolean') {
      return { field, operator: 'ne', value: operand };
    }
    return null;
  }

  if ('$in' in value) {
    return Array.isArray(value.$in) ? { field, operator: 'in', value: value.$in as Array<string | number> } : null;
  }

  if ('$nin' in value) {
    return Array.isArray(value.$nin) ? { field, operator: 'nin', value: value.$nin as Array<string | number> } : null;
  }

  return null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
