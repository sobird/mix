# 运维手册：备份与恢复

线上布局：每次发布解压到 `$APP_ROOT/releases/<run_id>-<run_attempt>`，`$APP_ROOT/current`
软链到当前生效的版本；`database.sqlite` 与 `.env*` 位于 `$APP_ROOT`，并软链进每个 release。
应用由 pm2 托管，进程名为 `mix`，健康检查为 `GET /api/health`（返回 200）。部署脚本默认以
`APP_PORT=8085` 启动应用并探测该端口，端口可通过 `APP_PORT` 覆盖。

## 备份位置与保留数量

所有快照都写入 `$APP_ROOT/backups/`，手动/定时备份和迁移前自动快照共用这一处：

- 手动/定时备份（`scripts/backup.sh` 或 `node db-tools.cjs backup`）：文件名
  `database-<时间戳>.sqlite`。`backup.sh` 使用紧凑的 UTC 时间戳 `%Y%m%dT%H%M%SZ`
  （例如 `database-20261029T031700Z.sqlite`；对应 `date -u +%Y%m%dT%H%M%SZ`），
  `db-tools backup` 的默认目标则使用 ISO 时间戳（`:` 替换为 `-`）。
- 迁移前自动快照（`node db-tools.cjs migrate`）：同一目录，文件名 `database-<ISO 时间戳>.sqlite`。
- 手动/定时备份默认保留 30 份（`--keep` 或 `BACKUP_KEEP` 覆盖）：每日备份保留约一个月的恢复点。
- 迁移前自动快照保留 5 份：迁移不常执行，5 份足以覆盖最近几次迁移的回滚窗口，又不会堆满磁盘。

## 定时备份

`scripts/backup.sh` 位于 `$APP_ROOT/scripts/backup.sh`（部署后与 `scripts/deploy.sh` 同级）。
脚本进入 `$APP_ROOT/current`，执行 `node db-tools.cjs backup`，把快照写到
`$APP_ROOT/backups/database-<时间戳>.sqlite`，并用 `--keep` 清理旧备份。建议用 cron 每日凌晨执行：

```cron
17 3 * * * APP_ROOT=/path /path/scripts/backup.sh
```

## 恢复演练

恢复会先校验备份文件的 SQLite 头，校验失败则中止且不触碰现有数据库。恢复在覆盖前会把当前数据库
复制为 `database.sqlite.pre-restore-<ISO>`（紧邻 `database.sqlite`），便于失败时回滚。

```bash
APP_ROOT=/path
cd "$APP_ROOT/current"
pm2 stop mix
node db-tools.cjs restore --from "$APP_ROOT/backups/database-<时间戳>.sqlite"
pm2 start mix
curl -f "http://127.0.0.1:${APP_PORT:-8085}/api/health"
```

健康检查失败时回滚：停掉 `mix`，把 `database.sqlite.pre-restore-<ISO>` 复制回
`database.sqlite`，再 `pm2 start mix` 并重新检查 `/api/health`。
