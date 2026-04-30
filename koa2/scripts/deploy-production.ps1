# ============================================
# 生产环境部署脚本
# 使用前请修改 SERVER_CONFIG 中的服务器信息
# ============================================

# 服务器配置
$SERVER_USER = "root"
$SERVER_HOST = "api.yumanyi.top"
$SERVER_PATH = "/www/wwwroot/api.yumanyi.top"
$PM2_APP_NAME = "ai-api"

Write-Host "🚀 开始部署到生产环境..." -ForegroundColor Green

# 步骤 1: 清理本地构建产物
Write-Host "`n📦 步骤 1: 清理本地文件..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

# 步骤 2: 压缩项目文件（排除 node_modules 和 .git）
Write-Host "📦 步骤 2: 压缩项目文件..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$archiveName = "deploy_$timestamp.zip"

# 创建临时目录并复制文件
$tempDir = "temp_deploy"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# 复制所有文件（排除不需要的目录）
Get-ChildItem -Path "." -Exclude "node_modules", ".git", "logs", "temp_deploy", "*.zip" | 
    Copy-Item -Destination $tempDir -Recurse -Force

# 压缩
Compress-Archive -Path "$tempDir\*" -DestinationPath $archiveName -Force
Remove-Item -Recurse -Force $tempDir

Write-Host "✅ 压缩完成: $archiveName" -ForegroundColor Green

# 步骤 3: 上传到服务器
Write-Host "`n📤 步骤 3: 上传到服务器..." -ForegroundColor Yellow
Write-Host "⚠️  请手动执行以下命令上传文件：" -ForegroundColor Cyan
Write-Host ""
Write-Host "scp $archiveName ${SERVER_USER}@${SERVER_HOST}:/tmp/" -ForegroundColor White
Write-Host ""
Write-Host "按任意键继续..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 步骤 4: 服务器端操作指南
Write-Host "`n🔧 步骤 4: 在服务器上执行以下命令：" -ForegroundColor Yellow
Write-Host ""
Write-Host "# 1. SSH 连接到服务器" -ForegroundColor Cyan
Write-Host "ssh ${SERVER_USER}@${SERVER_HOST}" -ForegroundColor White
Write-Host ""
Write-Host "# 2. 解压并替换文件" -ForegroundColor Cyan
Write-Host "cd $SERVER_PATH" -ForegroundColor White
Write-Host "unzip -o /tmp/$archiveName -d ." -ForegroundColor White
Write-Host "rm /tmp/$archiveName" -ForegroundColor White
Write-Host ""
Write-Host "# 3. 安装依赖" -ForegroundColor Cyan
Write-Host "npm install --production" -ForegroundColor White
Write-Host ""
Write-Host "# 4. 初始化数据库（如果需要）" -ForegroundColor Cyan
Write-Host "npm run db:init" -ForegroundColor White
Write-Host ""
Write-Host "# 5. 重启 PM2 服务" -ForegroundColor Cyan
Write-Host "pm2 restart $PM2_APP_NAME" -ForegroundColor White
Write-Host ""
Write-Host "# 6. 查看日志" -ForegroundColor Cyan
Write-Host "pm2 logs $PM2_APP_NAME --lines 50" -ForegroundColor White
Write-Host ""

Write-Host "🎉 部署指南已完成！" -ForegroundColor Green
Write-Host "⚠️  重要提示：" -ForegroundColor Red
Write-Host "  1. 确保服务器已安装 Node.js 和 PM2" -ForegroundColor Yellow
Write-Host "  2. 确保 .env.production 配置文件正确" -ForegroundColor Yellow
Write-Host "  3. 检查防火墙是否开放端口 65432" -ForegroundColor Yellow
Write-Host "  4. 部署后测试 API 是否正常响应" -ForegroundColor Yellow
