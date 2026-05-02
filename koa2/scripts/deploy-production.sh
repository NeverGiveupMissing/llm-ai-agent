#!/bin/bash
# ============================================
# 生产环境部署脚本
# ============================================

set -e  # 遇到错误立即退出

echo "🚀 开始部署到生产环境..."
echo ""

# 配置
SERVER="root@iZuf6j7o0kttc816hmtt1zZ"
REMOTE_PATH="/www/wwwroot/api.yumanyi.top"
PM2_NAME="ai-api"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: 同步代码到服务器${NC}"
echo "----------------------------------------"

# 检查是否有未提交的更改
if [[ $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠️  检测到未提交的更改，是否提交？(y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "deploy: 自动部署 $(date '+%Y-%m-%d %H:%M:%S')"
        git push
        echo -e "${GREEN}✅ 代码已提交并推送${NC}"
    else
        echo -e "${YELLOW}⚠️  跳过提交，继续部署...${NC}"
    fi
fi

# 上传文件到服务器
echo "📤 上传文件..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'logs' \
    --exclude '.env' \
    ./ ${SERVER}:${REMOTE_PATH}/

echo -e "${GREEN}✅ 代码同步完成${NC}"
echo ""

# Step 2: 在服务器上执行操作
echo -e "${YELLOW}Step 2: 服务器端操作${NC}"
echo "----------------------------------------"

ssh ${SERVER} << EOF
    set -e
    
    cd ${REMOTE_PATH}
    
    echo "📦 安装依赖..."
    npm install --production
    
    echo ""
    echo "🔄 重启服务..."
    pm2 restart ${PM2_NAME} --update-env
    
    echo ""
    echo "⏳ 等待服务启动..."
    sleep 3
    
    echo ""
    echo "📊 服务状态:"
    pm2 status ${PM2_NAME}
    
    echo ""
    echo "📝 最新日志（最后20行）:"
    pm2 logs ${PM2_NAME} --lines 20 --nostream
    
    echo ""
    echo "❌ 错误日志（最后20行）:"
    tail -20 logs/${PM2_NAME}-error.log 2>/dev/null || echo "无错误日志"
EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "💡 提示："
echo "  - 查看实时日志: ssh ${SERVER} 'pm2 logs ${PM2_NAME}'"
echo "  - 查看服务状态: ssh ${SERVER} 'pm2 status'"
echo "  - 重启服务: ssh ${SERVER} 'pm2 restart ${PM2_NAME}'"
echo ""
