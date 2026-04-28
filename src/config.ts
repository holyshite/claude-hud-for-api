import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export type LayoutType = 'compact' | 'detailed';
export type ProgressStyle = 'bar' | 'text' | 'percentage';
export type ColorName = 'green' | 'yellow' | 'red' | 'cyan' | 'blue' | 'magenta' | 'dim';

export interface HudConfig {
  display: {
    layout: LayoutType;           // compact|detailed
    showModel: boolean;
    showContextBar: boolean;
    showTokenCounts: boolean;    // 显示详细token计数
    showSeparators: boolean;
    compactNumbers: boolean;     // 使用k/M单位
  };
  colors: {
    safeThreshold: number;       // 安全阈值（百分比）
    warningThreshold: number;    // 警告阈值（百分比）
    modelColor: ColorName;
    progressStyle: ProgressStyle; // 进度条样式
  };
  format: {
    modelFormat: string;         // 模型显示格式，支持{name}、{id}
    percentagePrecision: number; // 百分比小数位数
  };
}

export const DEFAULT_CONFIG: HudConfig = {
  display: {
    layout: 'compact',
    showModel: true,
    showContextBar: true,
    showTokenCounts: false,
    showSeparators: true,
    compactNumbers: true,
  },
  colors: {
    safeThreshold: 70,
    warningThreshold: 90,
    modelColor: 'cyan',
    progressStyle: 'bar',
  },
  format: {
    modelFormat: '{name}',
    percentagePrecision: 0,
  },
};

let _pluginDir: string | null = null;

/**
 * 设置插件目录（用于测试）
 */
export function setPluginDir(dir: string | null): void {
  _pluginDir = dir;
}

/**
 * 获取插件配置目录路径
 */
export function getPluginDir(): string {
  if (_pluginDir) return _pluginDir;
  const homeDir = os.homedir();
  return path.join(homeDir, '.claude', 'plugins', 'claude-token-hud');
}

/**
 * 获取配置文件路径
 */
export function getConfigPath(): string {
  return path.join(getPluginDir(), 'config.json');
}

/**
 * 验证配置值
 */
export function validateConfig(userConfig: Partial<HudConfig>): Partial<HudConfig> {
  const result: Partial<HudConfig> = {};

  // 验证display
  if (userConfig.display) {
    const display: Partial<HudConfig['display']> = {};

    if (userConfig.display.layout === 'compact' || userConfig.display.layout === 'detailed') {
      display.layout = userConfig.display.layout;
    }

    if (typeof userConfig.display.showModel === 'boolean') {
      display.showModel = userConfig.display.showModel;
    }

    if (typeof userConfig.display.showContextBar === 'boolean') {
      display.showContextBar = userConfig.display.showContextBar;
    }

    if (typeof userConfig.display.showTokenCounts === 'boolean') {
      display.showTokenCounts = userConfig.display.showTokenCounts;
    }

    if (typeof userConfig.display.showSeparators === 'boolean') {
      display.showSeparators = userConfig.display.showSeparators;
    }

    if (typeof userConfig.display.compactNumbers === 'boolean') {
      display.compactNumbers = userConfig.display.compactNumbers;
    }

    if (Object.keys(display).length > 0) {
      result.display = display as HudConfig['display'];
    }
  }

  // 验证colors
  if (userConfig.colors) {
    const colors: Partial<HudConfig['colors']> = {};

    if (typeof userConfig.colors.safeThreshold === 'number') {
      colors.safeThreshold = Math.max(0, Math.min(100, userConfig.colors.safeThreshold));
    }

    if (typeof userConfig.colors.warningThreshold === 'number') {
      colors.warningThreshold = Math.max(0, Math.min(100, userConfig.colors.warningThreshold));
    }

    const validColors: ColorName[] = ['green', 'yellow', 'red', 'cyan', 'blue', 'magenta', 'dim'];
    if (validColors.includes(userConfig.colors.modelColor as ColorName)) {
      colors.modelColor = userConfig.colors.modelColor as ColorName;
    }

    if (userConfig.colors.progressStyle === 'bar' ||
        userConfig.colors.progressStyle === 'text' ||
        userConfig.colors.progressStyle === 'percentage') {
      colors.progressStyle = userConfig.colors.progressStyle;
    }

    if (Object.keys(colors).length > 0) {
      result.colors = colors as HudConfig['colors'];
    }
  }

  // 验证format
  if (userConfig.format) {
    const format: Partial<HudConfig['format']> = {};

    if (typeof userConfig.format.modelFormat === 'string') {
      format.modelFormat = userConfig.format.modelFormat.slice(0, 100);
    }

    if (typeof userConfig.format.percentagePrecision === 'number') {
      format.percentagePrecision = Math.max(0, Math.min(3, Math.round(userConfig.format.percentagePrecision)));
    }

    if (Object.keys(format).length > 0) {
      result.format = format as HudConfig['format'];
    }
  }

  return result;
}

/**
 * 合并配置（默认 + 用户）
 */
export function mergeConfig(userConfig: Partial<HudConfig>): HudConfig {
  const validated = validateConfig(userConfig);

  return {
    display: {
      ...DEFAULT_CONFIG.display,
      ...validated.display,
    },
    colors: {
      ...DEFAULT_CONFIG.colors,
      ...validated.colors,
    },
    format: {
      ...DEFAULT_CONFIG.format,
      ...validated.format,
    },
  };
}

/**
 * 加载配置
 */
export async function loadConfig(): Promise<HudConfig> {
  const configPath = getConfigPath();

  try {
    // 确保插件目录存在
    const pluginDir = getPluginDir();
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
    }

    if (!fs.existsSync(configPath)) {
      // 如果配置文件不存在，创建默认配置
      const defaultConfig = mergeConfig({});
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      return defaultConfig;
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(content) as Partial<HudConfig>;
    return mergeConfig(userConfig);
  } catch (error) {
    // 如果读取失败，返回默认配置
    console.error(`Failed to load config: ${error}`);
    return mergeConfig({});
  }
}

/**
 * 保存配置
 */
export async function saveConfig(config: HudConfig): Promise<void> {
  const configPath = getConfigPath();

  try {
    const pluginDir = getPluginDir();
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Failed to save config: ${error}`);
    throw error;
  }
}