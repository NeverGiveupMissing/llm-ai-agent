#!/bin/bash

# =====================================================
# 若依风格数据库重构快速执行脚本
# 使用说明: chmod +x refactor-to-ruoyi.sh && ./refactor-to-ruoyi.sh
# =====================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "🚀 若依（RuoYi）风格数据库重构脚本"
echo "=========================================="
echo ""

# 获取数据库连接信息
read -p "请输入数据库名称 [postgres]: " DB_NAME
DB_NAME=${DB_NAME:-postgres}

read -p "请输入数据库用户 [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -p "请输入数据库主机 [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "请输入数据库端口 [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo -e "${YELLOW}⚠️  警告: 此操作将修改数据库结构，请确保已备份数据！${NC}"
read -p "是否继续？(yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}❌ 操作已取消${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo "Step 1: 创建数据库备份"
echo "=========================================="

BACKUP_FILE="backup_before_refactor_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库备份成功: $BACKUP_FILE${NC}"
else
    echo -e "${RED}❌ 数据库备份失败！${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo "Step 2: 执行数据库重构脚本"
echo "=========================================="

psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f database/sql/refactor_to_ruoyi_style.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库重构成功${NC}"
else
    echo -e "${RED}❌ 数据库重构失败！${NC}"
    echo -e "${YELLOW}💡 提示: 可以查看备份文件进行恢复: psql -U $DB_USER -d $DB_NAME < $BACKUP_FILE${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo "Step 3: 迁移角色菜单权限"
echo "=========================================="

psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f database/sql/migrate_role_menu_data.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 角色菜单权限迁移成功${NC}"
else
    echo -e "${YELLOW}⚠️  角色菜单权限迁移出现警告（可手动调整）${NC}"
fi

echo ""
echo "=========================================="
echo "Step 4: 验证数据"
echo "=========================================="

echo "检查 sys_user 表..."
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "SELECT COUNT(*) as user_count FROM sys_user;"

echo ""
echo "检查 sys_role 表..."
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "SELECT * FROM sys_role;"

echo ""
echo "检查 sys_user_role 表..."
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "SELECT COUNT(*) as user_role_count FROM sys_user_role;"

echo ""
echo "=========================================="
echo "✅ 重构完成！"
echo "=========================================="
echo ""
echo -e "${GREEN}📊 下一步操作:${NC}"
echo "1. 重启后端服务: npm run dev"
echo "2. 测试登录功能"
echo "3. 验证权限校验是否正常"
echo "4. 确认无误后，可删除备份表（在 refactor_to_ruoyi_style.sql 中取消注释）"
echo ""
echo -e "${YELLOW}⚠️  如有问题，可使用备份恢复:${NC}"
echo "   psql -U $DB_USER -d $DB_NAME < $BACKUP_FILE"
echo ""
