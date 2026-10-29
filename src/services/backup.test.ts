// @vitest-environment node

import { mkdtemp, readFile, readdir, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Sequelize } from 'sequelize';

import { backupDatabase, pruneBackups, restoreDatabase } from './backup';

async function makeTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'mix-backup-'));
}

describe('pruneBackups', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await makeTempDir();
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('prunes old backups keeping the newest N', async () => {
    await Promise.all(
      Array.from({ length: 7 }, (_, index) => index).map(async (index) => {
        const file = join(dir, `database-${index}.sqlite`);
        await writeFile(file, `backup ${index}`);
        // 显式设置 mtime，避免同一毫秒内创建导致排序不确定
        await utimes(file, index + 1000, index + 1000);
      }),
    );

    expect(await pruneBackups(dir, 5)).toBe(2);
    expect((await readdir(dir)).sort()).toEqual([
      'database-2.sqlite',
      'database-3.sqlite',
      'database-4.sqlite',
      'database-5.sqlite',
      'database-6.sqlite',
    ]);
  });

  it('returns zero when the directory does not exist', async () => {
    expect(await pruneBackups(join(dir, 'missing'), 5)).toBe(0);
  });

  it('leaves non-matching files alone when given a candidate predicate', async () => {
    const names = ['a.zip', 'b.sqlite', 'c.txt', 'database-1.sqlite', 'database-2.sqlite', 'database-3.sqlite'];

    await Promise.all(
      names.map(async (name, index) => {
        const file = join(dir, name);
        await writeFile(file, String(index));
        await utimes(file, index + 1000, index + 1000);
      }),
    );

    expect(await pruneBackups(dir, 1, (name) => /^database-.*\.sqlite$/.test(name))).toBe(2);
    expect((await readdir(dir)).sort()).toEqual(['a.zip', 'b.sqlite', 'c.txt', 'database-3.sqlite']);
  });
});

describe('restoreDatabase', () => {
  it('restores a valid backup and keeps a pre-restore copy', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mix-restore-'));
    const target = join(dir, 'database.sqlite');
    const backup = join(dir, 'backup.sqlite');
    await writeFile(target, 'old');
    await writeFile(backup, Buffer.concat([Buffer.from('SQLite format 3\0'), Buffer.from('new')]));
    await restoreDatabase(backup, target);
    expect(await readFile(target, 'utf8')).toBe('SQLite format 3\0new');
    expect((await readdir(dir)).some((name) => name.startsWith('database.sqlite.pre-restore-'))).toBe(true);
  });

  it('refuses a corrupt backup and leaves the target untouched', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mix-restore-'));
    const target = join(dir, 'database.sqlite');
    const backup = join(dir, 'backup.sqlite');
    await writeFile(target, 'keep-me');
    await writeFile(backup, 'not-a-database');
    // oxlint-disable-next-line vitest/require-to-throw-message
    await expect(restoreDatabase(backup, target)).rejects.toThrow();
    expect(await readFile(target, 'utf8')).toBe('keep-me');
  });

  it('prunes older backups and keeps the newest', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mix-backups-'));
    for (let i = 0; i < 7; i += 1) {
      const file = join(dir, `db-${i}.sqlite`);
      // 顺序写入并设置 mtime，保证保留最新的判定稳定
      // oxlint-disable-next-line no-await-in-loop
      await writeFile(file, String(i));
      // oxlint-disable-next-line no-await-in-loop
      await utimes(file, new Date(2026, 0, i + 1), new Date(2026, 0, i + 1));
    }
    expect(await pruneBackups(dir, 5)).toBe(2);
    expect(await readdir(dir)).toContain('db-6.sqlite');
  });
});

describe('backupDatabase', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await makeTempDir();
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('writes a standalone sqlite snapshot', async () => {
    const source = new Sequelize({
      dialect: 'sqlite',
      storage: join(dir, 'source.sqlite'),
      logging: false,
    });
    const targetPath = join(dir, 'nested', 'snapshot.sqlite');

    try {
      await source.query('CREATE TABLE note (id INTEGER PRIMARY KEY, body TEXT)');
      await source.query("INSERT INTO note (body) VALUES ('hello')");

      await backupDatabase(source, targetPath);
    } finally {
      await source.close();
    }

    const snapshot = new Sequelize({ dialect: 'sqlite', storage: targetPath, logging: false });

    try {
      const [rows] = await snapshot.query('SELECT body FROM note');
      expect(rows).toEqual([{ body: 'hello' }]);
    } finally {
      await snapshot.close();
    }
  });
});
