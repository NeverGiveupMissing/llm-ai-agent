# PM2 服务重启和验证脚本
# 用于解决 MODULE_NOT_FOUND 错误

Write-Host " PM2 服务重启和验证" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "请在生产服务器上执行以下命令：" -ForegroundColor Yellow
Write-Host ""

Write-Host "步骤 1: 查看当前 PM2 状态" -ForegroundColor Green
Write-Host "pm2 status" -ForegroundColor White
Write-Host ""

Write-Host "步骤 2: 停止当前服务" -ForegroundColor Green
Write-Host "pm2 stop ai-api" -ForegroundColor White
Write-Host ""

Write-Host "步骤 3: 删除旧的进程（清除缓存）" -ForegroundColor Green
Write-Host "pm2 delete ai-api" -ForegroundColor White
Write-Host ""

Write-Host "步骤 4: 重新启动服务" -ForegroundColor Green
Write-Host "pm2 start ecosystem.config.js --env production" -ForegroundColor White
Write-Host ""

Write-Host "步骤 5: 查看启动日志" -ForegroundColor Green
Write-Host "pm2 logs ai-api --lines 30" -ForegroundColor White
Write-Host ""

Write-Host "步骤 6: 验证服务是否正常" -ForegroundColor Green
Write-Host "# 检查进程状态" -ForegroundColor Gray
Write-Host "pm2 status" -ForegroundColor White
Write-Host ""
Write-Host "# 测试 API 接口" -ForegroundColor Gray
Write-Host "curl http://localhost:8000/koa2api/sessions" -ForegroundColor White
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "如果仍有错误，请执行以下诊断命令：" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "# 查看完整错误日志" -ForegroundColor Gray
Write-Host "pm2 logs ai-api-error.log --lines 50" -ForegroundColor White
Write-Host ""
Write-Host "# 检查文件是否存在" -ForegroundColor Gray
Write-Host "ls -la /www/wwwroot/api.yumanyi.top/src/utils/" -ForegroundColor White
Write-Host ""
Write-Host "# 检查 Node.js 版本" -ForegroundColor Gray
Write-Host "node --version" -ForegroundColor White
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "常见问题排查：" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 如果仍然报 MODULE_NOT_FOUND：" -ForegroundColor White
Write-Host "   - 确认文件权限：chmod 755 /www/wwwroot/api.yumanyi.top/src/utils/*" -ForegroundColor Gray
Write-Host "   - 检查文件编码：确保是 UTF-8 编码" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 如果服务启动但 API 无法访问：" -ForegroundColor White
Write-Host "   - 检查端口是否被占用：netstat -tlnp | grep 8000" -ForegroundColor Gray
Write-Host "   - 检查防火墙设置" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 如果数据库连接失败：" -ForegroundColor White
Write-Host "   - 检查数据库配置：cat /www/wwwroot/api.yumanyi.top/.env" -ForegroundColor Gray
Write-Host "   - 确认数据库服务运行中" -ForegroundColor Gray
Write-Host ""
