/**
 * 角色校验schema
 *
 * sobird<i@sobird.me> at 2023/12/11 22:03:55 created.
 */

import { z } from 'zod';

import { conditionableFields, restrictableFields, type FieldMeta } from '@/permissions/fields';
import type { PermissionInput } from '@/services/role';

import { createFormRule } from '.';

export const RoleFormZod = z.object({
  id: z.number().optional(),
  name: z
    .string({
      error: (issue) => {
        return issue.input === undefined ? '角色名称不能为空' : '角色名称长度为3-12个字符';
      },
    })
    .min(3, '角色名称长度不能少于3个字符')
    .max(24, '角色名称长度不能大于24个字符'),
  description: z.string().nullish(),
  parentId: z.number().int().optional(),
});

export type RoleFormAttributes = z.infer<typeof RoleFormZod>;

export const RoleFormRule = createFormRule(RoleFormZod);

const PermissionGrantZod = z.object({
  action: z.enum(['create', 'read', 'update', 'delete', 'manage']),
  fields: z.array(z.string()).optional(),
  conditions: z.record(z.string(), z.unknown()).optional(),
  expiresAt: z.string().nullable().optional(),
  inverted: z.boolean().optional(),
});

const PermissionInputBaseZod = z.array(
  z.object({
    subject: z.enum(['User', 'Role', 'Permission', 'all']),
    actions: z.array(PermissionGrantZod),
  }),
);

/** 保存角色权限的入参校验：字段与条件都必须落在各 subject 的元数据白名单内 */
export const PermissionInputZod: z.ZodType<PermissionInput[]> = PermissionInputBaseZod.superRefine(
  (permissions, ctx) => {
    permissions.forEach((permission, permissionIndex) => {
      const { subject } = permission;
      const restrictable = new Set(restrictableFields(subject).map((field) => field.name));
      const conditionable = new Map(conditionableFields(subject).map((field) => [field.name, field]));

      permission.actions.forEach((grant, actionIndex) => {
        const path: (string | number)[] = [permissionIndex, 'actions', actionIndex];

        if (grant.expiresAt != null && Number.isNaN(Date.parse(grant.expiresAt))) {
          ctx.addIssue({ code: 'custom', message: '过期时间格式不正确', path: [...path, 'expiresAt'] });
        }

        if (subject === 'all') {
          if (grant.action !== 'manage') {
            ctx.addIssue({ code: 'custom', message: '全选授权只允许 manage', path: [...path, 'action'] });
          }
          if (grant.fields !== undefined) {
            ctx.addIssue({ code: 'custom', message: '全选授权不支持字段限制', path: [...path, 'fields'] });
          }
          if (grant.conditions !== undefined) {
            ctx.addIssue({ code: 'custom', message: '全选授权不支持条件', path: [...path, 'conditions'] });
          }
          return;
        }

        if (grant.fields !== undefined) {
          if (grant.action === 'create' || grant.action === 'delete') {
            ctx.addIssue({ code: 'custom', message: '该动作不支持字段限制', path: [...path, 'fields'] });
          } else {
            for (const name of grant.fields) {
              if (!restrictable.has(name)) {
                ctx.addIssue({ code: 'custom', message: `未知字段 ${name}`, path: [...path, 'fields'] });
              }
            }
          }
        }

        if (grant.conditions !== undefined) {
          if (grant.action === 'create') {
            ctx.addIssue({ code: 'custom', message: '创建动作不支持条件', path: [...path, 'conditions'] });
          } else {
            for (const [name, value] of Object.entries(grant.conditions)) {
              const field = conditionable.get(name);
              if (!field) {
                ctx.addIssue({ code: 'custom', message: `未知条件字段 ${name}`, path: [...path, 'conditions', name] });
                continue;
              }
              if (!isConditionValueValid(field, value)) {
                ctx.addIssue({
                  code: 'custom',
                  message: `条件字段 ${name} 取值不合法`,
                  path: [...path, 'conditions', name],
                });
              }
            }
          }
        }
      });
    });
  },
);

function isConditionValueValid(field: FieldMeta, value: unknown): boolean {
  if (isScalar(value)) {
    return matchesKind(field, value);
  }

  if (!isPlainObject(value)) {
    return false;
  }

  const keys = Object.keys(value);
  if (keys.length !== 1) {
    return false;
  }

  const [operator] = keys;
  if (operator === '$ne') {
    return isScalar(value.$ne) && matchesKind(field, value.$ne);
  }

  if (operator === '$in' || operator === '$nin') {
    if (field.kind === 'boolean') {
      return false;
    }
    const list = value[operator];
    return Array.isArray(list) && list.every((item) => matchesKind(field, item));
  }

  return false;
}

function isScalar(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function matchesKind(field: FieldMeta, value: unknown): boolean {
  switch (field.kind) {
    case 'boolean':
      return typeof value === 'boolean';
    case 'number':
      return typeof value === 'number';
    case 'string':
      return typeof value === 'string';
    case 'enum':
      return typeof value === 'string' && (field.options ?? []).some((option) => option.value === value);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
