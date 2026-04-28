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
 * 渲染上下文窗口使用情况
 */
export function renderContextBar(data: HudData, config: HudConfig): string {
  if (!config.display.showContextBar) {
    return '';
  }

  const { contextPercentage, tokenUsage, contextWindowSize } = data;
  const { safeThreshold, warningThreshold, progressStyle } = config.colors;
  const { percentagePrecision } = config.format;
  const { compactNumbers } = config.display;

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

  // 添加详细信息
  if (contextWindowSize && tokenUsage.totalTokens > 0) {
    const tokensFormatted = compactNumbers
      ? formatCompactNumber(tokenUsage.totalTokens)
      : tokenUsage.totalTokens.toString();
    const windowFormatted = compactNumbers
      ? formatCompactNumber(contextWindowSize)
      : contextWindowSize.toString();
    parts.push(`${tokensFormatted}/${windowFormatted}`);
  }

  return parts.join(' ');
}