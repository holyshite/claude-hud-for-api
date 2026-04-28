import type { HudData } from '../types';
import type { HudConfig } from '../config';
import { colorize } from './colors';

/**
 * 渲染模型信息行
 */
export function renderModelLine(data: HudData, config: HudConfig): string {
  if (!config.display.showModel) {
    return '';
  }

  const { modelName } = data;

  // 应用模型显示格式
  let displayName = modelName;
  if (config.format.modelFormat) {
    displayName = config.format.modelFormat
      .replace('{name}', modelName)
      .replace('{id}', data.modelId || '');
  }

  return colorize(displayName, config.colors.modelColor);
}