import type { HudData } from '../types';
import type { HudConfig } from '../config';
import { renderModelLine } from './model-line';
import { renderTokenLine } from './token-line';
import { renderContextBar } from './context-bar';

export { renderModelLine } from './model-line';
export { renderTokenLine } from './token-line';
export { renderContextBar } from './context-bar';

/**
 * 渲染完整HUD状态行
 */
export function renderHud(data: HudData, config: HudConfig): string {
  const lines: string[] = [];

  // 根据布局模式决定渲染顺序
  if (config.display.layout === 'compact') {
    // 紧凑模式：所有内容在一行
    const parts: string[] = [];

    // 模型名称
    const modelLine = renderModelLine(data, config);
    if (modelLine) {
      parts.push(modelLine);
    }

    // 上下文条
    const contextBar = renderContextBar(data, config);
    if (contextBar) {
      parts.push(contextBar);
    }

    // token计数（如果启用）
    const tokenLine = renderTokenLine(data, config);
    if (tokenLine) {
      parts.push(tokenLine);
    }

    // 使用分隔符连接所有部分
    const separator = config.display.showSeparators ? ' | ' : ' ';
    lines.push(parts.join(separator));
  } else {
    // 详细模式：多行显示
    const modelLine = renderModelLine(data, config);
    if (modelLine) {
      lines.push(modelLine);
    }

    const contextBar = renderContextBar(data, config);
    if (contextBar) {
      lines.push(contextBar);
    }

    const tokenLine = renderTokenLine(data, config);
    if (tokenLine) {
      lines.push(tokenLine);
    }
  }

  // 过滤空行并连接
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  return nonEmptyLines.join('\n');
}

/**
 * 计算终端宽度并调整渲染
 */
export function renderAdaptiveHud(data: HudData, config: HudConfig, terminalWidth: number = 80): string {
  const baseOutput = renderHud(data, config);

  // 如果终端宽度未知或足够宽，直接返回
  if (terminalWidth <= 0 || terminalWidth >= 100) {
    return baseOutput;
  }

  // 简单截断：如果输出太长，切换到紧凑模式
  const lines = baseOutput.split('\n');
  if (lines.length === 1 && lines[0].length <= terminalWidth) {
    return baseOutput;
  }

  // 如果太宽，尝试切换到紧凑模式
  if (config.display.layout === 'detailed') {
    const compactConfig = { ...config, display: { ...config.display, layout: 'compact' as 'compact' } };
    const compactOutput = renderHud(data, compactConfig);
    const compactLines = compactOutput.split('\n');

    if (compactLines.length === 1 && compactLines[0].length <= terminalWidth) {
      return compactOutput;
    }
  }

  // 如果仍然太宽，尝试进一步简化
  const simplifiedConfig = {
    ...config,
    display: {
      ...config.display,
      layout: 'compact' as 'compact',
      showTokenCounts: false,
      showSeparators: false,
    },
  };
  const simplifiedOutput = renderHud(data, simplifiedConfig);
  const simplifiedLines = simplifiedOutput.split('\n');

  if (simplifiedLines.length === 1 && simplifiedLines[0].length <= terminalWidth) {
    return simplifiedOutput;
  }

  // 最后手段：只显示模型名称和百分比
  const minimalParts: string[] = [];
  if (config.display.showModel) {
    const modelLine = renderModelLine(data, config);
    if (modelLine) minimalParts.push(modelLine);
  }

  const contextBar = renderContextBar(data, config);
  if (contextBar) minimalParts.push(contextBar);

  const minimalOutput = minimalParts.join(' ');
  if (minimalOutput.length <= terminalWidth) {
    return minimalOutput;
  }

  // 如果还是太长，截断
  return minimalOutput.slice(0, terminalWidth - 3) + '...';
}