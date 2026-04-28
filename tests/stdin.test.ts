import { describe, it, expect } from '@jest/globals';
import {
  readStdin,
  getTotalTokens,
  getContextPercentage,
  getModelName,
  extractHudData
} from '../src/stdin';

// Mock stdin stream for testing
const createMockStream = (data: string) => {
  const chunks: Buffer[] = [Buffer.from(data)];
  let listener: ((chunk: Buffer) => void) | undefined;

  return {
    isTTY: false,
    setEncoding: () => {},
    on: (event: string, callback: (chunk: Buffer) => void) => {
      if (event === 'data') {
        listener = callback;
      }
      return this;
    },
    off: () => {},
    pause: () => {},
    emitData: () => {
      if (listener && chunks.length > 0) {
        listener(chunks.shift()!);
      }
    },
    emitEnd: () => {}
  };
};

describe('stdin模块', () => {
  describe('getTotalTokens', () => {
    it('应该计算所有token类型的总和', () => {
      const stdin: any = {
        context_window: {
          current_usage: {
            input_tokens: 100,
            output_tokens: 200,
            cache_creation_input_tokens: 50,
            cache_read_input_tokens: 25
          }
        }
      };

      expect(getTotalTokens(stdin)).toBe(375);
    });

    it('应该处理缺失的usage数据', () => {
      const stdin: any = {
        context_window: {}
      };

      expect(getTotalTokens(stdin)).toBe(0);
    });

    it('应该处理null的current_usage', () => {
      const stdin: any = {
        context_window: {
          current_usage: null
        }
      };

      expect(getTotalTokens(stdin)).toBe(0);
    });
  });

  describe('getContextPercentage', () => {
    it('应该优先使用原生百分比', () => {
      const stdin: any = {
        context_window: {
          used_percentage: 42.5,
          context_window_size: 200000
        }
      };

      expect(getContextPercentage(stdin)).toBe(43); // 四舍五入
    });

    it('应该手动计算百分比当原生数据不可用时', () => {
      const stdin: any = {
        context_window: {
          context_window_size: 1000,
          current_usage: {
            input_tokens: 300,
            output_tokens: 200
          }
        }
      };

      // (300 + 200) / 1000 = 0.5 = 50%
      expect(getContextPercentage(stdin)).toBe(50);
    });

    it('应该处理无效的窗口大小', () => {
      const stdin: any = {
        context_window: {
          context_window_size: 0,
          current_usage: {
            input_tokens: 100,
            output_tokens: 100
          }
        }
      };

      expect(getContextPercentage(stdin)).toBe(0);
    });

    it('应该限制百分比在0-100之间', () => {
      const stdin: any = {
        context_window: {
          context_window_size: 100,
          current_usage: {
            input_tokens: 150,
            output_tokens: 50
          }
        }
      };

      expect(getContextPercentage(stdin)).toBe(100); // 200/100 = 200% -> 限制为100%
    });
  });

  describe('getModelName', () => {
    it('应该使用display_name当可用时', () => {
      const stdin: any = {
        model: {
          display_name: 'Claude Opus 4.6'
        }
      };

      expect(getModelName(stdin)).toBe('Claude Opus 4.6');
    });

    it('应该从model_id格式化当display_name不可用时', () => {
      const stdin: any = {
        model: {
          id: 'anthropic.claude-3-5-sonnet-20241022'
        }
      };

      expect(getModelName(stdin)).toBe('Claude 3.5 Sonnet');
    });

    it('应该返回Unknown当没有模型信息时', () => {
      const stdin: any = {};
      expect(getModelName(stdin)).toBe('Unknown');
    });

    it('应该处理空字符串', () => {
      const stdin: any = {
        model: {
          display_name: ''
        }
      };

      expect(getModelName(stdin)).toBe('Unknown');
    });

    it('应该处理新的模型ID格式(变体-版本-日期)', () => {
      const stdin: any = {
        model: {
          id: 'claude-sonnet-4-20250514'
        }
      };
      expect(getModelName(stdin)).toBe('Claude Sonnet 4');
    });

    it('应该处理新的模型ID格式(变体-版本-次版本-日期)', () => {
      const stdin: any = {
        model: {
          id: 'claude-haiku-4-5-20251001'
        }
      };
      expect(getModelName(stdin)).toBe('Claude Haiku 4.5');
    });
  });

  describe('extractHudData', () => {
    it('应该提取完整的HUD数据', () => {
      const stdin: any = {
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
          used_percentage: 47.5
        }
      };

      const result = extractHudData(stdin);

      expect(result.modelName).toBe('Claude 3.5 Sonnet');
      expect(result.modelId).toBe('anthropic.claude-3-5-sonnet');
      expect(result.contextWindowSize).toBe(200000);
      expect(result.tokenUsage.inputTokens).toBe(45000);
      expect(result.tokenUsage.outputTokens).toBe(39000);
      expect(result.tokenUsage.totalTokens).toBe(90000); // 45000+39000+5000+1000
      expect(result.contextPercentage).toBe(48); // 47.5四舍五入
      expect(result.hasNativePercentage).toBe(true);
    });

    it('应该处理最小数据', () => {
      const stdin: any = {
        model: {
          id: 'claude-3-haiku'
        }
      };

      const result = extractHudData(stdin);

      expect(result.modelName).toBe('Claude 3 Haiku');
      expect(result.modelId).toBe('claude-3-haiku');
      expect(result.contextWindowSize).toBeUndefined();
      expect(result.tokenUsage.totalTokens).toBe(0);
      expect(result.contextPercentage).toBe(0);
      expect(result.hasNativePercentage).toBe(false);
    });
  });
});