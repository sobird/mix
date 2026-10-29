import { copyFile, mkdir, open, readdir, stat, unlink } from 'node:fs/promises';
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
 * `isCandidate` 可限制参与清理的文件名；目录中其余文件（例如用户放进备份目录的
 * 其他文件）不会被删除。默认接受全部文件，保持原有行为。
 *
 * 备份目录不存在时视为没有备份，返回 0。
 */
export async function pruneBackups(
  dir: string,
  keep: number,
  isCandidate: (name: string) => boolean = () => true,
): Promise<number> {
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
    names.filter(isCandidate).map(async (name) => {
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

/** SQLite 数据库文件固定以这 16 个字节开头。 */
const SQLITE_HEADER = Buffer.from('SQLite format 3\0');

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

/**
 * 用 `from` 处的备份覆盖 `target`。
 *
 * 先校验备份文件的 SQLite 头，校验失败直接抛错且不触碰 `target`；校验通过后，
 * 若 `target` 已存在则先复制为 `target.pre-restore-<ISO>`，再写回备份内容。
 */
export async function restoreDatabase(from: string, target: string): Promise<void> {
  const handle = await open(from, 'r');

  try {
    const header = Buffer.alloc(SQLITE_HEADER.length);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);

    if (bytesRead !== SQLITE_HEADER.length || !header.equals(SQLITE_HEADER)) {
      throw new Error(`not a SQLite database: ${from}`);
    }
  } finally {
    await handle.close();
  }

  if (await pathExists(target)) {
    const stamp = new Date().toISOString().replaceAll(':', '-');
    await copyFile(target, `${target}.pre-restore-${stamp}`);
  }

  await mkdir(dirname(target), { recursive: true });
  await copyFile(from, target);
}
