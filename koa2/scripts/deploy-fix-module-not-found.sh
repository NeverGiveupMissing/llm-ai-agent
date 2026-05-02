#!/bin/bash
# ============================================
# 完整部署脚本 - 安装koa-body并修复数据库初始化
# ============================================

set -e

echo "🚀 开始完整部署..."
echo ""

SERVER="root@iZuf6j7o0kttc816hmtt1zZ"
REMOTE_PATH="/www/wwwroot/api.yumanyi.top"
PM2_NAME="ai-api"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: 恢复并上传文件${NC}"
echo "----------------------------------------"

# 恢复 app.js
echo "📝 恢复 app.js..."
git checkout src/app.js

# 上传文件
echo "📤 上传 app.js..."
scp src/app.js ${SERVER}:${REMOTE_PATH}/src/

echo "📤 上传 init-db.js..."
scp src/config/init-db.js ${SERVER}:${REMOTE_PATH}/src/config/

echo -e "${GREEN}✅ 文件上传完成${NC}"
echo ""

echo -e "${YELLOW}Step 2: 服务器端操作${NC}"
echo "----------------------------------------"

ssh ${SERVER} << 'EOF'
    set -e
    
    cd /www/wwwroot/api.yumanyi.top
    
    echo "📦 安装 koa-body..."
    npm install koa-body
    
    echo ""
    echo "✅ koa-body 安装完成"
    npm list koa-body | head -5
    
    echo ""
    echo "🔄 重启服务..."
    pm2 restart ai-api --update-env
    
    echo ""
    echo "⏳ 等待服务启动..."
    sleep 3
    
    echo ""
    echo "📊 服务状态:"
    pm2 status ai-api
    
    echo ""
    echo "📝 最新日志（最后30行）:"
    pm2 logs ai-api --lines 30 --nostream
    
    echo ""
    echo "❌ 检查错误日志:"
    if [ -f logs/ai-api-error.log ]; then
        ERROR_COUNT=$(grep -c "MODULE_NOT_FOUND\|Error:" logs/ai-api-error.log 2>/dev/null || echo "0")
        if [ "$ERROR_COUNT" -gt "0" ]; then
            echo "⚠️  发现 $ERROR_COUNT 个错误:"
            tail -30 logs/ai-api-error.log
        else
            echo "✅ 无错误日志"
        fi
    else
        echo "✅ 无错误日志文件"
    fi
    
    echo ""
    echo "🔍 检查 koa-body 是否加载:"
    if pm2 logs ai-api --lines 50 --nostream | grep -q "koa-body"; then
        echo "✅ koa-body 已加载"
    else
        echo "⚠️  koa-body 可能未正确加载"
    fi
EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "💡 下一步："
echo "  1. 测试API: curl http://api.yumanyi.top:65432/koa2api/users/me"
echo "  2. 查看实时日志: ssh ${SERVER} 'pm2 logs ${PM2_NAME}'"
echo "  3. 运行测试: cd koa2/tests && bash session.test.sh"
echo ""
