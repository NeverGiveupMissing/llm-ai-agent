# Migration Execution Script
# Interface Module: api -> interface

Write-Host "========================================" -ForegroundColor Green
Write-Host "Interface Module Migration Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Set project root
$projectRoot = "d:\WorkSpace\code\MyProject\llm-ai-agent\vite-vue3-NaïveUI-pinia"
Set-Location $projectRoot

# Step 1: Remove duplicate api directory
Write-Host "[Step 1/4] Check and remove duplicate api directory..." -ForegroundColor Yellow

$apiDir = "koa2\src\modules\api"
$interfaceDir = "koa2\src\modules\interface"

if (Test-Path $apiDir) {
    Write-Host "Found api directory: $apiDir" -ForegroundColor Cyan
    Write-Host "Found interface directory: $interfaceDir" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Warning: api directory still exists and needs to be removed!" -ForegroundColor Red
    Write-Host ""
    
    $confirm = Read-Host "Delete api directory? (y/n)"
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        try {
            Remove-Item -Path $apiDir -Recurse -Force
            Write-Host "OK: api directory deleted" -ForegroundColor Green
        } catch {
            Write-Host "Failed: $_" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Cancelled: script terminated" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "OK: api directory does not exist" -ForegroundColor Green
}

if (Test-Path $interfaceDir) {
    Write-Host "OK: interface directory exists: $interfaceDir" -ForegroundColor Green
} else {
    Write-Host "ERROR: interface directory does not exist!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Database check reminder
Write-Host "[Step 2/4] Database status check" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please execute the following SQL script in your database client:" -ForegroundColor Cyan
Write-Host "File: koa2\database\sql\final_migration_check.sql" -ForegroundColor Cyan
Write-Host ""

$dbCheck = Read-Host "Have you executed the database check? (y/n)"
if ($dbCheck -ne 'y' -and $dbCheck -ne 'Y') {
    Write-Host "Warning: Please execute database check first" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 3: Restart backend service
Write-Host "[Step 3/4] Restart backend service" -ForegroundColor Yellow

$pm2Installed = Get-Command pm2 -ErrorAction SilentlyContinue
if ($pm2Installed) {
    Write-Host "Using PM2 to restart service..." -ForegroundColor Cyan
    pm2 list
    
    $appName = Read-Host "Enter application name to restart (or 'all' for all)"
    
    try {
        if ($appName -eq 'all') {
            pm2 restart all
        } else {
            pm2 restart $appName
        }
        Write-Host "OK: Backend service restarted" -ForegroundColor Green
        
        Write-Host "Waiting for service startup (3 seconds)..." -ForegroundColor Cyan
        Start-Sleep -Seconds 3
        
        pm2 logs $appName --lines 20 --nostream
    } catch {
        Write-Host "Failed: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Warning: PM2 not installed, please restart manually in koa2 directory:" -ForegroundColor Yellow
    Write-Host "cd koa2" -ForegroundColor Cyan
    Write-Host "npm run dev" -ForegroundColor Cyan
}

Write-Host ""

# Step 4: Refresh frontend
Write-Host "[Step 4/4] Refresh frontend page" -ForegroundColor Yellow
Write-Host ""
Write-Host "In your browser:" -ForegroundColor Cyan
Write-Host "1. Open interface management page" -ForegroundColor White
Write-Host "2. Press Ctrl + F5 to force refresh" -ForegroundColor White
Write-Host "3. Check if data loads normally" -ForegroundColor White
Write-Host ""

$refreshConfirm = Read-Host "Have you refreshed and verified successfully? (y/n)"

# Complete
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
if ($refreshConfirm -eq 'y' -or $refreshConfirm -eq 'Y') {
    Write-Host "Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Warning: Please verify frontend page manually" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Migration Checklist:" -ForegroundColor Cyan
Write-Host "[ ] Database table sys_interface exists" -ForegroundColor White
Write-Host "[ ] Database table sys_api deleted" -ForegroundColor White
Write-Host "[ ] Permissions updated to interface:*" -ForegroundColor White
Write-Host "[ ] Backend directory renamed to interface" -ForegroundColor White
Write-Host "[ ] Backend service restarted" -ForegroundColor White
Write-Host "[ ] Frontend data loads normally" -ForegroundColor White
Write-Host "[ ] Pagination works correctly" -ForegroundColor White
Write-Host "[ ] CRUD operations work correctly" -ForegroundColor White
Write-Host ""