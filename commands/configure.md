# 配置Claude Token HUD插件

此命令帮助您配置Claude Token HUD插件的显示选项、颜色主题和格式设置。

## 配置位置

插件配置文件位于：
```
~/.claude/plugins/claude-hud/config.json
```

## 配置选项

### 显示设置 (display)

```json
{
  "display": {
    "layout": "compact",           // 布局模式: "compact"（紧凑）或 "detailed"（详细）
    "showModel": true,            // 显示模型名称
    "showContextBar": true,       // 显示上下文进度条
    "showTokenCounts": false,     // 显示详细token计数
    "showRateLimits": true,       // 显示速率限制
    "showSeparators": true,       // 显示分隔符（|）
    "compactNumbers": true        // 使用k/M单位格式化大数字
  }
}
```

### 颜色设置 (colors)

```json
{
  "colors": {
    "safeThreshold": 70,          // 安全阈值（百分比），低于此值为绿色
    "warningThreshold": 90,       // 警告阈值（百分比），高于此值为红色
    "modelColor": "cyan",         // 模型名称颜色
    "progressStyle": "bar"        // 进度条样式: "bar"（条形）| "text"（文本）| "percentage"（百分比）
  }
}
```

### 格式设置 (format)

```json
{
  "format": {
    "modelFormat": "{name}",      // 模型显示格式，支持 {name} 和 {id}
    "percentagePrecision": 0      // 百分比小数位数（0-3）
  }
}
```

## 配置示例

### 示例1：紧凑模式（默认）
```json
{
  "display": {
    "layout": "compact",
    "showModel": true,
    "showContextBar": true,
    "showTokenCounts": false,
    "showRateLimits": true,
    "showSeparators": true,
    "compactNumbers": true
  },
  "colors": {
    "safeThreshold": 70,
    "warningThreshold": 90,
    "modelColor": "cyan",
    "progressStyle": "bar"
  },
  "format": {
    "modelFormat": "{name}",
    "percentagePrecision": 0
  }
}
```

显示效果：
```
[Claude Opus 4.6] [████░░░░░░ 42% (84k/200k)] [5h: 15%] [7d: 3%]
```

### 示例2：详细模式
```json
{
  "display": {
    "layout": "detailed",
    "showModel": true,
    "showContextBar": true,
    "showTokenCounts": true,
    "showRateLimits": true,
    "showSeparators": true,
    "compactNumbers": true
  }
}
```

显示效果：
```
Claude Opus 4.6
Context: 84k/200k (42%) ★
5h: 15% | 7d: 3%
In: 45k | Out: 39k | Total: 84k
```

### 示例3：最小模式
```json
{
  "display": {
    "layout": "compact",
    "showModel": true,
    "showContextBar": true,
    "showTokenCounts": false,
    "showRateLimits": false,
    "showSeparators": false,
    "compactNumbers": false
  },
  "colors": {
    "progressStyle": "percentage"
  }
}
```

显示效果：
```
Claude Opus 4.6 42% (84,000/200,000)
```

## 可用颜色

模型名称支持以下颜色：
- `green` - 绿色
- `yellow` - 黄色
- `red` - 红色
- `cyan` - 青色（默认）
- `blue` - 蓝色
- `magenta` - 洋红色
- `dim` - 暗淡色

## 交互式配置向导

您可以通过运行以下命令启动交互式配置向导：

```bash
node configure.js
```

向导将引导您完成以下步骤：

1. **选择布局模式**
   - 紧凑模式（单行显示）
   - 详细模式（多行显示）

2. **选择显示内容**
   - 模型名称
   - 上下文进度条
   - 详细token计数
   - 速率限制

3. **配置颜色主题**
   - 模型颜色
   - 进度条样式
   - 阈值设置

4. **配置格式**
   - 数字格式化
   - 百分比精度

5. **预览效果**
   - 实时预览配置效果
   - 保存配置

## 手动编辑配置

您也可以手动编辑配置文件：

```bash
# 编辑配置文件
nano ~/.claude/plugins/claude-hud/config.json

# 或者使用您喜欢的编辑器
code ~/.claude/plugins/claude-hud/config.json
```

编辑后，保存文件并重启Claude Code即可生效。

## 恢复默认配置

要恢复默认配置，只需删除配置文件：

```bash
rm ~/.claude/plugins/claude-hud/config.json
```

重启Claude Code后，插件会自动创建新的默认配置文件。

## 配置验证

插件会自动验证配置文件的格式和有效性。如果发现无效配置，会使用默认值替代并显示警告。

常见验证规则：
- 百分比阈值必须在0-100之间
- 颜色名称必须是预定义的颜色之一
- 布局模式必须是"compact"或"detailed"
- 进度条样式必须是"bar"、"text"或"percentage"

## 故障排除

### 配置不生效
- 确保配置文件路径正确
- 检查JSON格式是否正确
- 重启Claude Code

### 配置错误导致插件失败
- 插件会自动回退到默认配置
- 检查终端中的错误信息
- 删除配置文件重新配置

### 终端颜色问题
- 如果终端不支持ANSI颜色，颜色设置可能无效
- 考虑使用`dim`颜色或禁用颜色

## 高级配置

### 自定义模型格式
您可以使用`{name}`和`{id}`占位符自定义模型显示格式：

```json
{
  "format": {
    "modelFormat": "Model: {name} ({id})"
  }
}
```

### 调整更新频率
在`~/.claude/settings.json`中调整`interval`值（毫秒）：

```json
{
  "statusLine": {
    "interval": 500  // 每500ms更新一次
  }
}
```

### 禁用插件
要临时禁用插件，可以在`~/.claude/settings.json`中注释掉或移除`statusLine`配置。