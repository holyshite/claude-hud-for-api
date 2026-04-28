import { describe, it, expect } from '@jest/globals';
import {
  isValidStdinData,
  isValidPercentage,
  isValidTokenCount,
  isValidModelId,
  isValidContextWindowSize,
  isValidTimestamp,
  validateHudData,
  validateStdinData,
  sanitizeStdinData
} from '../src/utils/validation';
import type { StdinData, HudData } from '../src/types';

describe('validation模块', () => {
  describe('isValidStdinData', () => {
    it('应该验证有效的StdinData对象', () => {
      const validData: StdinData = {
        model: { display_name: 'Claude Opus' },
        context_window: { context_window_size: 200000 }
      };
      expect(isValidStdinData(validData)).toBe(true);
    });

    it('应该拒绝非对象值', () => {
      expect(isValidStdinData(null)).toBe(false);
      expect(isValidStdinData(undefined)).toBe(false);
      expect(isValidStdinData(123)).toBe(false);
      expect(isValidStdinData('string')).toBe(false);
      expect(isValidStdinData([])).toBe(false);
    });

    it('应该接受空对象', () => {
      expect(isValidStdinData({})).toBe(true);
    });
  });

  describe('isValidPercentage', () => {
    it('应该验证有效的百分比', () => {
      expect(isValidPercentage(0)).toBe(true);
      expect(isValidPercentage(50)).toBe(true);
      expect(isValidPercentage(100)).toBe(true);
      expect(isValidPercentage(75.5)).toBe(true);
    });

    it('应该拒绝无效的百分比', () => {
      expect(isValidPercentage(-1)).toBe(false);
      expect(isValidPercentage(101)).toBe(false);
      expect(isValidPercentage(NaN)).toBe(false);
      expect(isValidPercentage(Infinity)).toBe(false);
      expect(isValidPercentage(-Infinity)).toBe(false);
      expect(isValidPercentage('50' as any)).toBe(false);
      expect(isValidPercentage(null as any)).toBe(false);
      expect(isValidPercentage(undefined as any)).toBe(false);
    });
  });

  describe('isValidTokenCount', () => {
    it('应该验证有效的token计数', () => {
      expect(isValidTokenCount(0)).toBe(true);
      expect(isValidTokenCount(1000)).toBe(true);
      expect(isValidTokenCount(999999)).toBe(true);
    });

    it('应该拒绝无效的token计数', () => {
      expect(isValidTokenCount(-1)).toBe(false);
      expect(isValidTokenCount(3.14)).toBe(false); // 非整数
      expect(isValidTokenCount(NaN)).toBe(false);
      expect(isValidTokenCount(Infinity)).toBe(false);
      expect(isValidTokenCount('1000' as any)).toBe(false);
      expect(isValidTokenCount(null as any)).toBe(false);
    });
  });

  describe('isValidModelId', () => {
    it('应该验证有效的模型ID', () => {
      expect(isValidModelId('anthropic.claude-3-5-sonnet')).toBe(true);
      expect(isValidModelId('claude-3-haiku')).toBe(true);
      expect(isValidModelId('gpt-4')).toBe(true);
    });

    it('应该拒绝无效的模型ID', () => {
      expect(isValidModelId('')).toBe(false);
      expect(isValidModelId('   ')).toBe(false);
      expect(isValidModelId(123 as any)).toBe(false);
      expect(isValidModelId(null as any)).toBe(false);
      expect(isValidModelId(undefined as any)).toBe(false);
    });
  });

  describe('isValidContextWindowSize', () => {
    it('应该验证有效的上下文窗口大小', () => {
      expect(isValidContextWindowSize(1)).toBe(true);
      expect(isValidContextWindowSize(1000)).toBe(true);
      expect(isValidContextWindowSize(200000)).toBe(true);
    });

    it('应该拒绝无效的上下文窗口大小', () => {
      expect(isValidContextWindowSize(0)).toBe(false);
      expect(isValidContextWindowSize(-1)).toBe(false);
      expect(isValidContextWindowSize(3.14)).toBe(false);
      expect(isValidContextWindowSize(NaN)).toBe(false);
      expect(isValidContextWindowSize('1000' as any)).toBe(false);
    });
  });

  describe('isValidTimestamp', () => {
    it('应该验证有效的时间戳', () => {
      expect(isValidTimestamp(1)).toBe(true);
      expect(isValidTimestamp(1712345678)).toBe(true);
    });

    it('应该拒绝无效的时间戳', () => {
      expect(isValidTimestamp(0)).toBe(false);
      expect(isValidTimestamp(-1)).toBe(false);
      expect(isValidTimestamp(3.14)).toBe(false);
      expect(isValidTimestamp(NaN)).toBe(false);
      expect(isValidTimestamp('timestamp' as any)).toBe(false);
    });
  });

  describe('validateHudData', () => {
    it('应该验证有效的HUD数据', () => {
      const validHudData: HudData = {
        modelName: 'Claude Opus',
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
      };

      const result = validateHudData(validHudData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测无效的HUD数据', () => {
      const invalidHudData: any = {
        modelName: '',
        contextWindowSize: -1,
        tokenUsage: {
          inputTokens: -100,
          outputTokens: 39000,
          cacheCreationTokens: 5000,
          cacheReadTokens: 1000,
          totalTokens: 90000
        },
        contextPercentage: 150,
        hasNativePercentage: true
      };

      const result = validateHudData(invalidHudData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

  });

  describe('validateStdinData', () => {
    it('应该验证有效的Stdin数据', () => {
      const validStdinData: StdinData = {
        model: {
          id: 'anthropic.claude-3-5-sonnet',
          display_name: 'Claude 3.5 Sonnet'
        },
        context_window: {
          context_window_size: 200000,
          current_usage: {
            input_tokens: 45000,
            output_tokens: 39000,
            cache_creation_input_tokens: 5000,
            cache_read_input_tokens: 1000
          },
          used_percentage: 47.5,
          remaining_percentage: 52.5
        }
      };

      const result = validateStdinData(validStdinData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测Stdin数据中的问题', () => {
      const problematicStdinData: any = {
        model: {
          id: 123, // 无效的模型ID
          display_name: 456 // 无效的显示名称
        },
        context_window: {
          context_window_size: -100, // 无效的窗口大小
          current_usage: {
            input_tokens: -50, // 无效的token计数
            output_tokens: 'invalid' // 无效的类型
          },
          used_percentage: 150 // 无效的百分比
        }
      };

      const result = validateStdinData(problematicStdinData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('应该处理部分数据', () => {
      const partialStdinData: StdinData = {
        model: {
          id: 'claude-3-haiku'
        }
        // 其他字段缺失是允许的
      };

      const result = validateStdinData(partialStdinData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('sanitizeStdinData', () => {
    it('应该清理和规范化Stdin数据', () => {
      const rawStdinData: any = {
        model: {
          id: '  anthropic.claude-3-5-sonnet  ',
          display_name: '  Claude 3.5 Sonnet  '
        },
        context_window: {
          context_window_size: 200000.7,
          current_usage: {
            input_tokens: 45000.3,
            output_tokens: 39000.8,
            cache_creation_input_tokens: 5000.1,
            cache_read_input_tokens: 1000.9
          },
          used_percentage: 150.5,
          remaining_percentage: -10.2
        }
      };

      const sanitized = sanitizeStdinData(rawStdinData);

      // 验证清理结果
      expect(sanitized.model?.id).toBe('anthropic.claude-3-5-sonnet');
      expect(sanitized.model?.display_name).toBe('Claude 3.5 Sonnet');
      expect(sanitized.context_window?.context_window_size).toBe(200001); // 四舍五入
      expect(sanitized.context_window?.current_usage?.input_tokens).toBe(45000);
      expect(sanitized.context_window?.current_usage?.output_tokens).toBe(39001);
      expect(sanitized.context_window?.current_usage?.cache_creation_input_tokens).toBe(5000);
      expect(sanitized.context_window?.current_usage?.cache_read_input_tokens).toBe(1001);
      expect(sanitized.context_window?.used_percentage).toBe(100); // 限制在0-100
      expect(sanitized.context_window?.remaining_percentage).toBe(0); // 限制在0-100
    });

    it('应该处理缺失的字段', () => {
      const minimalStdinData: StdinData = {
        model: {
          id: 'claude-3-haiku'
        }
      };

      const sanitized = sanitizeStdinData(minimalStdinData);
      expect(sanitized).toEqual(minimalStdinData);
    });

    it('应该不修改已经规范化的数据', () => {
      const cleanStdinData: StdinData = {
        model: {
          id: 'anthropic.claude-3-5-sonnet',
          display_name: 'Claude 3.5 Sonnet'
        },
        context_window: {
          context_window_size: 200000,
          current_usage: {
            input_tokens: 45000,
            output_tokens: 39000,
            cache_creation_input_tokens: 5000,
            cache_read_input_tokens: 1000
          },
          used_percentage: 47.5,
          remaining_percentage: 52.5
        }
      };

      const sanitized = sanitizeStdinData(cleanStdinData);
      expect(sanitized).toEqual(cleanStdinData);
    });
  });
});