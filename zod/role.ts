/**
 * 角色校验schema
 *
 * sobird<i@sobird.me> at 2023/12/11 22:03:55 created.
 */

import { z } from 'zod';
import { zodToRule } from '.';

export const RoleZod = z.object({
  id: z.string().cuid().optional(),
  name: z.string({
    invalid_type_error: '角色名称长度为3-12个字符',
    required_error: '角色名称不能为空',
  }).min(3, '角色名称长度不能少于3个字符').max(24, '角色名称长度不能大于24个字符'),
  description: z.string().nullish(),
  parentId: z.number().int().nullish(),
});

export const ZodRule = zodToRule(RoleZod);

export type RoleFormAttributes = z.infer<typeof RoleZod>;
