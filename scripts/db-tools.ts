import { constants } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { pendingMigrations, runMigrations } from '@/lib/migrator';
import { sequelize } from '@/models';
import { backupDatabase, pruneBackups, restoreDatabase } from '@/services/backup';
import { syncMenuCatalog } from '@/services/menu-catalog';
import { syncPermissionCatalog } from '@/services/permission-catalog';
import RoleService from '@/services/role';

// 手动/定时备份默认写入当前目录的 ../backups（即 $APP_ROOT/backups）。
const BACKUP_DIR = '../backups';
// 迁移在 release 目录内执行，需要显式定位到 $APP_ROOT/backups 才能与手动备份共用同一处。
const MIGRATE_BACKUP_DIR = process.env.APP_ROOT ? join(process.env.APP_ROOT, 'backups') : BACKUP_DIR;
// 迁移前的自动快照保留 5 份；手动备份默认保留更多。
const BACKUP_KEEP = 5;
const MANUAL_BACKUP_KEEP = 30;

/** 只清理本工具写出的快照，避免误删备份目录里的其他文件。 */
const SNAPSHOT_NAME = /^database-.*\.sqlite$/;

const isSnapshot = (name: string): boolean => SNAPSHOT_NAME.test(name);

const USAGE = `Usage: db-tools <command>

Commands:
  migrate                     Run pending migrations (snapshotting first when needed)
  sync-catalog                Sync the permission and menu catalogs, then assign the owner
  backup [--to <path>]        Write a standalone database snapshot (default ${BACKUP_DIR})
         [--keep <n>]         Keep the newest <n> snapshots (default ${MANUAL_BACKUP_KEEP})
  restore --from <path>       Restore a snapshot onto ./database.sqlite
`;

/** 参数错误：打印用法并以非零状态退出。 */
class UsageError extends Error {}

/** 运行时错误：只打印消息并以非零状态退出（不打印用法）。 */
class CliError extends Error {}

async function migrate(): Promise<void> {
  const pending = await pendingMigrations(sequelize);

  if (pending.length > 0) {
    // 时间戳文件名既避免 `VACUUM INTO` 覆盖已有文件，也便于按时间清理。
    const stamp = new Date().toISOString().replaceAll(':', '-');
    const target = join(MIGRATE_BACKUP_DIR, `database-${stamp}.sqlite`);

    await mkdir(MIGRATE_BACKUP_DIR, { recursive: true });
    await backupDatabase(sequelize, target);
    const pruned = await pruneBackups(MIGRATE_BACKUP_DIR, BACKUP_KEEP, isSnapshot);
    console.log(`backup written: ${target} (pruned ${pruned})`);
  }

  const executed = await runMigrations(sequelize);
  console.log(`migrations executed: ${executed.length}`);
  executed.forEach((name) => console.log(`- ${name}`));
}

async function syncCatalog(): Promise<void> {
  const catalog = await syncPermissionCatalog();
  console.log(`catalog permissions created: ${catalog.permissions}`);
  console.log(`builtin grants: ${catalog.grants}`);

  const menuCatalog = await syncMenuCatalog();
  console.log(`catalog menus created: ${menuCatalog.menus}`);

  const ownerId = await RoleService.assignOwnerToFirstUser();
  console.log(ownerId === null ? 'owner: none (database empty or already assigned)' : `owner: user ${ownerId}`);
}

/** 读取 `--flag <value>` 形式的参数，未出现时返回 undefined。 */
function readFlag(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  const value = argv[index + 1];

  if (value === undefined || value.startsWith('--')) {
    throw new UsageError(`${flag} requires a value`);
  }

  return value;
}

/** `--keep` 只接受严格的正整数，拒绝 0、负数、`5x`、`3.7` 等。 */
function parseKeep(value: string): number {
  if (!/^[1-9][0-9]*$/.test(value)) {
    throw new UsageError('--keep requires a positive integer');
  }

  return Number(value);
}

async function backup(argv: string[]): Promise<void> {
  const stamp = new Date().toISOString().replaceAll(':', '-');
  const target = readFlag(argv, '--to') ?? join(BACKUP_DIR, `database-${stamp}.sqlite`);
  const keepFlag = readFlag(argv, '--keep');
  const keep = keepFlag === undefined ? MANUAL_BACKUP_KEEP : parseKeep(keepFlag);

  await backupDatabase(sequelize, target);
  const pruned = await pruneBackups(dirname(target), keep, isSnapshot);
  console.log(`backup written: ${target} (pruned ${pruned})`);
}

async function restore(argv: string[]): Promise<void> {
  const from = readFlag(argv, '--from');

  if (!from) {
    throw new UsageError('restore requires --from <path>');
  }

  try {
    await access(from, constants.R_OK);
  } catch {
    throw new CliError(`restore: cannot read ${from}`);
  }

  await restoreDatabase(from, './database.sqlite');
  console.log(`database restored from: ${from}`);
}

async function main(argv: string[]): Promise<void> {
  const [command, ...rest] = argv;

  try {
    switch (command) {
      case 'migrate':
        await migrate();
        break;
      case 'sync-catalog':
        await syncCatalog();
        break;
      case 'backup':
        await backup(rest);
        break;
      case 'restore':
        await restore(rest);
        break;
      default:
        throw new UsageError(command ? `unknown command: ${command}` : 'missing command');
    }
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(error.message);
      console.error(USAGE);
    } else if (error instanceof CliError) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

void main(process.argv.slice(2));
