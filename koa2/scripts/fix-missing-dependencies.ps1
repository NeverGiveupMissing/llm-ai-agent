# ============================================
# 快速修复生产环境依赖问题
# ============================================

Write-Host "🔧 快速修复生产环境 MODULE_NOT_FOUND 错误" -ForegroundColor Green
Write-Host ""

Write-Host "⚠️  问题原因：" -ForegroundColor Yellow
Write-Host "  生产环境缺少 bcrypt 和 jsonwebtoken 依赖包" -ForegroundColor White
Write-Host ""

Write-Host "✅ 解决方案（在服务器上执行）：" -ForegroundColor Green
Write-Host ""

Write-Host "# 1. SSH 连接到服务器" -ForegroundColor Cyan
Write-Host "ssh root@api.yumanyi.top" -ForegroundColor White
Write-Host ""

Write-Host "# 2. 进入项目目录" -ForegroundColor Cyan
Write-Host "cd /www/wwwroot/api.yumanyi.top" -ForegroundColor White
Write-Host ""

Write-Host "# 3. 安装缺失的依赖" -ForegroundColor Cyan
Write-Host "npm install bcrypt@^5.1.1 jsonwebtoken@^9.0.2 --production" -ForegroundColor White
Write-Host ""

Write-Host "# 4. 重启 PM2 服务" -ForegroundColor Cyan
Write-Host "pm2 restart ai-api" -ForegroundColor White
Write-Host ""

Write-Host "# 5. 查看日志确认启动成功" -ForegroundColor Cyan
Write-Host "pm2 logs ai-api --lines 30" -ForegroundColor White
Write-Host ""

Write-Host "==========================================" -ForegroundColor Gray
Write-Host "或者，重新部署完整代码（推荐）：" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Gray
Write-Host ""

Write-Host "# 方法 1: 使用部署脚本" -ForegroundColor Cyan
Write-Host ".\deploy-production.ps1" -ForegroundColor White
Write-Host ""

Write-Host "# 方法 2: 手动上传并安装" -ForegroundColor Cyan
Write-Host "1. 本地打包代码" -ForegroundColor White
Write-Host "2. 上传到服务器" -ForegroundColor White
Write-Host "3. 解压覆盖" -ForegroundColor White
Write-Host "4. npm install --production" -ForegroundColor White
Write-Host "5. pm2 restart ai-api" -ForegroundColor White
Write-Host ""

Write-Host "💡 提示：" -ForegroundColor Green
Write-Host "  - 确保 package.json 包含所有必需的依赖" -ForegroundColor Yellow
Write-Host "  - 生产环境必须执行 npm install 安装依赖" -ForegroundColor Yellow
Write-Host "  - 建议使用 PM2 管理进程，便于重启和监控" -ForegroundColor Yellow
