#!/bin/bash
# ============================================
# 测试脚本主入口 - 运行所有模块测试
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔════════════════════════════════════════════════════════╗"
echo "║          🚀 API 自动化测试套件                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 检查 jq 是否安装
if ! command -v jq &> /dev/null; then
  echo "❌ 错误: 未找到 jq 工具"
  echo "   请先安装: yum install jq -y 或 apt-get install jq -y"
  exit 1
fi

# 选择要运行的测试模块
echo "请选择要运行的测试模块："
echo "  1) 用户管理模块"
echo "  2) 角色管理模块"
echo "  3) 权限管理模块"
echo "  4) 会话管理模块"
echo "  5) 会话分组管理模块"
echo "  6) 操作日志模块"
echo "  7) 记忆管理模块"
echo "  8) 聊天记忆模块"
echo "  9) 运行所有测试"
echo "  0) 退出"
echo ""
read -p "请输入选项 (0-9): " choice

case $choice in
  1)
    echo ""
    echo "▶️  运行用户管理模块测试..."
    echo ""
    bash "${SCRIPT_DIR}/user.test.sh"
    ;;
  2)
    echo ""
    echo "▶️  运行角色管理模块测试..."
    echo ""
    bash "${SCRIPT_DIR}/role.test.sh"
    ;;
  3)
    echo ""
    echo "▶️  运行权限管理模块测试..."
    echo ""
    bash "${SCRIPT_DIR}/permission.test.sh"
    ;;
  4)
    echo ""
    echo "▶️  运行会话管理模块测试..."
    echo ""
    bash "${SCRIPT_DIR}/session.test.sh"
    ;;
  5)
    echo ""
    echo "▶️  运行会话分组管理模块测试..."
    echo ""
    bash "${SCRIPT_DIR}/session-group.test.sh"
    ;;
  6)
    echo ""
    echo "▶️  运行操作日志模块测试..."
    echo ""
    bash "${SCRIPT_DIR}/operation-log.test.sh"
    ;;
  7)
    echo ""
    echo "▶️  运行记忆管理模块测试..."
    echo ""
    bash "${SCRIPT_DIR}/memory.test.sh"
    ;;
  8)
    echo ""
    echo "▶️  运行聊天记忆模块测试..."
    echo ""
    bash "${SCRIPT_DIR}/chat-memory.test.sh"
    ;;
  9)
    echo ""
    echo "▶️  运行所有测试..."
    echo ""
    bash "${SCRIPT_DIR}/user.test.sh"
    echo ""
    echo "-----------------------------------------"
    echo ""
    bash "${SCRIPT_DIR}/role.test.sh"
    echo ""
    echo "-----------------------------------------"
    echo ""
    bash "${SCRIPT_DIR}/permission.test.sh"
    echo ""
    echo "-----------------------------------------"
    echo ""
    bash "${SCRIPT_DIR}/session.test.sh"
    echo ""
    echo "-----------------------------------------"
    echo ""
    bash "${SCRIPT_DIR}/session-group.test.sh"
    echo ""
    echo "-----------------------------------------"
    echo ""
    bash "${SCRIPT_DIR}/operation-log.test.sh"
    echo ""
    echo "-----------------------------------------"
    echo ""
    bash "${SCRIPT_DIR}/memory.test.sh"
    echo ""
    echo "-----------------------------------------"
    echo ""
    bash "${SCRIPT_DIR}/chat-memory.test.sh"
    ;;
  0)
    echo "👋 退出测试"
    exit 0
    ;;
  *)
    echo "❌ 无效的选项"
    exit 1
    ;;
esac

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║          ✅ 测试执行完成！                            ║"
echo "╚════════════════════════════════════════════════════════╝"
