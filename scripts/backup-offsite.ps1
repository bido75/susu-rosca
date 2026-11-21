# Off-site backup sync: copies the latest DB dump (and evidence blobs) to an
# encrypted rclone remote (Nextcloud WebDAV wrapped in a `crypt` remote).
#
# Prerequisites:
#   - rclone installed at ~/.local/bin/rclone.exe (or on PATH)
#   - rclone.conf with a `nextcloud` (webdav) and `backupcrypt` (crypt) remote
#
# Usage:
#   pwsh -File scripts/backup-offsite.ps1
#
# Runs every day via the `SusuFlowOffsiteBackup` scheduled task.

$ErrorActionPreference = 'Stop'

$rclone = Join-Path $env:USERPROFILE '.local\bin\rclone.exe'
if (-not (Test-Path $rclone)) { $rclone = 'rclone' }

$stage = Join-Path $env:TEMP 'susuflow-bk-stage'
New-Item -ItemType Directory -Force -Path $stage | Out-Null
Remove-Item "$stage\*" -Force -ErrorAction SilentlyContinue

# 1. Pull the latest DB dump out of the backups container.
$real = (docker exec susuflow-beta-backups-1 sh -lc 'readlink -f /backups/daily/susuflow-latest.sql.gz 2>/dev/null || echo /backups/daily/susuflow-latest.sql.gz').Trim()
if ($real -and $real -ne '') {
  docker cp "susuflow-beta-backups-1:$real" "$stage\susuflow-latest.sql.gz" | Out-Null
} else {
  Write-Warning 'No backup dump found in the backups container.'
}

# 2. Mirror the evidence volume (receipt images) into the stage dir too.
try {
  docker cp 'susuflow-beta-app-1:/app/data/evidence/.' "$stage\evidence" 2>$null
} catch { Write-Warning 'Could not copy evidence volume (may be empty).' }

# 3. Sync to encrypted Nextcloud.
if (Get-ChildItem $stage -Recurse -File | Select-Object -First 1) {
  & $rclone sync $stage backupcrypt:latest --transfers 4 --retries 3
  if ($LASTEXITCODE -ne 0) { throw 'rclone sync failed' }
  Write-Host 'Off-site backup synced to encrypted Nextcloud.'
} else {
  Write-Warning 'Nothing to sync (stage dir empty).'
}