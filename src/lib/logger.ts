import type { LogLevel } from './env';

export type { LogLevel };

const LOG_LEVELS: readonly LogLevel[] = ['error', 'warn', 'info', 'debug'];

function isValidLogLevel(value: string | undefined): value is LogLevel {
  return value !== undefined && (LOG_LEVELS as readonly string[]).includes(value);
}

export function resolveLogLevel(source: Record<string, string | undefined>): LogLevel {
  const level = source.LOG_LEVEL;

  if (isValidLogLevel(level)) {
    return level;
  }

  return source.NODE_ENV === 'production' ? 'info' : 'debug';
}
