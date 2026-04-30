# 生产环境部署检查脚本
# 用于确认所有必需的文件都已正确部署

Write-Host " 开始检查生产环境部署所需文件..." -ForegroundColor Green
Write-Host ""

# 定义必需的文件列表
$requiredFiles = @(
    # Config 目录
    "src\config\constants.js",
    "src\config\db.js",
    "src\config\index.js",
    "src\config\init-db.js",
    "src\config\swagger.js",
    
    # Utils 目录
    "src\utils\chat-logger.js",
    "src\utils\helpers.js",
    "src\utils\response.js",
    "src\utils\token-estimator.js",
    
    # 主文件
    "src\app.js",
    "src\routes\index.js"
)

$missingFiles = @()
$existingFiles = @()

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        $existingFiles += $file
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        $missingFiles += $file
        Write-Host "❌ $file - 文件缺失！" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "检查结果汇总" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ 存在的文件: $($existingFiles.Count)" -ForegroundColor Green
Write-Host "❌ 缺失的文件: $($missingFiles.Count)" -ForegroundColor Red

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  发现缺失文件，部署到生产环境前必须修复！" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "缺失文件列表：" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "  - $file" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "建议操作：" -ForegroundColor Yellow
    Write-Host "1. 确认这些文件是否被意外删除" -ForegroundColor White
    Write-Host "2. 从版本控制恢复文件（git checkout）" -ForegroundColor White
    Write-Host "3. 重新部署到生产服务器" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host " 所有必需文件都已就绪，可以安全部署！" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "已删除的冗余文件（不应再使用）" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Gray
Write-Host "  - src\utils\memory-constants.js (已整合到 config/constants.js)" -ForegroundColor Gray
Write-Host "  - src\utils\init-memory-db.js (已整合到 config/init-db.js)" -Write-Host "  - src\utils\init-chat-memory-db.js (已整合到 config/init-db.js)" -ForegroundColor Gray
Write-Host "  - src\fix-imports.ps1 (空文件)" -ForegroundColor Gray
Write-Host "  - src\config\migration-add-messages.sql (已整合)" -ForegroundColor Gray
Write-Host "  - src\config\migration-fix-session-id-type.sql (已整合)" -ForegroundColor Gray
