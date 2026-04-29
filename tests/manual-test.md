# 测试Claude Token HUD插件

此命令帮助您测试Claude Token HUD插件的功能和显示效果。

## 测试方法

### 方法1：模拟stdin测试
创建一个测试JSON文件，模拟Claude Code的stdin输入：

```bash
# 创建测试数据
cat > test-data.json << 'EOF'
{
  "model": {
    "id": "anthropic.claude-3-5-sonnet-20241022",
    "display_name": "Claude 3.5 Sonnet"
  },
  "context_window": {
    "context_window_size": 200000,
    "current_usage": {
      "input_tokens": 45000,
      "output_tokens": 39000,
      "cache_creation_input_tokens": 5000,
      "cache_read_input_tokens": 1000
    },
    "used_percentage": 47.5
  },
  "rate_limits": {
    "five_hour": {
      "used_percentage": 15.3,
      "resets_at": 1744118400
    },
    "seven_day": {
      "used_percentage": 3.7,
      "resets_at": 1744723200
    }
  },
  "transcript_path": "/path/to/transcript.json",
  "cwd": "/home/user/projects"
}
EOF

# 运行插件测试
cat test-data.json | node dist/index.js
```

### 方法2：使用测试脚本
创建测试脚本，测试不同场景：

```bash
#!/bin/bash
# test-scenarios.sh

echo "=== 测试场景1：完整数据 ==="
cat << 'EOF' | node dist/index.js
{
  "model": {"display_name": "Claude Opus 4.6"},
  "context_window": {
    "context_window_size": 200000,
    "current_usage": {
      "input_tokens": 45000,
      "output_tokens": 39000
    }
  },
  "rate_limits": {
    "five_hour": {"used_percentage": 15},
    "seven_day": {"used_percentage": 3}
  }
}
EOF

echo -e "\n=== 测试场景2：最小数据 ==="
cat << 'EOF' | node dist/index.js
{
  "model": {"id": "claude-3-haiku"},
  "context_window": {"context_window_size": 100000}
}
EOF

echo -e "\n=== 测试场景3：高使用率 ==="
cat << 'EOF' | node dist/index.js
{
  "model": {"display_name": "Claude Sonnet 3.5"},
  "context_window": {
    "context_window_size": 200000,
    "current_usage": {
      "input_tokens": 180000,
      "output_tokens": 10000
    }
  },
  "rate_limits": {
    "five_hour": {"used_percentage": 95},
    "seven_day": {"used_percentage": 85}
  }
}
EOF

echo -e "\n=== 测试场景4：速率限制已满 ==="
cat << 'EOF' | node dist/index.js
{
  "model": {"display_name": "Claude Opus"},
  "rate_limits": {
    "five_hour": {"used_percentage": 100},
    "seven_day": {"used_percentage": 100}
  }
}
EOF
```

## 测试用例

### 基础功能测试

1. **模型名称显示**
   - 测试完整模型名称显示
   - 测试模型ID格式化
   - 测试未知模型处理

2. **Token计数**
   - 测试各种token类型的显示
   - 测试总数计算
   - 测试大数字格式化（k/M单位）

3. **上下文进度条**
   - 测试百分比计算
   - 测试进度条渲染
   - 测试颜色编码（绿/黄/红）

4. **速率限制**
   - 测试百分比显示
   - 测试重置时间格式化
   - 测试颜色编码

### 配置测试

1. **布局模式**
   ```bash
   # 测试紧凑模式
   echo '{"model":{"display_name":"Test"}}' | node dist/index.js --config test-config-compact.json
  
   # 测试详细模式  
   echo '{"model":{"display_name":"Test"}}' | node dist/index.js --config test-config-detailed.json
   ```

2. **显示选项**
   - 测试启用/禁用各个显示组件
   - 测试分隔符显示
   - 测试数字格式化选项

3. **颜色主题**
   - 测试不同颜色设置
   - 测试阈值调整
   - 测试进度条样式

### 边界条件测试

1. **空数据测试**
   ```bash
   echo '{}' | node dist/index.js
   echo '' | node dist/index.js
   ```

2. **无效数据测试**
   ```bash
   echo '{"invalid": "data"}' | node dist/index.js
   echo 'not json' | node dist/index.js
   ```

3. **极端数值测试**
   ```bash
   # 零值
   echo '{"context_window":{"current_usage":{"input_tokens":0}}}' | node dist/index.js
  
   # 超大数值
   echo '{"context_window":{"current_usage":{"input_tokens":9999999}}}' | node dist/index.js
  
   # 负值
   echo '{"context_window":{"current_usage":{"input_tokens":-100}}}' | node dist/index.js
   ```

### 性能测试

1. **响应时间测试**
   ```bash
   time echo '{"model":{"display_name":"Test"}}' | node dist/index.js
   ```

2. **内存使用测试**
   ```bash
   /usr/bin/time -v echo '{"model":{"display_name":"Test"}}' | node dist/index.js 2>&1 | grep -E "Maximum resident|Elapsed"
   ```

3. **频繁调用测试**
   ```bash
   for i in {1..100}; do
     echo '{"model":{"display_name":"Test"}}' | node dist/index.js > /dev/null
   done
   ```

## 集成测试

### 与Claude Code集成测试

1. **实际环境测试**
   - 在Claude Code中启用插件
   - 进行实际对话，观察状态栏更新
   - 测试不同模型切换

2. **配置变更测试**
   - 修改配置文件
   - 重启Claude Code，验证配置生效
   - 测试配置回退机制

### 终端兼容性测试

1. **不同终端测试**
   - GNOME Terminal
   - Kitty
   - Alacritty
   - Windows Terminal
   - iTerm2

2. **颜色支持测试**
   - 测试ANSI颜色支持
   - 测试无颜色环境（TERM=dumb）
   - 测试真彩色支持

## 自动化测试

### 单元测试
运行项目自带的单元测试：

```bash
npm test
```

测试覆盖：
- stdin数据解析
- 百分比计算
- 格式化函数
- 配置验证

### 集成测试
运行集成测试套件：

```bash
npm run test:integration
```

### 端到端测试
运行完整的端到端测试：

```bash
npm run test:e2e
```

## 测试报告

测试完成后，生成测试报告：

```bash
# 运行所有测试并生成报告
npm run test:all -- --coverage

# 查看覆盖率报告
open coverage/lcov-report/index.html
```

## 常见问题测试

### 问题1：状态栏闪烁
测试方法：连续快速调用插件，观察输出稳定性

### 问题2：内存泄漏
测试方法：长时间运行插件，监控内存使用情况

### 问题3：编码问题
测试方法：测试特殊字符和Unicode处理

### 问题4：性能影响
测试方法：监控插件对Claude Code响应时间的影响

## 调试技巧

### 启用调试模式
设置环境变量启用详细日志：

```bash
export CLAUDE_HUD_DEBUG=1
echo '{"model":{"display_name":"Test"}}' | node dist/index.js
```

### 查看原始数据
添加`--raw`参数查看原始解析数据：

```bash
echo '{"model":{"display_name":"Test"}}' | node dist/index.js --raw
```

### 性能分析
使用Node.js分析工具：

```bash
node --prof dist/index.js < test-data.json
node --prof-process isolate-*.log > processed.txt
```

## 测试数据生成器

使用以下脚本生成随机测试数据：

```javascript
// generate-test-data.js
function generateTestData() {
  return {
    model: {
      id: `anthropic.claude-${Math.floor(Math.random() * 5)}`,
      display_name: `Claude ${['Opus', 'Sonnet', 'Haiku'][Math.floor(Math.random() * 3)]} ${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`
    },
    context_window: {
      context_window_size: [100000, 200000, 400000][Math.floor(Math.random() * 3)],
      current_usage: {
        input_tokens: Math.floor(Math.random() * 100000),
        output_tokens: Math.floor(Math.random() * 50000)
      }
    }
  };
}

console.log(JSON.stringify(generateTestData(), null, 2));
```

运行：
```bash
node generate-test-data.js | node dist/index.js
```