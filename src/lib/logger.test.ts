// @vitest-environment node

import { resolveLogLevel } from './logger';

it('uses LOG_LEVEL when valid', () => {
  expect(resolveLogLevel({ LOG_LEVEL: 'warn' })).toBe('warn');
});
it('defaults to info in production and debug elsewhere', () => {
  expect(resolveLogLevel({ NODE_ENV: 'production' })).toBe('info');
  expect(resolveLogLevel({ NODE_ENV: 'development' })).toBe('debug');
});
it('falls back instead of throwing on an invalid value', () => {
  expect(resolveLogLevel({ LOG_LEVEL: 'verbose', NODE_ENV: 'production' })).toBe('info');
});
