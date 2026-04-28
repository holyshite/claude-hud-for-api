#!/bin/bash

# Claude Token HUD 插件卸载脚本
# 版本: 1.0.0

set -e

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

# 从settings.json中移除插件配置
remove_configuration() {
    local claude_dir="$HOME/.claude"
    local settings_file="$claude_dir/settings.json"
    
    if [ ! -f "$settings_file" ]; then
        log_warning "未找到 settings.json 文件"
        return 0
    fi
    
    log_info "从 settings.json 中移除插件配置..."
    
    # 使用Python或jq移除配置
    if command -v python3 >/dev/null 2>&1; then
        python3 -c "
import json
import os
import sys

settings_file = '$settings_file'

try:
    with open(settings_file, 'r') as f:
        settings = json.load(f)
except FileNotFoundError:
    log_warning('settings.json 文件不存在')
    sys.exit(0)
except json.JSONDecodeError:
    log_error('settings.json 格式错误')
    sys.exit(1)

# 移除statusLine配置
if 'statusLine' in settings:
    del settings['statusLine']
    log_info('已移除 statusLine 配置')
    
    # 如果settings为空，删除文件
    if not settings:
        os.remove(settings_file)
        log_info('settings.json 为空，已删除文件')
    else:
        with open(settings_file, 'w') as f:
            json.dump(settings, f, indent=2)
        log_info('已更新 settings.json')
else:
    log_info('未找到插件配置')
"
    elif command -v jq >/dev/null 2>&1; then
        # 使用jq移除statusLine字段
        if jq 'del(.statusLine)' "$settings_file" > "$settings_file.tmp"; then
            mv "$settings_file.tmp" "$settings_file"
            log_info "已更新 settings.json"
            
            # 检查文件是否为空对象
            if [ "$(jq -r 'length' "$settings_file")" = "0" ]; then
                rm "$settings_file"
                log_info "settings.json 为空，已删除文件"
            fi
        else
            log_error "更新 settings.json 失败"
        fi
    else
        log_warning "未找到 python3 或 jq，无法自动更新 settings.json"
        log_info "请手动编辑 $settings_file，移除以下配置："
        echo ""
        echo "  \"statusLine\": { ... }"
        echo ""
        return 0
    fi
}

# 删除插件目录（可选）
delete_plugin_directory() {
    local plugin_dir=$(pwd)
    local default_plugin_dir="$HOME/.claude/plugins/claude-hud-for-api"
    
    echo ""
    log_warning "您想要删除插件目录吗？"
    echo ""
    echo "当前目录: $plugin_dir"
    echo "默认目录: $default_plugin_dir"
    echo ""
    echo "选择操作:"
    echo "  1) 删除当前目录 ($plugin_dir)"
    echo "  2) 删除默认目录 ($default_plugin_dir)"
    echo "  3) 不删除任何目录"
    echo "  4) 两者都删除"
    echo ""
    
    read -p "请输入选项 [1-4]: " choice
    
    case $choice in
        1)
            if [ -d "$plugin_dir" ]; then
                log_info "删除当前目录: $plugin_dir"
                rm -rf "$plugin_dir"
                log_success "目录已删除"
            else
                log_warning "当前目录不存在: $plugin_dir"
            fi
            ;;
        2)
            if [ -d "$default_plugin_dir" ]; then
                log_info "删除默认目录: $default_plugin_dir"
                rm -rf "$default_plugin_dir"
                log_success "目录已删除"
            else
                log_warning "默认目录不存在: $default_plugin_dir"
            fi
            ;;
        3)
            log_info "保留所有目录"
            ;;
        4)
            if [ -d "$plugin_dir" ]; then
                log_info "删除当前目录: $plugin_dir"
                rm -rf "$plugin_dir"
                log_success "当前目录已删除"
            fi
            
            if [ -d "$default_plugin_dir" ]; then
                log_info "删除默认目录: $default_plugin_dir"
                rm -rf "$default_plugin_dir"
                log_success "默认目录已删除"
            fi
            
            if [ ! -d "$plugin_dir" ] && [ ! -d "$default_plugin_dir" ]; then
                log_warning "两个目录都不存在"
            fi
            ;;
        *)
            log_error "无效选项"
            ;;
    esac
}

# 显示卸载完成信息
show_completion() {
    echo ""
    log_success "Claude Token HUD 插件卸载完成！"
    echo ""
    log_info "下一步："
    echo "  1. 重启 Claude Code 以使更改生效"
    echo "  2. 状态栏将不再显示token信息"
    echo ""
    log_info "如需重新安装，请运行: ./install.sh"
    echo ""
}

# 主卸载函数
main_uninstall() {
    echo ""
    log_info "开始卸载 Claude Token HUD 插件"
    echo "=========================================="
    
    # 移除配置
    remove_configuration
    
    # 询问是否删除目录
    delete_plugin_directory
    
    # 显示完成信息
    show_completion
}

# 显示使用帮助
show_usage() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  uninstall   卸载插件（默认）"
    echo "  help        显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 uninstall  # 卸载插件"
    echo "  $0 help       # 显示帮助"
    echo ""
}

# 根据参数执行相应操作
case "${1:-uninstall}" in
    "uninstall")
        main_uninstall
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