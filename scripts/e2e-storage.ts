/**
 * E2E 数据库存储路径校验
 *
 * 将 DB_STORAGE 解析为绝对路径，并保证它始终落在 `<cwd>/.e2e/` 之内，
 * 这样种子脚本的 `rmSync` 永远不会误删仓库根目录下真实的 `./database.sqlite`。
 * 比较大小写不敏感，以适配 macOS 的 APFS。
 */

import { existsSync, realpathSync } from 'node:fs';
import { dirname, basename, resolve, sep } from 'node:path';

const REJECTED = 'DB_STORAGE 必须指向隔离的 E2E 数据库；拒绝触碰 ./database.sqlite';

function isInside(target: string, root: string): boolean {
  const normalizedTarget = target.toLowerCase();
  const normalizedRoot = root.toLowerCase();

  return normalizedTarget.startsWith(`${normalizedRoot}${sep}`);
}

export function resolveE2eStorage(envValue: string | undefined, cwd: string = process.cwd()): string {
  if (!envValue || envValue.trim() === '') {
    throw new Error(REJECTED);
  }

  const repoRoot = resolve(cwd);
  const e2eRoot = resolve(repoRoot, '.e2e');
  const target = resolve(repoRoot, envValue);

  if (!isInside(target, e2eRoot)) {
    throw new Error(REJECTED);
  }

  // 符号链接防护：父目录存在时，解析出真实路径后仍须留在 .e2e 之内
  const parentDir = dirname(target);

  if (existsSync(parentDir)) {
    const realParent = realpathSync(parentDir);
    const realRoot = existsSync(e2eRoot) ? realpathSync(e2eRoot) : e2eRoot;

    if (!isInside(resolve(realParent, basename(target)), realRoot)) {
      throw new Error(REJECTED);
    }
  }

  return target;
}
