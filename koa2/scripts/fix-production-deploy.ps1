# 生产环境修复部署脚本
# 用于修复 MODULE_NOT_FOUND 错误并重新部署

Write-Host " 生产环境修复部署脚本" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 检查本地必需文件
Write-Host "步骤 1: 检查本地文件完整性..." -ForegroundColor Yellow
$requiredFiles = @(
    "src\utils\helpers.js",
    "src\utils\chat-logger.js",
    "src\utils\response.js",
    "src\utils\token-estimator.js",
    "src\config\constants.js",
    "src\config\db.js",
    "src\config\index.js",
    "src\config\init-db.js",
    "src\config\swagger.js"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file - 缺失！" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "❌ 本地文件不完整，请先恢复缺失的文件！" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ 本地文件检查通过！" -ForegroundColor Green
Write-Host ""

# 提供部署选项
Write-Host "步骤 2: 选择部署方式" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Git 推送并服务器拉取（推荐）" -ForegroundColor White
Write-Host "2. 手动上传文件到服务器" -ForegroundColor White
Write-Host "3. 使用 rsync 同步" -ForegroundColor White
Write-Host "4. 取消部署" -ForegroundColor White
Write-Host ""

$choice = Read-Host "请选择 (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host " Git 部署步骤：" -ForegroundColor Cyan
        Write-Host "1. 提交更改: git add . && git commit -m '修复: 恢复 helpers.js 等必需文件'" -ForegroundColor White
        Write-Host "2. 推送到远程: git push" -ForegroundColor White
        Write-Host "3. SSH 到服务器: ssh root@api.yumanyi.top" -ForegroundColor White
        Write-Host "4. 进入项目目录: cd /www/wwwroot/api.yumanyi.top" -ForegroundColor White
        Write-Host "5. 拉取代码: git pull" -ForegroundColor White
        Write-Host "6. 重启 PM2: pm2 restart ai-api" -ForegroundColor White
        Write-Host "7. 查看日志: pm2 logs ai-api --lines 20" -ForegroundColor White
    }
    "2" {
        Write-Host ""
        Write-Host " 手动上传步骤：" -ForegroundColor Cyan
        Write-Host "1. 使用 SFTP/FTP 工具连接到服务器" -ForegroundColor White
        Write-Host "2. 上传以下目录到 /www/wwwroot/api.yumanyi.top/src/：" -ForegroundColor White
        Write-Host "   - utils/ (全部文件)" -ForegroundColor Gray
        Write-Host "   - config/ (全部文件)" -ForegroundColor Gray
        Write-Host "3. SSH 到服务器重启 PM2: pm2 restart ai-api" -ForegroundColor White
    }
    "3" {
        Write-Host ""
        Write-Host " rsync 同步命令：" -ForegroundColor Cyan
        Write-Host "rsync -avz --delete ./src/ root@api.yumanyi.top:/www/wwwroot/api.yumanyi.top/src/" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "然后在服务器上执行: pm2 restart ai-api" -ForegroundColor White
    }
    "4" {
        Write-Host "已取消部署" -ForegroundColor Gray
        exit 0
    }
    default {
        Write-Host "无效选择" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "部署后验证步骤：" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "1. 检查 PM2 状态: pm2 status" -ForegroundColor White
Write-Host "2. 查看错误日志: pm2 logs ai-api-error.log --lines 20" -ForegroundColor White
Write-Host "3. 测试 API: curl http://localhost:8000/koa2api/health" -ForegroundColor White
Write-Host "4. 检查前端是否正常加载" -ForegroundColor White
Write-Host ""
