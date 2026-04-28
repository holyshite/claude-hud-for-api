# 安装Claude Token HUD插件

此命令将帮助您安装和设置Claude Token HUD插件，该插件会在Claude Code状态栏中实时显示token使用量、模型信息和速率限制。

## 系统要求

- Node.js 16+ 或 Bun 1.0+
- Claude Code 2.1.0+

## 安装步骤

1. **克隆或下载插件**
   ```bash
   git clone https://github.com/yourname/claude-token-hud.git
   cd claude-token-hud
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **编译TypeScript**
   ```bash
   npm run build
   ```

4. **获取关键路径**
   运行以下命令，记录输出的两个路径：
   ```bash
   echo "Node路径: $(which node)"
   echo "插件路径: $(pwd)"
   ```

5. **配置Claude Code**
   编辑 `~/.claude/settings.json` 文件，添加或更新 `statusLine` 配置：

   ```json
   {
     "statusLine": {
       "type": "command",
       "command": "/path/to/node /path/to/claude-hud-for-api/dist/index.js",
       "padding": 1
     }
   }
   ```

   将两个路径替换为上一步输出的实际值。格式：`<node路径> <插件路径>/dist/index.js`，中间空格隔开，不要用 `bash -c` 包裹。

## 快速安装脚本

您可以运行以下命令进行一键安装：

```bash
#!/bin/bash
# 快速安装脚本

# 1. 下载插件
git clone https://github.com/yourname/claude-token-hud.git ~/.claude/plugins/claude-token-hud

# 2. 安装依赖
cd ~/.claude/plugins/claude-token-hud
npm install --quiet

# 3. 编译
npm run build

# 4. 获取node路径并配置Claude Code
NODE_PATH=$(which node)
PLUGIN_DIR="$HOME/.claude/plugins/claude-token-hud"

# 合并到 ~/.claude/settings.json（需要手动操作或用 jq/python）
# 最终配置格式：
# {
#   "statusLine": {
#     "type": "command",
#     "command": "<NODE_PATH> <PLUGIN_DIR>/dist/index.js",
#     "padding": 1
#   }
# }

echo "安装完成！请重启Claude Code。"
```

## 验证安装

安装完成后，重启Claude Code。您应该能在状态栏看到类似这样的信息：

```
[Claude Opus 4.6] [████░░░░░░ 42% (84k/200k)] [5h: 15%] [7d: 3%]
```

## 故障排除

### 问题1：状态栏不显示
- 确保 `~/.claude/settings.json` 中的 `statusLine` 配置正确
- 检查插件路径是否正确
- 重启Claude Code

### 问题2：显示"未知模型"或空白
- 确保Claude Code版本 >= 2.1.6
- 检查是否有stdin数据传递

### 问题3：性能问题
- 如果感觉卡顿，可以增加 `interval` 值（如500ms）
- 禁用不必要的显示选项

## 卸载

要卸载插件：

1. 从 `~/.claude/settings.json` 中移除 `statusLine` 配置
2. 删除插件目录：
   ```bash
   rm -rf ~/.claude/plugins/claude-token-hud
   ```

## 更新

要更新插件：

```bash
cd ~/.claude/plugins/claude-token-hud
git pull
npm install
npm run build
```

重启Claude Code即可生效。

## 支持

如遇问题，请访问：
- GitHub Issues: https://github.com/yourname/claude-token-hud/issues
- 文档: https://github.com/yourname/claude-token-hud#readme