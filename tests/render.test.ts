import { describe, it, expect } from '@jest/globals';
import { HudData, TokenUsage } from '../src/types';
import { HudConfig, DEFAULT_CONFIG } from '../src/config';
import {
  renderHud,
  renderAdaptiveHud,
  renderModelLine,
  renderTokenLine,
  renderContextBar
} from '../src/render';

// 测试数据
const createTestData = (): HudData => ({
  modelName: 'Claude Opus 4.6',
  modelId: 'anthropic.claude-4-opus',
  contextWindowSize: 200000,
  tokenUsage: {
    inputTokens: 45000,
    outputTokens: 39000,
    cacheCreationTokens: 5000,
    cacheReadTokens: 1000,
    totalTokens: 90000
  },
  contextPercentage: 45,
  hasNativePercentage: true
});

const createMinimalData = (): HudData => ({
  modelName: 'Claude Haiku',
  tokenUsage: {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    totalTokens: 0
  },
  contextPercentage: 0,
  hasNativePercentage: false
});

describe('render模块', () => {
  describe('renderModelLine', () => {
    it('应该渲染模型名称', () => {
      const data = createTestData();
      const config = DEFAULT_CONFIG;

      const result = renderModelLine(data, config);
      expect(result).toContain('Claude Opus 4.6');
      expect(result).toContain('\x1b['); // ANSI颜色代码
    });

    it('应该使用自定义格式', () => {
      const data = createTestData();
      const config: HudConfig = {
        ...DEFAULT_CONFIG,
        format: {
          ...DEFAULT_CONFIG.format,
          modelFormat: 'Model: {name} ({id})'
        }
      };

      const result = renderModelLine(data, config);
      expect(result).toContain('Model: Claude Opus 4.6 (anthropic.claude-4-opus)');
    });

    it('应该返回空字符串当showModel为false时', () => {
      const data = createTestData();
      const config: HudConfig = {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          showModel: false
        }
      };

      const result = renderModelLine(data, config);
      expect(result).toBe('');
    });
  });

  describe('renderTokenLine', () => {
    it('应该渲染token计数当启用时', () => {
      const data = createTestData();
      const config: HudConfig = {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          showTokenCounts: true
        }
      };

      const result = renderTokenLine(data, config);
      expect(result).toContain('In:');
      expect(result).toContain('Out:');
      expect(result).toContain('Total:');
    });

    it('应该使用紧凑数字格式', () => {
      const data = createTestData();
      const config: HudConfig = {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          showTokenCounts: true,
          compactNumbers: true
        }
      };

      const result = renderTokenLine(data, config);
      expect(result).toContain('45k'); // 45,000 -> 45k
      expect(result).toContain('39k'); // 39,000 -> 39k
      expect(result).toContain('90k'); // 90,000 -> 90k
    });

    it('应该使用完整数字格式', () => {
      const data = createTestData();
      const config: HudConfig = {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          showTokenCounts: true,
          compactNumbers: false
        }
      };

      const result = renderTokenLine(data, config);
      expect(result).toContain('45000');
      expect(result).toContain('39000');
      expect(result).toContain('90000');
    });

    it('应该不显示零值token', () => {
      const data = createMinimalData();
      const config: HudConfig = {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          showTokenCounts: true
        }
      };

      const result = renderTokenLine(data, config);
      // 当所有token为0时，不显示任何内容
      expect(result).toBe('');
    });

    it('应该返回空字符串当showTokenCounts为false时', () => {
      const data = createTestData();
      const config = DEFAULT_CONFIG; // showTokenCounts默认为false

      const result = renderTokenLine(data, config);
      expect(result).toBe('');
    });
  });

  describe('renderContextBar', () => {
    it('应该渲染进度条样式', () => {
      const data = createTestData();
      const config = DEFAULT_CONFIG; // progressStyle默认为'bar'

      const result = renderContextBar(data, config);
      expect(result).toContain('█'); // 进度条字符
      expect(result).toContain('45%'); // 百分比
      expect(result).toContain('90k/200k'); // token计数
    });

    it('应该渲染文本样式', () => {
      const data = createTestData();
      const config: HudConfig = {
        ...DEFAULT_CONFIG,
        colors: {
          ...DEFAULT_CONFIG.colors,
          progressStyle: 'text'
        }
      };

      const result = renderContextBar(data, config);
      expect(result).toContain('45%');
      expect(result).not.toContain('█'); // 不应该有进度条
    });

    it('应该渲染百分比样式', () => {
      const data = createTestData();
      const config: HudConfig = {
        ...DEFAULT_CONFIG,
        colors: {
          ...DEFAULT_CONFIG.colors,
          progressStyle: 'percentage'
        }
      };

      const result = renderContextBar(data, config);
      expect(result).toContain('45%');
    });

    it('应该显示不同的颜色基于百分比', () => {
      const safeData: HudData = {
        ...createTestData(),
        contextPercentage: 50 // 低于安全阈值70
      };

      const warningData: HudData = {
        ...createTestData(),
        contextPercentage: 80 // 高于安全阈值70，低于警告阈值90
      };

      const dangerData: HudData = {
        ...createTestData(),
        contextPercentage: 95 // 高于警告阈值90
      };

      const config = DEFAULT_CONFIG;

      const safeResult = renderContextBar(safeData, config);
      const warningResult = renderContextBar(warningData, config);
      const dangerResult = renderContextBar(dangerData, config);

      // 检查包含ANSI颜色代码
      expect(safeResult).toContain('\x1b[');
      expect(warningResult).toContain('\x1b[');
      expect(dangerResult).toContain('\x1b[');
    });

    it('应该返回空字符串当showContextBar为false时', () => {
      const data = createTestData();
      const config: HudConfig = {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          showContextBar: false
        }
      };

      const result = renderContextBar(data, config);
      expect(result).toBe('');
    });
  });

  describe('renderHud', () => {
    it('应该渲染紧凑布局', () => {
      const data = createTestData();
      const config = DEFAULT_CONFIG; // 默认为compact布局

      const result = renderHud(data, config);

      // 紧凑布局应该是一行
      const lines = result.split('\n');
      expect(lines.length).toBe(1);

      // 应该包含各个部分
      expect(result).toContain('Claude Opus 4.6');
      expect(result).toContain('45%');
    });

    it('应该渲染详细布局', () => {
      const data = createTestData();
      const config: HudConfig = {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          layout: 'detailed',
          showTokenCounts: true
        }
      };

      const result = renderHud(data, config);

      // 详细布局应该是多行
      const lines = result.split('\n').filter(line => line.trim().length > 0);
      expect(lines.length).toBeGreaterThan(1);

      // 检查各个部分
      expect(lines[0]).toContain('Claude Opus 4.6'); // 模型行
      expect(result).toContain('45%'); // 上下文行
      expect(result).toContain('In:'); // token行
    });

    it('应该根据配置过滤组件', () => {
      const data = createTestData();
      const config: HudConfig = {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          showModel: false,
          showTokenCounts: true
        }
      };

      const result = renderHud(data, config);

      expect(result).not.toContain('Claude Opus 4.6'); // 模型被隐藏
      expect(result).toContain('In:'); // token计数显示
    });

    it('应该使用分隔符', () => {
      const data = createTestData();
      const configWithSeparators: HudConfig = {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          showSeparators: true
        }
      };

      const configWithoutSeparators: HudConfig = {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          showSeparators: false
        }
      };

      const withSeparators = renderHud(data, configWithSeparators);
      const withoutSeparators = renderHud(data, configWithoutSeparators);

      expect(withSeparators).toContain(' | ');
      expect(withoutSeparators).not.toContain(' | ');
    });
  });

  describe('renderAdaptiveHud', () => {
    it('应该适应终端宽度', () => {
      const data = createTestData();
      const config = DEFAULT_CONFIG;

      // 测试宽终端
      const wideResult = renderAdaptiveHud(data, config, 200);

      // 测试窄终端
      const narrowResult = renderAdaptiveHud(data, config, 40);

      // 窄终端的输出应该更短或相同
      const wideLength = wideResult.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').length;
      const narrowLength = narrowResult.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').length;

      expect(narrowLength).toBeLessThanOrEqual(wideLength);
    });

    it('应该在太宽时切换到紧凑模式', () => {
      const data = createTestData();
      const config: HudConfig = {
        ...DEFAULT_CONFIG,
        display: {
          ...DEFAULT_CONFIG.display,
          layout: 'detailed'
        }
      };

      // 详细模式在窄终端上
      const result = renderAdaptiveHud(data, config, 30);

      // 应该自动切换到紧凑模式或简化
      const lines = result.split('\n');
      expect(lines.length).toBe(1); // 应该是一行
    });

    it('应该进一步简化当仍然太宽时', () => {
      const data = createTestData();
      const config = DEFAULT_CONFIG;

      // 非常窄的终端
      const result = renderAdaptiveHud(data, config, 20);

      // 应该只显示模型和百分比
      expect(result.length).toBeLessThanOrEqual(20);
    });

    it('应该截断当仍然太长时', () => {
      const data = createTestData();
      const config = DEFAULT_CONFIG;

      // 极端窄的终端
      const result = renderAdaptiveHud(data, config, 10);

      expect(result.length).toBeLessThanOrEqual(10);
      if (result.length === 10) {
        expect(result.endsWith('...')).toBe(true);
      }
    });

    it('应该处理未知终端宽度', () => {
      const data = createTestData();
      const config = DEFAULT_CONFIG;

      // 宽度为0或负数
      const result1 = renderAdaptiveHud(data, config, 0);
      const result2 = renderAdaptiveHud(data, config, -1);

      // 应该返回正常输出
      expect(result1.length).toBeGreaterThan(0);
      expect(result2.length).toBeGreaterThan(0);
    });
  });

  describe('颜色编码', () => {
    it('应该根据阈值应用颜色', () => {
      const data: HudData = {
        ...createTestData(),
        contextPercentage: 95, // 危险级别
      };

      const result = renderHud(data, DEFAULT_CONFIG);

      // 应该包含ANSI颜色代码
      expect(result).toContain('\x1b[');
    });
  });
});