/**
 * 格式化数字，添加千位分隔符
 */
export function formatNumberWithCommas(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * 格式化时间间隔
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * 截断文本到指定长度
 */
export function truncateText(text: string, maxLength: number, ellipsis: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }

  const keepLength = maxLength - ellipsis.length;
  if (keepLength <= 0) {
    return ellipsis.slice(0, maxLength);
  }

  return text.slice(0, keepLength) + ellipsis;
}

/**
 * 确保文本在终端宽度内
 */
export function fitToTerminalWidth(text: string, terminalWidth: number): string {
  const lines = text.split('\n');
  const fittedLines = lines.map(line => {
    if (line.length <= terminalWidth) {
      return line;
    }
    return line.slice(0, terminalWidth - 3) + '...';
  });

  return fittedLines.join('\n');
}

/**
 * 计算ANSI转义序列的长度
 */
export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * 计算文本的实际显示长度（忽略ANSI序列）
 */
export function visibleLength(text: string): number {
  return stripAnsi(text).length;
}