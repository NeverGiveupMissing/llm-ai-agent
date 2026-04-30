@echo off
chcp 65001 >nul
echo ========================================
echo Move scripts to scripts folder
echo ========================================
echo.

REM Create scripts folder if not exists
if not exist "scripts" (
    mkdir scripts
    echo [OK] Created scripts folder
) else (
    echo [OK] scripts folder already exists
)

echo.
echo Start moving files...
echo.

REM Move all PowerShell script files
if exist "cleanup-unused-files.ps1" move /Y "cleanup-unused-files.ps1" "scripts\"
if exist "deploy-check.ps1" move /Y "deploy-check.ps1" "scripts\"
if exist "fix-production-deploy.ps1" move /Y "fix-production-deploy.ps1" "scripts\"
if exist "fix-missing-dependencies.ps1" move /Y "fix-missing-dependencies.ps1" "scripts\"
if exist "pm2-restart-and-verify.ps1" move /Y "pm2-restart-and-verify.ps1" "scripts\"
if exist "deploy-production.ps1" move /Y "deploy-production.ps1" "scripts\"

echo.
echo ========================================
echo Files moved successfully!
echo ========================================
echo.
echo The following files have been moved to scripts\:
echo   - cleanup-unused-files.ps1
echo   - deploy-check.ps1
echo   - fix-production-deploy.ps1
echo   - fix-missing-dependencies.ps1
echo   - pm2-restart-and-verify.ps1
echo   - deploy-production.ps1
echo.

pause
