import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import { pendingMigrations, runMigrations } from '@/lib/migrator';
import { sequelize } from '@/models';
import { backupDatabase, pruneBackups } from '@/services/backup';
import { syncPermissionCatalog } from '@/services/permission-catalog';
import RoleService from '@/services/role';

const BACKUP_DIR = '../backups';
const BACKUP_KEEP = 5;

const USAGE = `Usage: db-tools <command>

Commands:
  migrate               Run pending migrations (snapshotting first when needed)
  sync-catalog          Sync the permission catalog and assign the owner
  backup --to <path>    Write a standalone database snapshot to <path>
`;

/** 参数错误：打印用法并以非零状态退出。 */
class UsageError extends Error {}

async function migrate(): Promise<void> {
  const pending = await pendingMigrations(sequelize);

  if (pending.length > 0) {
    // 时间戳文件名既避免 `VACUUM INTO` 覆盖已有文件，也便于按时间清理。
    const stamp = new Date().toISOString().replaceAll(':', '-');
    const target = join(BACKUP_DIR, `database-${stamp}.sqlite`);

    await mkdir(BACKUP_DIR, { recursive: true });
    await backupDatabase(sequelize, target);
    const pruned = await pruneBackups(BACKUP_DIR, BACKUP_KEEP);
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

  const ownerId = await RoleService.assignOwnerToFirstUser();
  console.log(ownerId === null ? 'owner: none (database empty or already assigned)' : `owner: user ${ownerId}`);
}

async function backup(argv: string[]): Promise<void> {
  const flagIndex = argv.indexOf('--to');
  const target = flagIndex === -1 ? undefined : argv[flagIndex + 1];

  if (!target) {
    throw new UsageError('backup requires --to <path>');
  }

  await backupDatabase(sequelize, target);
  console.log(`backup written: ${target}`);
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
      default:
        throw new UsageError(command ? `unknown command: ${command}` : 'missing command');
    }
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(error.message);
      console.error(USAGE);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

void main(process.argv.slice(2));
