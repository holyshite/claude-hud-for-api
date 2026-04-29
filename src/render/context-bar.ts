import type { HudData } from '../types';
import type { HudConfig } from '../config';
import {
  renderProgressBar,
  renderTextProgress,
  formatPercentage,
  formatCompactNumber,
  getContextColor,
  colorize,
} from './colors';

/**
 * 格式化 token 数字（K/M 单位）
 */
function formatTokens(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return n.toString();
}

/**
 * 渲染上下文窗口使用情况
 */
export function renderContextBar(data: HudData, config: HudConfig): string {
  if (!config.display.showContextBar) {
    return '';
  }

  const { contextPercentage, tokenUsage, contextWindowSize } = data;
  const { safeThreshold, warningThreshold, progressStyle } = config.colors;
  const { percentagePrecision } = config.format;
  const { compactNumbers, contextValue, showTokenBreakdown } = config.display;

  const parts: string[] = [];

  // 根据样式选择渲染方式
  switch (progressStyle) {
    case 'bar':
      const bar = renderProgressBar(contextPercentage, 10, safeThreshold, warningThreshold);
      const pctColor = getContextColor(contextPercentage, safeThreshold, warningThreshold);
      parts.push(`${bar} ${colorize(formatPercentage(contextPercentage, percentagePrecision), pctColor)}`);
      break;

    case 'text':
      const textProgress = renderTextProgress(contextPercentage, safeThreshold, warningThreshold);
      parts.push(textProgress);
      break;

    case 'percentage':
    default:
      const percentage = formatPercentage(contextPercentage, percentagePrecision);
      const color = getContextColor(contextPercentage, safeThreshold, warningThreshold);
      parts.push(colorize(percentage, color));
      break;
  }

  // 添加上下文数值（根据 contextValue 模式）
  if (contextWindowSize && tokenUsage.totalTokens > 0) {
    const tokensFormatted = compactNumbers
      ? formatCompactNumber(tokenUsage.totalTokens)
      : tokenUsage.totalTokens.toString();
    const windowFormatted = compactNumbers
      ? formatCompactNumber(contextWindowSize)
      : contextWindowSize.toString();

    switch (contextValue) {
      case 'tokens':
        parts.push(`${tokensFormatted}/${windowFormatted}`);
        break;
      case 'both':
        parts.push(`${formatPercentage(contextPercentage, percentagePrecision)} (${tokensFormatted}/${windowFormatted})`);
        break;
      case 'remaining': {
        const remaining = Math.max(0, 100 - contextPercentage);
        parts.push(`${remaining}%`);
        break;
      }
      case 'percent':
      default:
        parts.push(`${tokensFormatted}/${windowFormatted}`);
        break;
    }
  }

  // Token breakdown (in/cache) — 始终显示，不受阈值限制
  if (showTokenBreakdown && tokenUsage.totalTokens > 0) {
    const input = formatTokens(tokenUsage.inputTokens);
    const cache = formatTokens(tokenUsage.cacheCreationTokens + tokenUsage.cacheReadTokens);
    parts.push(`(in: ${input}, cache: ${cache})`);
  }

  return parts.join(' ');
}
