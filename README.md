# Claude Token HUD Plugin

> 为Claude Code开发的状态栏插件，实时显示token使用量、模型信息和上下文窗口使用百分比

![展示效果](pro.png)

## 项目目标

开发一个Claude Code插件，在状态栏实时显示：
- 模型名称和版本
- Token使用量（输入/输出/缓存）
- 上下文窗口使用百分比
- 支持颜色编码和进度条显示
- 可配置的显示选项

## 当前进度状态

### 已完成的核心功能

#### 1. 数据解析模块 (`src/stdin.ts`)
- stdin数据读取和解析
- 模型名称提取和格式化（支持新旧 Anthropic 模型 ID 格式）
- Token总数计算
- 上下文窗口百分比计算（支持原生百分比）
- 完整HUD数据提取

#### 2. 类型系统 (`src/types.ts`)
- StdinData接口定义
- TokenUsage（token使用详情）
- HudData（完整HUD数据）

#### 3. 配置管理 (`src/config.ts`)
- 默认配置定义
- 配置文件加载/保存
- 配置验证和合并
- 支持布局模式（紧凑/详细）
- 颜色主题配置
- 格式化选项

#### 4. 渲染系统 (`src/render/`)
- 主渲染器 (`index.ts`) - 协调所有组件
- 模型行 (`model-line.ts`) - 显示模型名称
- Token行 (`token-line.ts`) - 显示详细token计数
- 上下文条 (`context-bar.ts`) - 进度条/百分比显示
- 颜色系统 (`colors.ts`) - ANSI颜色编码

#### 5. 工具模块 (`src/utils/`)
- 格式化工具 (`format.ts`) - 数字格式化、文本截断等
- 验证工具 (`validation.ts`) - 数据验证、清理和规范化

#### 6. 测试套件
- `tests/stdin.test.ts` - stdin模块测试 (15 tests)
- `tests/config.test.ts` - 配置模块测试 (18 tests)
- `tests/render.test.ts` - 渲染模块测试 (24 tests)
- `tests/validation.test.ts` - validation模块测试 (20 tests)
- **总计: 77 tests, 全部通过**

## 项目结构

```
claude-hud-for-api/
├── .claude-plugin/                    # 插件元数据
│   ├── plugin.json                   # 插件描述
│   └── marketplace.json              # 市场列表配置
├── src/
│   ├── index.ts                      # 主入口点
│   ├── stdin.ts                      # stdin数据解析
│   ├── types.ts                      # TypeScript类型定义
│   ├── config.ts                     # 配置管理
│   ├── render/                       # 渲染模块
│   │   ├── index.ts                  # 渲染协调器
│   │   ├── model-line.ts             # 模型信息显示
│   │   ├── token-line.ts             # token使用量显示
│   │   ├── context-bar.ts            # 上下文进度条
│   │   └── colors.ts                 # 颜色主题系统
│   └── utils/
│       ├── format.ts                 # 格式化工具
│       └── validation.ts             # 数据验证工具
├── commands/                         # Claude Code命令
│   ├── setup.md                      # 安装设置指南
│   ├── configure.md                  # 配置指南
│   └── test.md                       # 测试命令
├── dist/                             # 编译输出
├── tests/                            # 测试文件
│   ├── stdin.test.ts
│   ├── config.test.ts
│   ├── render.test.ts
│   ├── validation.test.ts
│   └── setup.ts
├── package.json
├── tsconfig.json
├── jest.config.js
├── install.sh
├── uninstall.sh
├── .gitignore
└── README.md
```

## 技术栈

- **语言**: TypeScript 5.0+
- **运行时**: Node.js 16+
- **构建工具**: TypeScript Compiler (tsc)
- **测试框架**: Jest 29+
- **目标平台**: Claude Code 2.1.0+

## 快速开始

### 前提条件
```bash
node --version  # 需要 >= 16.0.0
```

### 安装
```bash
# 1. 克隆项目
git clone https://github.com/holyshite/claude-hud-for-api.git
cd claude-hud-for-api

# 2. 安装依赖并编译
npm install
npm run build

# 3. 记录关键路径（下面配置要用）
echo "Node路径: $(which node)"
echo "插件路径: $(pwd)"
```

### 配置 Claude Code

编辑 `~/.claude/settings.json`，添加或修改 `statusLine`：

```json
{
  "statusLine": {
    "type": "command",
    "command": "/home/peter/.nvm/versions/node/v18.20.8/bin/node /home/peter/projects/claude-hud-for-api/dist/index.js",
    "padding": 1
  }
}
```

> 注意：将上面的路径替换为第3步输出的实际路径。格式：`<node路径> <插件路径>/dist/index.js`，中间用空格隔开，不要用 `bash -c` 包裹。

### 验证安装
重启 Claude Code，状态栏应显示类似以下信息：
```
Claude Opus 4.6 | ██████░░░░ 42% 84k/200k
```

## 配置选项

#### 显示设置
```json
{
  "display": {
    "layout": "compact",           // "compact" | "detailed"
    "showModel": true,
    "showContextBar": true,
    "showTokenCounts": false,
    "showSeparators": true,
    "compactNumbers": true
  }
}
```

#### 颜色设置
```json
{
  "colors": {
    "safeThreshold": 70,          // 安全阈值（绿色）
    "warningThreshold": 90,       // 警告阈值（黄色→红色）
    "modelColor": "cyan",         // 模型颜色
    "progressStyle": "bar"        // "bar" | "text" | "percentage"
  }
}
```

#### 格式设置
```json
{
  "format": {
    "modelFormat": "{name}",      // 支持 {name} 和 {id}
    "percentagePrecision": 0      // 0-3位小数
  }
}
```

### 显示示例

#### 紧凑模式（默认）
```
Claude Opus 4.6 | ██████░░░░ 42% 84k/200k
```

#### 详细模式
```
Claude Opus 4.6
██████░░░░ 42% 84k/200k
In: 45k | Out: 39k | Total: 84k
```

#### 启用token计数
```
Claude Opus 4.6 | ██████░░░░ 42% 84k/200k | In: 45k | Out: 39k | Total: 84k
```

## 测试

```bash
npm test              # 运行所有测试（77 tests）
npm run test:watch    # 监视模式
npm run test:coverage # 生成覆盖率报告
```

### 手动测试
```bash
echo '{"model":{"display_name":"Claude Opus 4.6"},"context_window":{"context_window_size":200000,"current_usage":{"input_tokens":45000}}}' | node dist/index.js
```

## 故障排除

1. **状态栏不显示**
   - 检查 `~/.claude/settings.json` 配置
   - 验证插件路径是否正确
   - 重启Claude Code

2. **显示"Unknown"**
   - 确保Claude Code版本 >= 2.1.6
   - 检查stdin数据格式

3. **性能问题**
   - 增加 `interval` 值（如500ms）
   - 禁用不必要的显示选项

4. **终端颜色问题**
   - 检查终端ANSI颜色支持
   - 使用 `dim` 颜色或禁用颜色

## 许可证

MIT License

---

**项目状态**: 就绪，可以安装使用
**最后更新**: 2026-04-28
**版本**: 1.0.0
