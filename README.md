# Claude HUD

> Claude Code 状态栏插件，实时显示 token 使用量、模型信息和上下文窗口使用百分比

![展示效果](pro.png)
![展示效果](flash.png)

## 安装

### 方式一：插件安装（推荐）

在 Claude Code 中依次运行以下命令：

Step 1: 添加插件市场
`/plugin marketplace add holyshite/claude-hud-for-api`

Step 2: 安装插件
`/plugin install claude-hud`

Step 3: 重新加载插件
`/reload-plugins`

Step 4: 自动配置状态栏
`/claude-hud:setup`

`/claude-hud:setup` 会自动检测 node 路径和插件位置，配置状态栏。完成后重启 Claude Code 即可看到效果。

### 方式二：手动安装

如果你更喜欢手动控制：

```bash
git clone https://github.com/holyshite/claude-hud-for-api.git
cd claude-hud-for-api
```

插件已预编译在 `dist/` 目录，无需 `npm install`。直接配置 Claude Code：

编辑 `~/.claude/settings.json`，添加：

```json
{
  "statusLine": {
    "type": "command",
    "command": "node /path/to/claude-hud-for-api/dist/index.js",
    "padding": 1
  }
}
```

> 将 `/path/to/` 替换为实际路径。也支持 `~/.claude/plugins/claude-hud/` 等目录。

## 显示效果

```
Claude Opus 4.6 | ██████░░░░ 42% 84k/200k
```

## Slash 命令

| 命令                    | 说明                       |
| ----------------------- | -------------------------- |
| `/claude-hud:setup`     | 自动配置状态栏             |
| `/claude-hud:configure` | 查看配置文档，手动编辑 config.json |

## 配置选项

配置保存在 `~/.claude/plugins/claude-hud/config.json`（首次运行自动创建）。

### 完整配置项

| 字段 | 类型 | 默认值 | 说明 | 可选值 |
|------|------|--------|------|--------|
| `display.layout` | string | `"compact"` | 布局模式 | `"compact"`（紧凑单行）、`"detailed"`（详细多行） |
| `display.showModel` | boolean | `true` | 是否显示模型名称 | `true` / `false` |
| `display.showContextBar` | boolean | `true` | 是否显示上下文进度条 | `true` / `false` |
| `display.showTokenCounts` | boolean | `false` | 是否显示输入/输出详细 token 计数 | `true` / `false` |
| `display.showSeparators` | boolean | `true` | 是否显示分隔符（`\|`） | `true` / `false` |
| `display.compactNumbers` | boolean | `true` | 大数字使用 k/M 单位（如 `84k`） | `true` / `false` |
| `colors.safeThreshold` | number | `70` | 安全阈值（百分比），低于此值进度条为绿色 | `0`–`100` |
| `colors.warningThreshold` | number | `90` | 警告阈值（百分比），高于此值进度条为红色 | `0`–`100` |
| `colors.modelColor` | string | `"cyan"` | 模型名称颜色 | `"green"`、`"yellow"`、`"red"`、`"cyan"`、`"blue"`、`"magenta"`、`"dim"` |
| `colors.progressStyle` | string | `"bar"` | 进度条样式 | `"bar"`（条形 `████`）、`"text"`（纯文本）、`"percentage"`（仅百分比） |
| `format.modelFormat` | string | `"{name}"` | 模型名称显示格式，支持占位符 | `"{name}"`（显示名）、`"{id}"`（模型 ID）、可组合如 `"{name} ({id})"` |
| `format.percentagePrecision` | number | `0` | 百分比小数位数 | `0`–`3` |

## 常见显示模式

**紧凑模式（默认）**
```
Claude Opus 4.6 | ██████░░░░ 42% 84k/200k
```

**详细模式**
```
Claude Opus 4.6
██████░░░░ 42% 84k/200k
In: 45k | Out: 39k | Total: 84k
```

**启用 token 计数**
```
Claude Opus 4.6 | ██████░░░░ 42% 84k/200k | In: 45k | Out: 39k | Total: 84k
```

## 技术栈

- TypeScript 5.0+
- Node.js 16+
- 零运行时依赖

## 项目结构

```
claude-hud-for-api/
├── .claude-plugin/               # 插件元数据
│   ├── plugin.json
│   └── marketplace.json
├── src/                          # 源代码
│   ├── index.ts                  # 入口
│   ├── stdin.ts                  # stdin 解析
│   ├── types.ts                  # 类型定义
│   ├── config.ts                 # 配置管理
│   ├── render/                   # 渲染模块
│   │   ├── index.ts
│   │   ├── model-line.ts
│   │   ├── token-line.ts
│   │   ├── context-bar.ts
│   │   └── colors.ts
│   └── utils/
│       ├── format.ts
│       └── validation.ts
├── commands/                     # Slash 命令
│   ├── setup.md
│   └── configure.md
├── dist/                         # 编译输出（已提交，开箱即用）
├── tests/                        # 测试文件（单元测试 + 手动测试指南）
│   ├── config.test.ts
│   ├── render.test.ts
│   ├── stdin.test.ts
│   ├── validation.test.ts
│   ├── setup.ts
│   └── manual-test.md
├── package.json
└── tsconfig.json
```

## 测试

```bash
npm install              # 仅开发时需要
npm test                 # 运行所有测试（77 tests）
npm run test:coverage    # 测试覆盖率
```

### 手动测试

```bash
echo '{"model":{"display_name":"Claude Opus 4.6"},"context_window":{"context_window_size":200000,"current_usage":{"input_tokens":45000}}}' | node dist/index.js
```

## 故障排除

1. **状态栏不显示**
   - 检查 `~/.claude/settings.json` 中 `statusLine` 配置
   - 验证 `node` 和插件路径正确
   - 重启 Claude Code 或运行 `/reload-plugins`

2. **显示"Unknown"**
   - 确保 Claude Code 版本 >= 2.1.6
   - 检查 stdin 数据格式

3. **性能问题**
   - 在 settings.json 中增加 `interval` 值（如 500ms）

4. **终端颜色问题**
   - 检查终端 ANSI 颜色支持
   - 使用 `dim` 颜色或禁用颜色

## 许可证

MIT
