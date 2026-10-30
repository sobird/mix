// @vitest-environment node

import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { resolveE2eStorage } from './e2e-storage';

const CWD = '/tmp/mix-e2e-storage-test/repo';
const MESSAGE = 'DB_STORAGE 必须指向隔离的 E2E 数据库；拒绝触碰 ./database.sqlite';

describe('resolveE2eStorage', () => {
  it('throws when DB_STORAGE is unset', () => {
    expect(() => resolveE2eStorage(undefined, CWD)).toThrow(MESSAGE);
  });

  it('throws on an empty DB_STORAGE', () => {
    expect(() => resolveE2eStorage('', CWD)).toThrow(MESSAGE);
  });

  it('rejects the default database via its relative alias', () => {
    expect(() => resolveE2eStorage('./database.sqlite', CWD)).toThrow(MESSAGE);
  });

  it('rejects the default database via its bare name', () => {
    expect(() => resolveE2eStorage('database.sqlite', CWD)).toThrow(MESSAGE);
  });

  it('rejects the default database via an absolute repo path', () => {
    expect(() => resolveE2eStorage(resolve(CWD, 'database.sqlite'), CWD)).toThrow(MESSAGE);
  });

  it('rejects a path that escapes .e2e with ..', () => {
    expect(() => resolveE2eStorage('./.e2e/../database.sqlite', CWD)).toThrow(MESSAGE);
  });

  it('rejects case variants of the default database', () => {
    expect(() => resolveE2eStorage('Database.sqlite', CWD)).toThrow(MESSAGE);
  });

  it('rejects case variants that escape .e2e', () => {
    expect(() => resolveE2eStorage('./.E2E/../Database.sqlite', CWD)).toThrow(MESSAGE);
  });

  it('accepts a database directly under .e2e', () => {
    expect(resolveE2eStorage('./.e2e/database.sqlite', CWD)).toBe(resolve(CWD, '.e2e/database.sqlite'));
  });

  it('accepts nested databases under .e2e', () => {
    expect(resolveE2eStorage('./.e2e/nested/db.sqlite', CWD)).toBe(resolve(CWD, '.e2e/nested/db.sqlite'));
  });

  it('accepts case variants of the .e2e directory', () => {
    expect(resolveE2eStorage('./.E2E/database.sqlite', CWD)).toBe(resolve(CWD, '.E2E/database.sqlite'));
  });

  it('rejects symlinked parents that escape .e2e', () => {
    const root = mkdtempSync(join(tmpdir(), 'e2e-storage-'));
    const repo = join(root, 'repo');
    const e2e = join(repo, '.e2e');
    const outside = join(root, 'outside');

    mkdirSync(e2e, { recursive: true });
    mkdirSync(outside, { recursive: true });
    symlinkSync(outside, join(e2e, 'link'));

    try {
      expect(() => resolveE2eStorage('./.e2e/link/db.sqlite', repo)).toThrow(MESSAGE);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
