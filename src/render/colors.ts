import type { ColorName } from '../config';

export const RESET = '\x1b[0m';
export const DIM = '\x1b[2m';
export const RED = '\x1b[31m';
export const GREEN = '\x1b[32m';
export const YELLOW = '\x1b[33m';
export const BLUE = '\x1b[34m';
export const MAGENTA = '\x1b[35m';
export const CYAN = '\x1b[36m';
export const WHITE = '\x1b[37m';

const COLOR_MAP: Record<ColorName, string> = {
  green: GREEN,
  yellow: YELLOW,
  red: RED,
  cyan: CYAN,
  blue: BLUE,
  magenta: MAGENTA,
  dim: DIM,
};

/**
 * 获取颜色转义序列
 */
export function getColor(color: ColorName): string {
  return COLOR_MAP[color] || CYAN;
}

/**
 * 为文本着色
 */
export function colorize(text: string, color: ColorName): string {
  return `${getColor(color)}${text}${RESET}`;
}

/**
 * 根据百分比获取上下文颜色
 */
export function getContextColor(percent: number, safeThreshold: number, warningThreshold: number): ColorName {
  if (percent >= warningThreshold) return 'red';
  if (percent >= safeThreshold) return 'yellow';
  return 'green';
}

/**
 * 渲染进度条
 */
export function renderProgressBar(
  percent: number,
  width: number = 10,
  safeThreshold: number = 70,
  warningThreshold: number = 90,
): string {
  const safeWidth = Math.max(0, Math.round(width));
  const safePercent = Math.min(100, Math.max(0, percent));
  const filled = Math.round((safePercent / 100) * safeWidth);
  const empty = safeWidth - filled;

  const color = getContextColor(safePercent, safeThreshold, warningThreshold);
  const colorCode = getColor(color);

  return `${colorCode}${'█'.repeat(filled)}${DIM}${'░'.repeat(empty)}${RESET}`;
}

/**
 * 渲染文本进度指示器
 */
export function renderTextProgress(
  percent: number,
  safeThreshold: number = 70,
  warningThreshold: number = 90,
): string {
  const color = getContextColor(percent, safeThreshold, warningThreshold);
  return colorize(`${Math.round(percent)}%`, color);
}

/**
 * 格式化数字（使用k/M单位）
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    const val = num / 1_000_000;
    return val % 1 === 0 ? `${val.toFixed(0)}M` : `${val.toFixed(1)}M`;
  }
  if (num >= 1_000) {
    const val = num / 1_000;
    return val % 1 === 0 ? `${val.toFixed(0)}k` : `${val.toFixed(1)}k`;
  }
  return num.toString();
}

/**
 * 格式化百分比
 */
export function formatPercentage(percent: number, precision: number = 0): string {
  if (precision <= 0) {
    return `${Math.round(percent)}%`;
  }
  return `${percent.toFixed(precision)}%`;
}