# ============================================
# 生产环境部署脚本 (PowerShell)
# ============================================

Write-Host "🚀 开始部署到生产环境..." -ForegroundColor Yellow
Write-Host ""

# 配置
$SERVER = "root@iZuf6j7o0kttc816hmtt1zZ"
$REMOTE_PATH = "/www/wwwroot/api.yumanyi.top"
$PM2_NAME = "ai-api"

Write-Host "Step 1: 同步代码到服务器" -ForegroundColor Cyan
Write-Host "----------------------------------------"

# 检查是否有未提交的更改
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  检测到未提交的更改，是否提交？(y/n)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq "y" -or $response -eq "Y") {
        git add .
        git commit -m "deploy: 自动部署 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        git push
        Write-Host "✅ 代码已提交并推送" -ForegroundColor Green
    } else {
        Write-Host "⚠️  跳过提交，继续部署..." -ForegroundColor Yellow
    }
}

# 上传文件到服务器
Write-Host "📤 上传文件..." -ForegroundColor Cyan
scp -r src/config/init-db.js ${SERVER}:${REMOTE_PATH}/src/config/

Write-Host "✅ 代码同步完成" -ForegroundColor Green
Write-Host ""

# Step 2: 在服务器上执行操作
Write-Host "Step 2: 服务器端操作" -ForegroundColor Cyan
Write-Host "----------------------------------------"

ssh ${SERVER} @"
    cd ${REMOTE_PATH}
    
    echo '📦 安装依赖...'
    npm install --production
    
    echo ''
    echo '🔄 重启服务...'
    pm2 restart ${PM2_NAME} --update-env
    
    echo ''
    echo '⏳ 等待服务启动...'
    sleep 3
    
    echo ''
    echo '📊 服务状态:'
    pm2 status ${PM2_NAME}
    
    echo ''
    echo '📝 最新日志（最后20行）:'
    pm2 logs ${PM2_NAME} --lines 20 --nostream
    
    echo ''
    echo '❌ 错误日志（最后20行）:'
    tail -20 logs/${PM2_NAME}-error.log 2>/dev/null || echo '无错误日志'
"@

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ 部署完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "💡 提示：" -ForegroundColor Cyan
Write-Host "  - 查看实时日志: ssh ${SERVER} 'pm2 logs ${PM2_NAME}'"
Write-Host "  - 查看服务状态: ssh ${SERVER} 'pm2 status'"
Write-Host "  - 重启服务: ssh ${SERVER} 'pm2 restart ${PM2_NAME}'"
Write-Host ""
