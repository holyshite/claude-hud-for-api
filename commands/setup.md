---
description: 自动配置 Claude Code 状态栏，检测 node 路径和插件位置
allowed-tools: Read, Write, Bash
---

# Claude HUD Setup

自动配置 Claude Code 状态栏，显示实时 token 使用量和模型信息。

## 你的任务

按照以下步骤自动完成配置，无需让用户手动操作。

### Step 1: 检测 node 路径

Run `which node` to find the node binary path. If it returns empty, also try:
- Check common paths: `~/.nvm/versions/node/*/bin/node`
- Check if there's a node in PATH via `command -v node`

Save the node path for later use.

### Step 2: 找到插件目录

插件通过 Claude Code plugin 系统安装时，文件在 `~/.claude/plugins/<plugin-name>/` 下。但 Claude 不会自动告诉你这个路径。

Run these to find the plugin directory:
```bash
# Check common plugin locations
ls -d ~/.claude/plugins/claude-hud 2>/dev/null || \
ls -d ~/.claude/plugins/claude-token-hud 2>/dev/null || \
ls -d ~/.claude/plugins/claude-hud-for-api 2>/dev/null || echo "NOT_FOUND"
```

If NOT_FOUND, the user may have cloned the repo manually. Ask them for the full path, or check the current working directory.

### Step 3: 验证插件入口

```bash
# Verify the entry point exists
ls -la <plugin_dir>/dist/index.js
```

If it doesn't exist, you may need to build:
```bash
cd <plugin_dir> && npm run build
```

### Step 4: 配置 settings.json

Read `~/.claude/settings.json` first (use the Read tool). Then update it to add the `statusLine` config.

The statusLine config format:
```json
{
  "statusLine": {
    "type": "command",
    "command": "<node_path> <plugin_dir>/dist/index.js",
    "padding": 1
  }
}
```

Important rules:
- `command` 字段直接是命令字符串，**不要**用 `bash -c` 包裹
- 用空格分隔 node_path 和插件路径
- 如果 settings.json 已有其他配置，只更新 `statusLine` 字段，保留其他字段
- 使用 Edit 工具精确替换，不要重写整个文件

### Step 5: 验证安装

Run this to test the plugin works:
```bash
echo '{"model":{"display_name":"Claude Test"},"context_window":{"context_window_size":200000,"current_usage":{"input_tokens":45000}}}' | node <plugin_dir>/dist/index.js
```

Expected output: something like `Claude Test | ██░░░░░░░░ 23% 45k/200k`

### Step 6: 告知用户

告诉用户配置完成，状态栏会在 Claude Code 重启后显示。如果用户想立即看到效果，建议运行 `/reload-plugins`。

## 可用的 slash 命令

- `/claude-hud:setup` - 自动配置状态栏（当前命令）
- `/claude-hud:configure` - 查看并编辑 HUD 显示选项、颜色和格式配置

## 故障排除

如果状态栏不显示：
- 确保 `~/.claude/settings.json` 中 `statusLine` 配置正确
- 运行验证命令测试插件是否正常
- 确保 node 路径和插件路径正确
