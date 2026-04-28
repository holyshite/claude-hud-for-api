import type { StdinData, HudData } from '../types';

/**
 * 验证StdinData对象的基本结构
 */
export function isValidStdinData(data: unknown): data is StdinData {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return false;
  }

  return true;
}

/**
 * 验证百分比数值（0-100）
 */
export function isValidPercentage(value: unknown): value is number {
  return typeof value === 'number' && 
         Number.isFinite(value) && 
         value >= 0 && 
         value <= 100;
}

/**
 * 验证token计数（非负整数）
 */
export function isValidTokenCount(value: unknown): value is number {
  return typeof value === 'number' && 
         Number.isFinite(value) && 
         value >= 0 &&
         Number.isInteger(value);
}

/**
 * 验证模型ID格式
 */
export function isValidModelId(modelId: unknown): boolean {
  if (typeof modelId !== 'string') {
    return false;
  }

  // 基本验证：非空字符串
  return modelId.trim().length > 0;
}

/**
 * 验证上下文窗口大小（正整数）
 */
export function isValidContextWindowSize(value: unknown): value is number {
  return typeof value === 'number' && 
         Number.isFinite(value) && 
         value > 0 &&
         Number.isInteger(value);
}

/**
 * 验证时间戳（秒数，正整数）
 */
export function isValidTimestamp(value: unknown): value is number {
  return typeof value === 'number' && 
         Number.isFinite(value) && 
         value > 0 &&
         Number.isInteger(value);
}

/**
 * 验证HUD数据的完整性
 */
export function validateHudData(data: HudData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 验证模型名称
  if (!data.modelName || data.modelName.trim().length === 0) {
    errors.push('模型名称不能为空');
  }

  // 验证token使用量
  const { tokenUsage } = data;
  if (!isValidTokenCount(tokenUsage.inputTokens)) {
    errors.push('输入token计数无效');
  }
  if (!isValidTokenCount(tokenUsage.outputTokens)) {
    errors.push('输出token计数无效');
  }
  if (!isValidTokenCount(tokenUsage.cacheCreationTokens)) {
    errors.push('缓存创建token计数无效');
  }
  if (!isValidTokenCount(tokenUsage.cacheReadTokens)) {
    errors.push('缓存读取token计数无效');
  }
  if (!isValidTokenCount(tokenUsage.totalTokens)) {
    errors.push('总token计数无效');
  }

  // 验证上下文百分比
  if (!isValidPercentage(data.contextPercentage)) {
    errors.push('上下文窗口百分比无效');
  }

  // 验证上下文窗口大小（如果存在）
  if (data.contextWindowSize !== undefined &&
      !isValidContextWindowSize(data.contextWindowSize)) {
    errors.push('上下文窗口大小无效');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 验证Stdin数据的完整性并提供详细错误信息
 */
export function validateStdinData(data: StdinData): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // 验证模型信息
  if (data.model) {
    if (data.model.id && !isValidModelId(data.model.id)) {
      warnings.push('模型ID格式可能无效');
    }
    
    if (data.model.display_name && typeof data.model.display_name !== 'string') {
      warnings.push('模型显示名称应为字符串');
    }
  }

  // 验证上下文窗口数据
  if (data.context_window) {
    const { context_window_size, current_usage, used_percentage, remaining_percentage } = data.context_window;

    if (context_window_size !== undefined && !isValidContextWindowSize(context_window_size)) {
      errors.push('上下文窗口大小无效');
    }

    if (current_usage) {
      const { input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens } = current_usage;

      if (input_tokens !== undefined && !isValidTokenCount(input_tokens)) {
        errors.push('输入token计数无效');
      }
      
      if (output_tokens !== undefined && !isValidTokenCount(output_tokens)) {
        errors.push('输出token计数无效');
      }
      
      if (cache_creation_input_tokens !== undefined && !isValidTokenCount(cache_creation_input_tokens)) {
        errors.push('缓存创建token计数无效');
      }
      
      if (cache_read_input_tokens !== undefined && !isValidTokenCount(cache_read_input_tokens)) {
        errors.push('缓存读取token计数无效');
      }
    }

    if (used_percentage !== undefined && used_percentage !== null && !isValidPercentage(used_percentage)) {
      errors.push('已使用百分比无效');
    }

    if (remaining_percentage !== undefined && remaining_percentage !== null && !isValidPercentage(remaining_percentage)) {
      errors.push('剩余百分比无效');
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
}

/**
 * 清理和规范化StdinData
 */
export function sanitizeStdinData(data: StdinData): StdinData {
  const sanitized = { ...data };

  // 清理模型信息
  if (sanitized.model) {
    if (typeof sanitized.model.id === 'string') {
      sanitized.model.id = sanitized.model.id.trim();
    }
    
    if (typeof sanitized.model.display_name === 'string') {
      sanitized.model.display_name = sanitized.model.display_name.trim();
    }
  }

  // 清理上下文窗口数据
  if (sanitized.context_window) {
    const { context_window_size, current_usage, used_percentage, remaining_percentage } = sanitized.context_window;

    // 确保窗口大小为整数
    if (typeof context_window_size === 'number' && Number.isFinite(context_window_size)) {
      sanitized.context_window.context_window_size = Math.max(0, Math.round(context_window_size));
    }

    // 清理current_usage
    if (current_usage) {
      const usage = { ...current_usage };
      
      ['input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens'].forEach(key => {
        const typedKey = key as keyof typeof usage;
        if (typeof usage[typedKey] === 'number' && Number.isFinite(usage[typedKey])) {
          usage[typedKey] = Math.max(0, Math.round(usage[typedKey] as number));
        }
      });

      sanitized.context_window.current_usage = usage;
    }

    // 清理百分比数据
    if (typeof used_percentage === 'number' && Number.isFinite(used_percentage)) {
      sanitized.context_window.used_percentage = Math.max(0, Math.min(100, used_percentage));
    }
    
    if (typeof remaining_percentage === 'number' && Number.isFinite(remaining_percentage)) {
      sanitized.context_window.remaining_percentage = Math.max(0, Math.min(100, remaining_percentage));
    }
  }

  return sanitized;
}