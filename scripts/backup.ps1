# SusuFlow database backup script.
# Creates a compressed, timestamped PostgreSQL dump of the `susuflow` database
# into ./backups. Safe to run while the app is live.
#
# Usage (PowerShell):
#   pwsh -File scripts/backup.ps1
#
# Restore (into a fresh container):
#   docker exec -i susuflow-beta-db-1 psql -U susuflow -d susuflow < backups/<file>.sql

$ErrorActionPreference = 'Stop'

$container = 'susuflow-beta-db-1'
$db = 'susuflow'
$user = 'susuflow'
$outDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'backups'

New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$file = Join-Path $outDir "susuflow-$stamp.sql.gz"

docker exec $container pg_dump -U $user -d $db | gzip > $file

if ($LASTEXITCODE -eq 0 -and (Test-Path $file)) {
    Write-Host "Backup written: $file"
    $size = [math]::Round((Get-Item $file).Length / 1KB, 1)
    Write-Host "Size: ${size} KB"
} else {
    throw 'Backup failed.'
}
