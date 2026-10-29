// @vitest-environment node

import { mkdtemp, readdir, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { Sequelize } from 'sequelize';

import { backupDatabase, pruneBackups } from './backup';

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
