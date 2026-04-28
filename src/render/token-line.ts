import type { HudData } from '../types';
import type { HudConfig } from '../config';
import { formatCompactNumber, formatPercentage } from './colors';

/**
 * 渲染token使用量信息
 */
export function renderTokenLine(data: HudData, config: HudConfig): string {
  if (!config.display.showTokenCounts) {
    return '';
  }

  const { tokenUsage, contextWindowSize } = data;
  const parts: string[] = [];

  // 显示详细token计数
  if (tokenUsage.inputTokens > 0) {
    const formatted = config.display.compactNumbers
      ? formatCompactNumber(tokenUsage.inputTokens)
      : tokenUsage.inputTokens.toString();
    parts.push(`In: ${formatted}`);
  }

  if (tokenUsage.outputTokens > 0) {
    const formatted = config.display.compactNumbers
      ? formatCompactNumber(tokenUsage.outputTokens)
      : tokenUsage.outputTokens.toString();
    parts.push(`Out: ${formatted}`);
  }

  if (tokenUsage.cacheCreationTokens > 0) {
    const formatted = config.display.compactNumbers
      ? formatCompactNumber(tokenUsage.cacheCreationTokens)
      : tokenUsage.cacheCreationTokens.toString();
    parts.push(`Cache+: ${formatted}`);
  }

  if (tokenUsage.cacheReadTokens > 0) {
    const formatted = config.display.compactNumbers
      ? formatCompactNumber(tokenUsage.cacheReadTokens)
      : tokenUsage.cacheReadTokens.toString();
    parts.push(`Cache-: ${formatted}`);
  }

  // 显示总token数
  if (tokenUsage.totalTokens > 0) {
    const formatted = config.display.compactNumbers
      ? formatCompactNumber(tokenUsage.totalTokens)
      : tokenUsage.totalTokens.toString();
    parts.push(`Total: ${formatted}`);

    // 显示上下文窗口大小
    if (contextWindowSize) {
      const windowFormatted = config.display.compactNumbers
        ? formatCompactNumber(contextWindowSize)
        : contextWindowSize.toString();
      parts.push(`Window: ${windowFormatted}`);
    }
  }

  return parts.join(' | ');
}