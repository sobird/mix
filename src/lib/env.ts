import { z } from 'zod';

export type NodeEnv = 'development' | 'test' | 'production';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface AppEnv {
  nodeEnv: NodeEnv;
  authSecret: string;
  nextAuthUrl: string | null;
  email: { user: string; pass: string; from: string } | null;
  logLevel: LogLevel;
}

type EnvSource = Record<string, string | undefined>;

const emailKeys = ['EMAIL_SERVER_USER', 'EMAIL_SERVER_PASS', 'EMAIL_FROM'] as const;

const credentialPairs = [
  ['AUTH_GITHUB_ID', 'AUTH_GITHUB_SECRET'],
  ['AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET'],
] as const;

const envZod = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    AUTH_SECRET: z.string({ error: 'AUTH_SECRET is required' }).min(32, 'AUTH_SECRET must be at least 32 characters'),
    NEXTAUTH_URL: z.url('NEXTAUTH_URL must be a valid URL').optional(),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional(),
    EMAIL_SERVER_USER: z.string().min(1).optional(),
    EMAIL_SERVER_PASS: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
    AUTH_GITHUB_ID: z.string().min(1).optional(),
    AUTH_GITHUB_SECRET: z.string().min(1).optional(),
    AUTH_GOOGLE_ID: z.string().min(1).optional(),
    AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    const production = value.NODE_ENV === 'production';

    if (production && value.NEXTAUTH_URL === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['NEXTAUTH_URL'],
        message: 'NEXTAUTH_URL is required in production',
      });
    }

    const emailCount = emailKeys.filter((key) => value[key] !== undefined).length;

    if (production || emailCount > 0) {
      for (const key of emailKeys) {
        if (value[key] === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required when email is configured`,
          });
        }
      }
    }

    for (const [idKey, secretKey] of credentialPairs) {
      const hasId = value[idKey] !== undefined;
      const hasSecret = value[secretKey] !== undefined;

      if (hasId !== hasSecret) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [hasId ? secretKey : idKey],
          message: `${idKey} and ${secretKey} must be provided together`,
        });
      }
    }
  });

export function parseEnv(source: EnvSource): AppEnv {
  const result = envZod.safeParse({
    NODE_ENV: source.NODE_ENV,
    AUTH_SECRET: source.AUTH_SECRET || source.NEXTAUTH_SECRET,
    NEXTAUTH_URL: source.NEXTAUTH_URL || undefined,
    LOG_LEVEL: source.LOG_LEVEL || undefined,
    EMAIL_SERVER_USER: source.EMAIL_SERVER_USER || undefined,
    EMAIL_SERVER_PASS: source.EMAIL_SERVER_PASS || undefined,
    EMAIL_FROM: source.EMAIL_FROM || undefined,
    AUTH_GITHUB_ID: source.AUTH_GITHUB_ID || undefined,
    AUTH_GITHUB_SECRET: source.AUTH_GITHUB_SECRET || undefined,
    AUTH_GOOGLE_ID: source.AUTH_GOOGLE_ID || undefined,
    AUTH_GOOGLE_SECRET: source.AUTH_GOOGLE_SECRET || undefined,
  });

  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue.path.join('.');

    throw new Error(`${path}: ${issue.message}`);
  }

  const value = result.data;
  const production = value.NODE_ENV === 'production';
  const email =
    value.EMAIL_SERVER_USER !== undefined && value.EMAIL_SERVER_PASS !== undefined && value.EMAIL_FROM !== undefined
      ? { user: value.EMAIL_SERVER_USER, pass: value.EMAIL_SERVER_PASS, from: value.EMAIL_FROM }
      : null;

  return {
    nodeEnv: value.NODE_ENV,
    authSecret: value.AUTH_SECRET,
    nextAuthUrl: value.NEXTAUTH_URL ?? null,
    email,
    logLevel: value.LOG_LEVEL ?? (production ? 'info' : 'debug'),
  };
}

export function loadEnv(source: EnvSource = process.env): AppEnv {
  return parseEnv(source);
}
