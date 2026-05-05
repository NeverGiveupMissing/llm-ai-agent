# 菜单问题快速检查和修复脚本
# 使用方法：在 koa2 目录下运行 .\quick-fix.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Menu Issue Quick Fix Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否在正确的目录
if (-not (Test-Path "scripts\diagnose-menu-issue.js")) {
    Write-Host "Error: Please run this script from the koa2 directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Running diagnosis..." -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Gray
node scripts/diagnose-menu-issue.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Diagnosis complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you see roles with 0 menus, run:" -ForegroundColor Yellow
Write-Host "  node scripts/fix-role-menus.js" -ForegroundColor White
Write-Host ""
Write-Host "Then restart your backend:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Do you want to run the fix script now? (y/n)"
if ($choice -eq "y" -or $choice -eq "Y") {
    Write-Host ""
    Write-Host "Step 2: Running fix script..." -ForegroundColor Green
    Write-Host "----------------------------------------" -ForegroundColor Gray
    node scripts/fix-role-menus.js
    
    Write-Host ""
    Write-Host "Step 3: Running verification..." -ForegroundColor Green
    Write-Host "----------------------------------------" -ForegroundColor Gray
    node scripts/test-new-user-menu.js
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Done! Don't forget to restart your backend." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
