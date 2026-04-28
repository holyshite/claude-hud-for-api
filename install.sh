#!/bin/bash

# Claude Token HUD 插件安装脚本
# 版本: 1.0.0

set -e

# 尝试加载nvm环境
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    . "$HOME/.nvm/nvm.sh"
elif [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
fi

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查Node.js版本
check_node_version() {
    if command_exists node; then
        local node_version=$(node --version | cut -d'v' -f2)
        local major_version=$(echo $node_version | cut -d'.' -f1)
        
        if [ $major_version -ge 16 ]; then
            log_info "Node.js 版本: $node_version (符合要求)"
            return 0
        else
            log_error "Node.js 版本 $node_version 过低，需要 16.0.0+"
            return 1
        fi
    else
        log_error "Node.js 未安装"
        return 1
    fi
}

# 检查Bun版本
check_bun_version() {
    if command_exists bun; then
        local bun_version=$(bun --version)
        log_info "Bun 版本: $bun_version"
        return 0
    fi
    return 1
}

# 检查运行时环境
check_runtime() {
    log_info "检查运行时环境..."
    
    if check_node_version; then
        RUNTIME="node"
        return 0
    elif check_bun_version; then
        RUNTIME="bun"
        return 0
    else
        log_error "未找到 Node.js (16+) 或 Bun (1.0+)"
        log_info "请安装 Node.js: https://nodejs.org/"
        log_info "或安装 Bun: https://bun.sh/"
        return 1
    fi
}

# 安装依赖
install_dependencies() {
    log_info "安装依赖..."
    
    if [ -f "package.json" ]; then
        npm install --quiet
        if [ $? -eq 0 ]; then
            log_success "依赖安装完成"
        else
            log_error "依赖安装失败"
            return 1
        fi
    else
        log_error "未找到 package.json 文件"
        return 1
    fi
}

# 编译项目
build_project() {
    log_info "编译项目..."
    
    if command_exists npm; then
        npm run build
        if [ $? -eq 0 ]; then
            log_success "编译完成"
        else
            log_error "编译失败"
            return 1
        fi
    else
        log_error "npm 未找到"
        return 1
    fi
}

# 获取Node.js可执行文件路径
get_node_path() {
    # 尝试使用nvm的node
    if [ -n "$NVM_BIN" ]; then
        echo "$NVM_BIN/node"
    elif [ -n "$NVM_DIR" ] && [ -s "$NVM_DIR/nvm.sh" ]; then
        # 加载nvm获取当前node路径
        local nvm_node_path
        nvm_node_path=$(. "$NVM_DIR/nvm.sh" && nvm which current 2>/dev/null)
        if [ $? -eq 0 ] && [ -n "$nvm_node_path" ]; then
            echo "$nvm_node_path"
            return 0
        fi
    fi
    
    # 回退到系统node
    which node 2>/dev/null || echo "node"
}

# 配置Claude Code
configure_claude() {
    log_info "配置 Claude Code..."
    
    local claude_dir="$HOME/.claude"
    local settings_file="$claude_dir/settings.json"
    local plugin_dir=$(pwd)
    local node_path=$(get_node_path)
    
    log_info "使用Node.js路径: $node_path"
    
    # 创建.claude目录如果不存在
    if [ ! -d "$claude_dir" ]; then
        mkdir -p "$claude_dir"
        log_info "创建目录: $claude_dir"
    fi
    
    # 创建或更新settings.json
    if [ ! -f "$settings_file" ]; then
        log_info "创建新的 settings.json"
        cat > "$settings_file" << EOF
{
  "statusLine": {
    "type": "command",
    "command": "$node_path $plugin_dir/dist/index.js",
    "padding": 1,
    "interval": 300
  }
}
EOF
    else
        log_info "更新现有的 settings.json"
        
        # 使用Python或jq更新JSON文件
        if command_exists python3; then
            local node_path=$(get_node_path)
            SETTINGS_FILE="$settings_file" PLUGIN_DIR="$plugin_dir" NODE_PATH="$node_path" python3 << 'PYTHON_EOF'
import json
import os
import sys

settings_file = os.environ.get('SETTINGS_FILE', '')
plugin_dir = os.environ.get('PLUGIN_DIR', '')

if not settings_file or not plugin_dir:
    sys.stderr.write('错误: 缺少环境变量\\n')
    sys.exit(1)

try:
    with open(settings_file, 'r') as f:
        settings = json.load(f)
except FileNotFoundError:
    settings = {}
except json.JSONDecodeError:
    sys.stderr.write('警告: settings.json 格式错误，将创建新配置\\n')
    settings = {}

# 更新statusLine配置
node_path = os.environ.get('NODE_PATH', 'node')
settings['statusLine'] = {
    'type': 'command',
    # 注意: ${plugin_dir} 是shell变量，需要保持不变
    'command': f'{node_path} {plugin_dir}/dist/index.js',
    'padding': 1,
    'interval': 300
}

with open(settings_file, 'w') as f:
    json.dump(settings, f, indent=2)
PYTHON_EOF
        elif command_exists jq; then
            local node_path=$(get_node_path)
            jq --arg cmd "$node_path $plugin_dir/dist/index.js" '.statusLine = {
                "type": "command",
                "command": $cmd,
                "padding": 1,
                "interval": 300
            }' "$settings_file" > "$settings_file.tmp" && mv "$settings_file.tmp" "$settings_file"
        else
            log_warning "未找到 python3 或 jq，无法自动更新 settings.json"
            log_info "请手动添加以下配置到 $settings_file:"
            local node_path=$(get_node_path)
            echo ""
            echo "  \"statusLine\": {"
            echo "    \"type\": \"command\","
            echo "    \"command\": \"$node_path $plugin_dir/dist/index.js\","
            echo "    \"padding\": 1,"
            echo "    \"interval\": 300"
            echo "  }"
            echo ""
            return 0
        fi
    fi
    
    log_success "Claude Code 配置完成"
}

# 验证安装
verify_installation() {
    log_info "验证安装..."
    
    local plugin_dir=$(pwd)
    
    # 检查dist目录
    if [ ! -d "$plugin_dir/dist" ]; then
        log_error "dist 目录不存在，编译可能失败"
        return 1
    fi
    
    # 检查主文件
    if [ ! -f "$plugin_dir/dist/index.js" ]; then
        log_error "主文件 index.js 不存在"
        return 1
    fi
    
    # 测试运行
    log_info "测试插件运行..."
    echo '{"model":{"display_name":"Claude Test"}}' | node "$plugin_dir/dist/index.js" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_success "插件测试运行成功"
    else
        log_warning "插件测试运行失败，但可能仍然可用"
    fi
    
    log_success "安装验证完成"
}

# 显示安装完成信息
show_completion() {
    echo ""
    log_success "Claude Token HUD 插件安装完成！"
    echo ""
    log_info "下一步："
    echo "  1. 重启 Claude Code"
    echo "  2. 状态栏应显示类似以下信息："
    echo "     [Claude Opus 4.6] [████░░░░░░ 42% (84k/200k)] [5h: 15%] [7d: 3%]"
    echo ""
    log_info "如果需要配置显示选项，请编辑："
    echo "  $HOME/.claude/plugins/claude-hud-for-api/config.json"
    echo ""
    log_info "卸载说明："
    echo "  要卸载插件，请运行: ./uninstall.sh"
    echo ""
}

# 主安装函数
main_install() {
    echo ""
    log_info "开始安装 Claude Token HUD 插件"
    echo "=========================================="
    
    # 检查运行时
    if ! check_runtime; then
        exit 1
    fi
    
    # 安装依赖
    if ! install_dependencies; then
        exit 1
    fi
    
    # 编译项目
    if ! build_project; then
        exit 1
    fi
    
    # 配置Claude Code
    configure_claude
    
    # 验证安装
    verify_installation
    
    # 显示完成信息
    show_completion
}

# 显示使用帮助
show_usage() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  install     安装插件（默认）"
    echo "  verify      验证安装"
    echo "  help        显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 install    # 安装插件"
    echo "  $0 verify     # 验证安装"
    echo ""
}

# 验证安装
verify_only() {
    log_info "验证现有安装..."
    
    local plugin_dir=$(pwd)
    
    # 检查运行时
    check_runtime
    
    # 验证安装
    verify_installation
    
    log_success "验证完成"
}

# 根据参数执行相应操作
case "${1:-install}" in
    "install")
        main_install
        ;;
    "verify")
        verify_only
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        log_error "未知选项: $1"
        show_usage
        exit 1
        ;;
esac