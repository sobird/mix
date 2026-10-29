// @vitest-environment node
// The brief requires these assertions verbatim; error shaping is covered by env.ts.
// oxlint-disable vitest/require-to-throw-message

import { parseEnv } from './env';

const base = {
  AUTH_SECRET: 'x'.repeat(32),
  NEXTAUTH_URL: 'https://mix.example.com',
  EMAIL_SERVER_USER: 'bot@mix.local',
  EMAIL_SERVER_PASS: 'secret',
  EMAIL_FROM: 'bot@mix.local',
};

it('parses a production environment', () => {
  const env = parseEnv({ ...base, NODE_ENV: 'production' });

  expect(env.nodeEnv).toBe('production');
  expect(env.logLevel).toBe('info');
  expect(env.email?.from).toBe('bot@mix.local');
});
it('defaults to debug logging in development', () => {
  expect(parseEnv({ AUTH_SECRET: 'x'.repeat(32), NODE_ENV: 'development' }).logLevel).toBe('debug');
});
it('rejects a missing or short secret', () => {
  expect(() => parseEnv({ NODE_ENV: 'development' })).toThrow();
  expect(() => parseEnv({ AUTH_SECRET: 'short', NODE_ENV: 'development' })).toThrow();
});
it('requires public url and mail settings in production', () => {
  expect(() => parseEnv({ ...base, NEXTAUTH_URL: undefined, NODE_ENV: 'production' })).toThrow();
  expect(() => parseEnv({ ...base, EMAIL_FROM: undefined, NODE_ENV: 'production' })).toThrow();
});
it('rejects an unknown log level', () => {
  expect(() => parseEnv({ ...base, LOG_LEVEL: 'verbose', NODE_ENV: 'production' })).toThrow();
});
it('requires both GitHub credentials when either is set', () => {
  expect(() => parseEnv({ ...base, AUTH_GITHUB_ID: 'id', NODE_ENV: 'production' })).toThrow();
});
