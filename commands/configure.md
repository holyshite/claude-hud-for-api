---
description: 交互式配置 HUD 显示选项、颜色和格式
allowed-tools: Read, Write
---

# 配置 Claude HUD

交互式配置 HUD 插件，无需手动编辑 JSON。

## 你的任务

### Step 1: 读取当前配置

Read `~/.claude/plugins/claude-hud/config.json`。如果文件不存在，说明插件尚未初始化，提醒用户先运行 `/claude-hud:setup`。

### Step 2: 展示当前配置和可选菜单

用 AskUserQuestion 让用户选择要配置的模块：

1. **显示设置** — 布局、显示开关、token 分解等
2. **颜色主题** — 阈值颜色、模型名称颜色、进度条样式
3. **格式设置** — 模型名称格式、百分比精度
4. **Git 状态** — 显示分支、脏标记等
5. **恢复默认** — 删除配置文件，恢复出厂设置

### Step 3: 根据选择进行配置

#### 如果选了「显示设置」：

先展示当前 display 配置，然后询问用户想修改哪些项。可配置项及说明：

| 字段 | 当前值 | 说明 | 可选值 |
|------|--------|------|--------|
| `lineLayout` | — | 布局模式 | `compact`（紧凑单行）、`expanded`（多行展开）、`detailed`（经典详细） |
| `showSeparators` | — | 各区块间用 `\|` 分隔 | `true` / `false` |
| `showModel` | — | 显示模型名称 | `true` / `false` |
| `showContextBar` | — | 显示上下文进度条 | `true` / `false` |
| `contextValue` | — | 上下文数值显示模式 | `percent`（百分比）、`tokens`（绝对数）、`both`（百分比+绝对数）、`remaining`（剩余百分比） |
| `showTokenCounts` | — | 显示输入/输出/总计 token | `true` / `false` |
| `showTokenBreakdown` | — | 显示 token 分类（in/cache） | `true` / `false` |
| `compactNumbers` | — | 大数字用 k/M 单位 | `true` / `false` |
| `showDuration` | — | 显示会话时长 | `true` / `false` |
| `showSpeed` | — | 显示 token 生成速率 | `true` / `false` |
| `showUsage` | — | 显示 API 速率限制（5h/7d） | `true` / `false` |
| `usageBarEnabled` | — | 速率限制进度条 | `true` / `false` |
| `usageThreshold` | — | 速率限制警告阈值（0-100） | 数字 |
| `showSessionTokens` | — | 显示会话累计 token | `true` / `false` |
| `showSessionName` | — | 显示会话名称 | `true` / `false` |

AskUserQuestion 每次最多 4 个选项，分多次询问或让用户在回答中自由描述想改什么。

用户说明要改的项后，使用 Edit 工具更新 config.json 中对应字段。

#### 如果选了「颜色主题」：

先展示当前 color 配置，然后询问用户想修改的项：

| 字段 | 当前值 | 说明 | 可选值 |
|------|--------|------|--------|
| `safeThreshold` | — | 安全阈值（绿色） | 0–100 |
| `warningThreshold` | — | 警告阈值（红色） | 0–100 |
| `modelColor` | — | 模型名称颜色 | `green`、`yellow`、`red`、`cyan`、`blue`、`magenta`、`dim` |
| `progressStyle` | — | 进度条样式 | `bar`（条形 `████`）、`text`（纯文本）、`percentage`（仅百分比） |

#### 如果选了「格式设置」：

先展示当前 format 配置，然后询问用户想修改的项：

| 字段 | 当前值 | 说明 | 可选值 |
|------|--------|------|--------|
| `modelFormat` | — | 模型名称格式，支持 `{name}`（显示名）、`{id}`（模型 ID） | 字符串 |
| `percentagePrecision` | — | 百分比小数位数 | 0–3 |

#### 如果选了「Git 状态」：

先展示当前 gitStatus 配置，然后询问用户想修改的项：

| 字段 | 当前值 | 说明 | 可选值 |
|------|--------|------|--------|
| `enabled` | — | 启用 Git 状态显示 | `true` / `false` |
| `showDirty` | — | 显示工作区脏标记 | `true` / `false` |
| `showAheadBehind` | — | 显示 ahead/behind 提交数 | `true` / `false` |
| `showFileStats` | — | 显示文件变更统计（M/A/D/U） | `true` / `false` |

#### 如果选了「恢复默认」：

Delete `~/.claude/plugins/claude-hud/config.json`。插件下次运行时会自动创建新的默认配置文件。

### Step 4: 确认结果

修改完成后，告知用户修改了哪些字段，并提醒重启 Claude Code 或运行 `/reload-plugins` 使配置生效。
