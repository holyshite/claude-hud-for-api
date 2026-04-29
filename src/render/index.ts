import type { HudData } from '../types';
import type { HudConfig } from '../config';
import { renderModelLine } from './model-line';
import { renderTokenLine } from './token-line';
import { renderContextBar } from './context-bar';

export { renderModelLine } from './model-line';
export { renderTokenLine } from './token-line';
export { renderContextBar } from './context-bar';

const UNKNOWN_TERMINAL_WIDTH = 80;

/**
 * 获取终端宽度
 */
function getTerminalWidth(): number {
  const stdoutColumns = (process.stdout as { columns?: number })?.columns;
  if (typeof stdoutColumns === 'number' && Number.isFinite(stdoutColumns) && stdoutColumns > 0) {
    return Math.floor(stdoutColumns);
  }
  const stderrColumns = (process.stderr as { columns?: number })?.columns;
  if (typeof stderrColumns === 'number' && Number.isFinite(stderrColumns) && stderrColumns > 0) {
    return Math.floor(stderrColumns);
  }
  const envColumns = Number.parseInt(process.env.COLUMNS ?? '', 10);
  if (Number.isFinite(envColumns) && envColumns > 0) {
    return envColumns;
  }
  return UNKNOWN_TERMINAL_WIDTH;
}

// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE_GLOBAL = /(?:\x1b\[[0-9;]*m|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\))/g;

function stripAnsi(str: string): string {
  return str.replace(ANSI_ESCAPE_GLOBAL, '');
}

function visualLength(str: string): number {
  // 简化版：仅用于截断判断，支持 ANSI
  return stripAnsi(str).length;
}

/**
 * 截断字符串到指定可视宽度
 */
function truncateToWidth(str: string, maxWidth: number): string {
  if (maxWidth <= 0 || visualLength(str) <= maxWidth) {
    return str;
  }
  const suffix = maxWidth >= 3 ? '...' : '.'.repeat(maxWidth);
  const keep = Math.max(0, maxWidth - suffix.length);
  // 简单按字符截断（忽略 ANSI 码）
  const clean = stripAnsi(str);
  return clean.slice(0, keep) + suffix;
}

/**
 * 渲染紧凑模式：所有主要信息在一行
 */
function renderCompact(data: HudData, config: HudConfig): string[] {
  const lines: string[] = [];
  const parts: string[] = [];

  const modelLine = renderModelLine(data, config);
  if (modelLine) parts.push(modelLine);

  const contextBar = renderContextBar(data, config);
  if (contextBar) parts.push(contextBar);

  const tokenLine = renderTokenLine(data, config);
  if (tokenLine) parts.push(tokenLine);

  // 会话时长
  if (config.display.showDuration && data.sessionDuration) {
    parts.push(`⏱️ ${data.sessionDuration}`);
  }

  const separator = config.display.showSeparators ? ' | ' : ' ';
  lines.push(parts.join(separator));
  return lines;
}

/**
 * 收集活动行（tools、agents、todos）
 */
function collectActivityLines(data: HudData, config: HudConfig): string[] {
  const lines: string[] = [];
  // 目前源码尚未实现 tools/agents/todos 追踪，预留接口
  return lines;
}

/**
 * 渲染展开模式：按语义行拆分
 */
function renderExpanded(data: HudData, config: HudConfig): string[] {
  const lines: string[] = [];

  // 身份行：模型名称
  const modelLine = renderModelLine(data, config);
  if (modelLine) lines.push(modelLine);

  // 上下文行
  const contextBar = renderContextBar(data, config);
  if (contextBar) lines.push(contextBar);

  // 使用量行（预留）
  if (config.display.showUsage && data.usageData) {
    // 简单显示
    const usage = data.usageData;
    if (usage.fiveHour !== null) {
      lines.push(`usage: ${usage.fiveHour}%`);
    }
  }

  // 会话 token 行
  if (config.display.showSessionTokens && data.sessionTokens) {
    const st = data.sessionTokens;
    const total = st.inputTokens + st.outputTokens + st.cacheCreationTokens + st.cacheReadTokens;
    if (total > 0) {
      const fmt = (n: number) => {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
        return n.toString();
      };
      const parts = [`i:${fmt(st.inputTokens)}`, `o:${fmt(st.outputTokens)}`];
      if (st.cacheCreationTokens > 0 || st.cacheReadTokens > 0) {
        parts.push(`c:${fmt(st.cacheCreationTokens + st.cacheReadTokens)}`);
      }
      lines.push(`T ${fmt(total)} (${parts.join(', ')})`);
    }
  }

  // 会话时长
  if (config.display.showDuration && data.sessionDuration) {
    lines.push(`⏱️ ${data.sessionDuration}`);
  }

  return lines;
}

/**
 * 渲染完整 HUD 状态行
 */
export function renderHud(data: HudData, config: HudConfig): string {
  const lines: string[] = [];
  const lineLayout = config.display.lineLayout;

  if (lineLayout === 'compact') {
    const headerLines = renderCompact(data, config);
    const activityLines = collectActivityLines(data, config);
    lines.push(...headerLines);
    if (config.display.showSeparators && activityLines.length > 0) {
      const maxWidth = Math.max(...headerLines.map(visualLength), 20);
      lines.push('─'.repeat(maxWidth));
    }
    lines.push(...activityLines);
  } else if (lineLayout === 'expanded') {
    const expandedLines = renderExpanded(data, config);
    lines.push(...expandedLines);
    // 活动行
    const activityLines = collectActivityLines(data, config);
    if (config.display.showSeparators && activityLines.length > 0 && expandedLines.length > 0) {
      const maxWidth = Math.max(...expandedLines.map(visualLength), 20);
      lines.push('─'.repeat(maxWidth));
    }
    lines.push(...activityLines);
  } else {
    // detailed：向后兼容
    const modelLine = renderModelLine(data, config);
    if (modelLine) lines.push(modelLine);

    const contextBar = renderContextBar(data, config);
    if (contextBar) lines.push(contextBar);

    const tokenLine = renderTokenLine(data, config);
    if (tokenLine) lines.push(tokenLine);
  }

  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  return nonEmptyLines.join('\n');
}

/**
 * 自适应渲染（考虑终端宽度）
 */
export function renderAdaptiveHud(data: HudData, config: HudConfig, terminalWidth?: number): string {
  const tw = terminalWidth ?? getTerminalWidth();
  const baseOutput = renderHud(data, config);

  if (tw <= 0) {
    return baseOutput;
  }

  const lines = baseOutput.split('\n');
  // 如果在 expanded 模式下太长，强制切到 compact
  if (config.display.lineLayout === 'expanded' || config.display.lineLayout === 'detailed') {
    if (lines.some(line => visualLength(line) > tw)) {
      const compactConfig = {
        ...config,
        display: { ...config.display, lineLayout: 'compact' as const, showSeparators: false },
      };
      return renderHud(data, compactConfig);
    }
  }

  // 截断每一行
  return lines.map(line => truncateToWidth(line, tw)).join('\n');
}

/**
 * 预设 main 函数入口（供 index.ts 调用）
 */
export function render(data: HudData, config: HudConfig, terminalWidth?: number): string {
  return renderAdaptiveHud(data, config, terminalWidth);
}
