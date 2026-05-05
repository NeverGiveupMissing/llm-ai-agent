# =====================================================
# 若依风格数据库重构快速执行脚本 (Windows PowerShell)
# 使用说明: .\refactor-to-ruoyi.ps1
# =====================================================

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 若依（RuoYi）风格数据库重构脚本" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Get database connection info
$DB_NAME = Read-Host "Enter database name [postgres]"
if ([string]::IsNullOrWhiteSpace($DB_NAME)) { $DB_NAME = "postgres" }

$DB_USER = Read-Host "Enter database user [postgres]"
if ([string]::IsNullOrWhiteSpace($DB_USER)) { $DB_USER = "postgres" }

$DB_HOST = Read-Host "Enter database host [localhost]"
if ([string]::IsNullOrWhiteSpace($DB_HOST)) { $DB_HOST = "localhost" }

$DB_PORT = Read-Host "Enter database port [5432]"
if ([string]::IsNullOrWhiteSpace($DB_PORT)) { $DB_PORT = "5432" }

Write-Host ""
Write-Host "WARNING: This operation will modify database structure. Please ensure data is backed up!" -ForegroundColor Yellow
$CONFIRM = Read-Host "Continue? (yes/no)"

if ($CONFIRM -ne "yes") {
    Write-Host "Operation cancelled" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Step 1: Create Database Backup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Find PostgreSQL bin directory
$PG_BIN_PATH = ""
$possiblePaths = @(
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files\PostgreSQL\14\bin",
    "C:\Program Files\PostgreSQL\13\bin",
    "C:\Program Files\PostgreSQL\12\bin",
    "C:\Program Files (x86)\PostgreSQL\16\bin",
    "C:\Program Files (x86)\PostgreSQL\15\bin"
)

foreach ($path in $possiblePaths) {
    if (Test-Path "$path\pg_dump.exe") {
        $PG_BIN_PATH = $path
        Write-Host "Found PostgreSQL at: $PG_BIN_PATH" -ForegroundColor Green
        break
    }
}

if ([string]::IsNullOrWhiteSpace($PG_BIN_PATH)) {
    # Try to find from environment variable
    $pgEnv = $env:PGHOME
    if (-not [string]::IsNullOrWhiteSpace($pgEnv) -and (Test-Path "$pgEnv\bin\pg_dump.exe")) {
        $PG_BIN_PATH = "$pgEnv\bin"
        Write-Host "Found PostgreSQL from PGHOME: $PG_BIN_PATH" -ForegroundColor Green
    }
}

if ([string]::IsNullOrWhiteSpace($PG_BIN_PATH)) {
    Write-Host "ERROR: PostgreSQL not found! Please install PostgreSQL or add it to PATH." -ForegroundColor Red
    Write-Host "Common locations:" -ForegroundColor Yellow
    Write-Host "  - C:\Program Files\PostgreSQL\15\bin" -ForegroundColor Yellow
    Write-Host "  - C:\Program Files\PostgreSQL\16\bin" -ForegroundColor Yellow
    exit 1
}

$BACKUP_FILE = "backup_before_refactor_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
$pgDumpCmd = "& '$PG_BIN_PATH\pg_dump.exe' -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f $BACKUP_FILE"

Invoke-Expression $pgDumpCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Database backup created: $BACKUP_FILE" -ForegroundColor Green
} else {
    Write-Host "ERROR: Database backup failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Step 2: Execute Database Refactor Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$psqlCmd = "& '$PG_BIN_PATH\psql.exe' -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f database/sql/refactor_to_ruoyi_style.sql"
Invoke-Expression $psqlCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Database refactored" -ForegroundColor Green
} else {
    Write-Host "ERROR: Database refactor failed!" -ForegroundColor Red
    Write-Host "TIP: Restore from backup: psql -U $DB_USER -d $DB_NAME -f $BACKUP_FILE" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Step 3: Migrate Role Menu Permissions" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$psqlCmd2 = "& '$PG_BIN_PATH\psql.exe' -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f database/sql/migrate_role_menu_data.sql"
Invoke-Expression $psqlCmd2

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Role menu permissions migrated" -ForegroundColor Green
} else {
    Write-Host "WARNING: Role menu permission migration has warnings (can be adjusted manually)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Step 4: Verify Data" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "Checking sys_user table..." -ForegroundColor White
& "$PG_BIN_PATH\psql.exe" -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "SELECT COUNT(*) as user_count FROM sys_user;"

Write-Host ""
Write-Host "Checking sys_role table..." -ForegroundColor White
& "$PG_BIN_PATH\psql.exe" -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "SELECT * FROM sys_role;"

Write-Host ""
Write-Host "Checking sys_user_role table..." -ForegroundColor White
& "$PG_BIN_PATH\psql.exe" -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "SELECT COUNT(*) as user_role_count FROM sys_user_role;"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "SUCCESS: Refactoring Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "1. Restart backend service: npm run dev"
Write-Host "2. Test login functionality"
Write-Host "3. Verify permission validation"
Write-Host "4. After verification, delete backup tables (uncomment in refactor_to_ruoyi_style.sql)"
Write-Host ""
Write-Host "If issues occur, restore from backup:" -ForegroundColor Yellow
Write-Host "   & '$PG_BIN_PATH\psql.exe' -U $DB_USER -d $DB_NAME -f $BACKUP_FILE"
Write-Host ""
