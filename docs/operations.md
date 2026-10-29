# 运维手册：备份与恢复

线上布局：每次发布解压到 `$APP_ROOT/releases/<run_id>-<run_attempt>`，`$APP_ROOT/current`
软链到当前生效的版本；`database.sqlite` 与 `.env*` 位于 `$APP_ROOT`，并软链进每个 release。
应用由 pm2 托管，进程名为 `mix`，健康检查为 `GET /api/health`（返回 200）。

## 定时备份

`scripts/backup.sh` 位于 `$APP_ROOT/scripts/backup.sh`（部署后与 `scripts/deploy.sh` 同级）。
脚本进入 `$APP_ROOT/current`，执行 `node db-tools.cjs backup`，把快照写到
`$APP_ROOT/backups/database-<ISO>.sqlite`，并由 `--keep` 清理旧备份。

默认保留 30 份，可用 `BACKUP_KEEP` 覆盖。建议用 cron 每日凌晨执行：

```cron
17 3 * * * APP_ROOT=/path /path/scripts/backup.sh
```

迁移（`node db-tools.cjs migrate`）在需要时也会自动快照，并保留最近 5 份。

## 备份位置与保留数量

- 位置：`$APP_ROOT/backups/`
- 文件名：`database-<UTC ISO 时间戳>.sqlite`
- 手动/定时备份默认保留 30 份（`--keep` / `BACKUP_KEEP`）
- 迁移前自动备份保留 5 份

## 恢复演练

恢复会先校验备份文件的 SQLite 头，校验失败则中止且不触碰现有数据库；校验通过后，
若 `database.sqlite` 已存在，会先复制为 `database.sqlite.pre-restore-<ISO>` 再覆盖。

```bash
cd "$APP_ROOT/current"
pm2 stop mix
node db-tools.cjs restore --from "$APP_ROOT/backups/database-<ISO>.sqlite"
pm2 start mix
curl -f http://127.0.0.1:8085/api/health
```

健康检查失败时回滚：停掉 `mix`，把 `database.sqlite.pre-restore-<ISO>` 复制回
`database.sqlite`，再 `pm2 start mix` 并重新检查 `/api/health`。
