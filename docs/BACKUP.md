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

The `backups` volume lives on this single host. For disaster recovery, copy dumps off-machine
(e.g. to object storage) on your own schedule:

```bash
docker cp susuflow-beta-backups-1:/backups/daily/susuflow-latest.sql.gz ./susuflow-latest.sql.gz
```

The manual PowerShell helper (`scripts/backup.ps1`) remains available for one-off host-level dumps.