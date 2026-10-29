import { mkdir, readdir, stat, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { Sequelize } from 'sequelize';

/**
 * 使用 `VACUUM INTO` 写出一份独立的 SQLite 快照。
 *
 * 目标父目录不存在时自动创建；`VACUUM INTO` 遇到已存在的目标文件会报错，
 * 因此调用方应传入带时间戳的文件名。
 */
export async function backupDatabase(sequelize: Sequelize, targetPath: string): Promise<void> {
  await mkdir(dirname(targetPath), { recursive: true });

  const target = sequelize.escape(targetPath);
  await sequelize.query(`VACUUM INTO ${target}`);
}

/**
 * 仅保留 mtime 最新的 `keep` 份备份，删除其余文件并返回删除数量。
 *
 * 备份目录不存在时视为没有备份，返回 0。
 */
export async function pruneBackups(dir: string, keep: number): Promise<number> {
  let names: string[];

  try {
    names = await readdir(dir);
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return 0;
    }
    throw error;
  }

  const files = await Promise.all(
    names.map(async (name) => {
      const path = join(dir, name);
      const info = await stat(path);
      return info.isFile() ? { path, mtimeMs: info.mtimeMs } : null;
    }),
  );

  const sorted = files
    .filter((file): file is { path: string; mtimeMs: number } => file !== null)
    .sort((left, right) => right.mtimeMs - left.mtimeMs);

  const stale = sorted.slice(Math.max(keep, 0));

  await Promise.all(stale.map((file) => unlink(file.path)));

  return stale.length;
}
