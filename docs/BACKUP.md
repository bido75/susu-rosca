# Database Backups

SusuFlow's PostgreSQL database is backed up automatically by a dedicated `backups` service in
`docker-compose.yml`. It runs on a schedule (default `@daily`), rotates retention, and survives
reboots (Docker Desktop auto-start + `restart: unless-stopped`).

## How it works

- The `backups` service uses the official `prodrigestivill/postgres-backup-local` image, which
  runs inside the Compose network and dumps the `susuflow` database to a named `backups` volume.
- On each run it writes:
  - `daily/susuflow-YYYYMMDD.sql.gz`
  - `weekly/susuflow-YYYYWW.sql.gz` (replaced weekly)
  - `monthly/susuflow-YYYYMM.sql.gz` (replaced monthly)
  - `last/susuflow-YYYYMMDD-HHMMSS.sql.gz` (every backup)
  - plus `-latest.sql.gz` symlinks.
- Retention prunes old files per `BACKUP_KEEP_DAYS`, `BACKUP_KEEP_WEEKS`, `BACKUP_KEEP_MONTHS`.

## Schedule & retention

Configure via environment in `docker-compose.yml`:

| Variable | Default | Meaning |
|---|---|---|
| `SCHEDULE` | `@daily` | Cron expression (e.g. `@hourly`, `@daily`, `0 3 * * *`) |
| `BACKUP_KEEP_DAYS` | `7` | Keep daily backups for this many days |
| `BACKUP_KEEP_WEEKS` | `4` | Keep weekly backups for this many weeks |
| `BACKUP_KEEP_MONTHS` | `3` | Keep monthly backups for this many months |

## Trigger an immediate backup

```bash
docker exec susuflow-beta-backups-1 sh -lc 'backup_rotate && /backup.sh'
```

## Restore

Into a fresh database (empty `susuflow` DB):

```bash
# Stop the app so nothing writes during restore
docker compose stop app

# Copy the latest dump out of the backups container
docker cp susuflow-beta-backups-1:/backups/last/susuflow-latest.sql.gz ./restore.sql.gz

# Restore into the db container
docker exec -i susuflow-beta-db-1 sh -c 'zcat > /tmp/restore.sql' < ./restore.sql.gz
docker exec susuflow-beta-db-1 psql -U susuflow -d susuflow -f /tmp/restore.sql

docker compose start app
```

## Off-machine storage

The `backups` volume lives on this single host. For disaster recovery, the dumps are mirrored
off-machine to **encrypted Nextcloud** storage automatically each day.

- `scripts/backup-offsite.ps1` copies the latest DB dump + the `evidence` volume to an
  `rclone` `crypt` remote (`backupcrypt` → Nextcloud WebDAV). Files are encrypted **before**
  they leave this machine, so Nextcloud admins only ever see ciphertext.
- A Windows scheduled task `SusuFlowOffsiteBackup` runs it daily at 03:30 (`schtasks /Query /TN SusuFlowOffsiteBackup`).

### Requirements

- `rclone` installed (`~/.local/bin/rclone.exe`) with a `nextcloud` (webdav) and `backupcrypt` (crypt)
  remote configured in `~/.config/rclone/rclone.conf`.
- Nextcloud URL, a dedicated `backup` user, and its app password (used to build the config locally).

### Manual run

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/backup-offsite.ps1
```

### Restore from Nextcloud

```powershell
rclone copy backupcrypt:latest ./restore-stage
```

The DB dump is `restore-stage/susuflow-latest.sql.gz`; evidence is under `restore-stage/evidence/`.