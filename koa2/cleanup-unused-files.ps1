# 清理未使用的文件脚本
# 执行方式：在 koa2 目录下运行 powershell .\cleanup-unused-files.ps1

Write-Host " 开始清理未使用的文件..." -ForegroundColor Green

$filesToRemove = @(
    "src\utils\helpers.js",
    "src\utils\memory-constants.js",
    "src\utils\init-memory-db.js",
    "src\utils\init-chat-memory-db.js",
    "src\fix-imports.ps1",
    "src\config\migration-add-messages.sql",
    "src\config\migration-fix-session-id-type.sql"
)

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "✅ 已删除: $file" -ForegroundColor Yellow
    } else {
        Write-Host "️  文件不存在: $file" -ForegroundColor Gray
    }
}

Write-Host "`n🎉 清理完成！" -ForegroundColor Green
Write-Host "`n保留的文件（有引用）：" -ForegroundColor Cyan
Write-Host "  - config/constants.js" -ForegroundColor White
Write-Host "  - config/db.js" -ForegroundColor White
Write-Host "  - config/index.js" -ForegroundColor White
Write-Host "  - config/init-db.js" -ForegroundColor White
Write-Host "  - config/swagger.js" -ForegroundColor White
Write-Host "  - utils/chat-logger.js" -ForegroundColor White
Write-Host "  - utils/response.js" -ForegroundColor White
Write-Host "  - utils/token-estimator.js" -ForegroundColor White


