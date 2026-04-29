"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidStdinData = isValidStdinData;
exports.isValidPercentage = isValidPercentage;
exports.isValidTokenCount = isValidTokenCount;
exports.isValidModelId = isValidModelId;
exports.isValidContextWindowSize = isValidContextWindowSize;
exports.isValidTimestamp = isValidTimestamp;
exports.validateHudData = validateHudData;
exports.validateStdinData = validateStdinData;
exports.sanitizeStdinData = sanitizeStdinData;
function isValidStdinData(data) {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return false;
    }
    return true;
}
function isValidPercentage(value) {
    return typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 100;
}
function isValidTokenCount(value) {
    return typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= 0 &&
        Number.isInteger(value);
}
function isValidModelId(modelId) {
    if (typeof modelId !== 'string') {
        return false;
    }
    return modelId.trim().length > 0;
}
function isValidContextWindowSize(value) {
    return typeof value === 'number' &&
        Number.isFinite(value) &&
        value > 0 &&
        Number.isInteger(value);
}
function isValidTimestamp(value) {
    return typeof value === 'number' &&
        Number.isFinite(value) &&
        value > 0 &&
        Number.isInteger(value);
}
function validateHudData(data) {
    const errors = [];
    if (!data.modelName || data.modelName.trim().length === 0) {
        errors.push('模型名称不能为空');
    }
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
    if (!isValidPercentage(data.contextPercentage)) {
        errors.push('上下文窗口百分比无效');
    }
    if (data.contextWindowSize !== undefined &&
        !isValidContextWindowSize(data.contextWindowSize)) {
        errors.push('上下文窗口大小无效');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
function validateStdinData(data) {
    const warnings = [];
    const errors = [];
    if (data.model) {
        if (data.model.id && !isValidModelId(data.model.id)) {
            warnings.push('模型ID格式可能无效');
        }
        if (data.model.display_name && typeof data.model.display_name !== 'string') {
            warnings.push('模型显示名称应为字符串');
        }
    }
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
function sanitizeStdinData(data) {
    const sanitized = { ...data };
    if (sanitized.model) {
        if (typeof sanitized.model.id === 'string') {
            sanitized.model.id = sanitized.model.id.trim();
        }
        if (typeof sanitized.model.display_name === 'string') {
            sanitized.model.display_name = sanitized.model.display_name.trim();
        }
    }
    if (sanitized.context_window) {
        const { context_window_size, current_usage, used_percentage, remaining_percentage } = sanitized.context_window;
        if (typeof context_window_size === 'number' && Number.isFinite(context_window_size)) {
            sanitized.context_window.context_window_size = Math.max(0, Math.round(context_window_size));
        }
        if (current_usage) {
            const usage = { ...current_usage };
            ['input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens'].forEach(key => {
                const typedKey = key;
                if (typeof usage[typedKey] === 'number' && Number.isFinite(usage[typedKey])) {
                    usage[typedKey] = Math.max(0, Math.round(usage[typedKey]));
                }
            });
            sanitized.context_window.current_usage = usage;
        }
        if (typeof used_percentage === 'number' && Number.isFinite(used_percentage)) {
            sanitized.context_window.used_percentage = Math.max(0, Math.min(100, used_percentage));
        }
        if (typeof remaining_percentage === 'number' && Number.isFinite(remaining_percentage)) {
            sanitized.context_window.remaining_percentage = Math.max(0, Math.min(100, remaining_percentage));
        }
    }
    return sanitized;
}
