import type { Models } from '@/models';

/** 应用支持的动作，`manage` 为 CASL 的任意动作关键字 */
export type AppActions = 'create' | 'read' | 'update' | 'delete' | 'manage';

/** 应用支持的资源主题，`all` 为 CASL 的任意主题关键字 */
export type AppSubject = keyof Models | 'all';

/** 单条规则上的字段/条件/反转限制 */
export interface RuleNarrowing {
  fields?: string[];
  conditions?: Record<string, unknown>;
  inverted?: boolean;
}

/** 从数据库授权记录归一化后的授予条目 */
export interface AbilityGrant {
  action: string;
  subject: string;
  narrowing: RuleNarrowing;
  expiresAt?: Date | null;
}
