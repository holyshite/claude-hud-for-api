import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export type LayoutType = 'compact' | 'expanded' | 'detailed';
export type ProgressStyle = 'bar' | 'text' | 'percentage';
export type ColorName = 'green' | 'yellow' | 'red' | 'cyan' | 'blue' | 'magenta' | 'dim';
export type ContextValueMode = 'percent' | 'tokens' | 'both' | 'remaining';

export interface GitStatusConfig {
  enabled: boolean;
  showDirty: boolean;
  showAheadBehind: boolean;
  showFileStats: boolean;
}

export interface HudDisplayConfig {
  lineLayout: LayoutType;
  showSeparators: boolean;
  showModel: boolean;
  showContextBar: boolean;
  contextValue: ContextValueMode;
  showTokenCounts: boolean;
  showTokenBreakdown: boolean;
  compactNumbers: boolean;
  showTools: boolean;
  showAgents: boolean;
  showTodos: boolean;
  showProject: boolean;
  showConfigCounts: boolean;
  showDuration: boolean;
  showSpeed: boolean;
  showUsage: boolean;
  usageBarEnabled: boolean;
  showSessionName: boolean;
  showSessionTokens: boolean;
  customLine: string;
  usageThreshold: number;
  environmentThreshold: number;
}

export interface HudConfig {
  display: HudDisplayConfig;
  gitStatus: GitStatusConfig;
  colors: {
    safeThreshold: number;
    warningThreshold: number;
    modelColor: ColorName;
    progressStyle: ProgressStyle;
  };
  format: {
    modelFormat: string;
    percentagePrecision: number;
  };
}

export const DEFAULT_CONFIG: HudConfig = {
  display: {
    lineLayout: 'compact',
    showSeparators: false,
    showModel: true,
    showContextBar: true,
    contextValue: 'percent',
    showTokenCounts: false,
    showTokenBreakdown: false,
    compactNumbers: true,
    showTools: false,
    showAgents: false,
    showTodos: false,
    showProject: false,
    showConfigCounts: false,
    showDuration: false,
    showSpeed: false,
    showUsage: false,
    usageBarEnabled: true,
    showSessionName: false,
    showSessionTokens: false,
    customLine: '',
    usageThreshold: 0,
    environmentThreshold: 0,
  },
  gitStatus: {
    enabled: false,
    showDirty: false,
    showAheadBehind: false,
    showFileStats: false,
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
  return path.join(homeDir, '.claude', 'plugins', 'claude-hud');
}

/**
 * 获取配置文件路径
 */
export function getConfigPath(): string {
  return path.join(getPluginDir(), 'config.json');
}

function isLayoutType(v: unknown): v is LayoutType {
  return v === 'compact' || v === 'expanded' || v === 'detailed';
}

function isContextValueMode(v: unknown): v is ContextValueMode {
  return v === 'percent' || v === 'tokens' || v === 'both' || v === 'remaining';
}

function isColorName(v: unknown): v is ColorName {
  return ['green', 'yellow', 'red', 'cyan', 'blue', 'magenta', 'dim'].includes(v as string);
}

function isProgressStyle(v: unknown): v is ProgressStyle {
  return v === 'bar' || v === 'text' || v === 'percentage';
}

function migrateLegacyLayout(userConfig: Record<string, unknown>): void {
  if ('layout' in userConfig && !('lineLayout' in userConfig)) {
    const layout = userConfig.layout;
    if (typeof layout === 'string') {
      if (layout === 'separators') {
        userConfig.lineLayout = 'compact';
        userConfig.showSeparators = true;
      } else if (layout === 'detailed') {
        userConfig.lineLayout = 'detailed';
      } else {
        userConfig.lineLayout = 'compact';
        userConfig.showSeparators = false;
      }
    }
    delete userConfig.layout;
  }
}

export function mergeConfig(userConfig: Partial<HudConfig> & Record<string, unknown>): HudConfig {
  migrateLegacyLayout(userConfig as Record<string, unknown>);

  const validated: Partial<HudConfig> = {};

  if (userConfig.display) {
    const d = userConfig.display;
    const display: Partial<HudDisplayConfig> = {};

    if (isLayoutType(d.lineLayout)) display.lineLayout = d.lineLayout;
    if (typeof d.showSeparators === 'boolean') display.showSeparators = d.showSeparators;
    if (typeof d.showModel === 'boolean') display.showModel = d.showModel;
    if (typeof d.showContextBar === 'boolean') display.showContextBar = d.showContextBar;
    if (isContextValueMode(d.contextValue)) display.contextValue = d.contextValue;
    if (typeof d.showTokenCounts === 'boolean') display.showTokenCounts = d.showTokenCounts;
    if (typeof d.showTokenBreakdown === 'boolean') display.showTokenBreakdown = d.showTokenBreakdown;
    if (typeof d.compactNumbers === 'boolean') display.compactNumbers = d.compactNumbers;
    if (typeof d.showTools === 'boolean') display.showTools = d.showTools;
    if (typeof d.showAgents === 'boolean') display.showAgents = d.showAgents;
    if (typeof d.showTodos === 'boolean') display.showTodos = d.showTodos;
    if (typeof d.showProject === 'boolean') display.showProject = d.showProject;
    if (typeof d.showConfigCounts === 'boolean') display.showConfigCounts = d.showConfigCounts;
    if (typeof d.showDuration === 'boolean') display.showDuration = d.showDuration;
    if (typeof d.showSpeed === 'boolean') display.showSpeed = d.showSpeed;
    if (typeof d.showUsage === 'boolean') display.showUsage = d.showUsage;
    if (typeof d.usageBarEnabled === 'boolean') display.usageBarEnabled = d.usageBarEnabled;
    if (typeof d.showSessionName === 'boolean') display.showSessionName = d.showSessionName;
    if (typeof d.showSessionTokens === 'boolean') display.showSessionTokens = d.showSessionTokens;
    if (typeof d.customLine === 'string') display.customLine = d.customLine.slice(0, 80);
    if (typeof d.usageThreshold === 'number') display.usageThreshold = Math.max(0, Math.min(100, d.usageThreshold));
    if (typeof d.environmentThreshold === 'number') display.environmentThreshold = Math.max(0, Math.min(100, d.environmentThreshold));

    if (Object.keys(display).length > 0) validated.display = display as HudDisplayConfig;
  }

  if (userConfig.gitStatus) {
    const g = userConfig.gitStatus;
    const gitStatus: Partial<GitStatusConfig> = {};
    if (typeof g.enabled === 'boolean') gitStatus.enabled = g.enabled;
    if (typeof g.showDirty === 'boolean') gitStatus.showDirty = g.showDirty;
    if (typeof g.showAheadBehind === 'boolean') gitStatus.showAheadBehind = g.showAheadBehind;
    if (typeof g.showFileStats === 'boolean') gitStatus.showFileStats = g.showFileStats;
    if (Object.keys(gitStatus).length > 0) validated.gitStatus = gitStatus as GitStatusConfig;
  }

  if (userConfig.colors) {
    const c = userConfig.colors;
    const colors: Partial<HudConfig['colors']> = {};
    if (typeof c.safeThreshold === 'number') colors.safeThreshold = Math.max(0, Math.min(100, c.safeThreshold));
    if (typeof c.warningThreshold === 'number') colors.warningThreshold = Math.max(0, Math.min(100, c.warningThreshold));
    if (isColorName(c.modelColor)) colors.modelColor = c.modelColor;
    if (isProgressStyle(c.progressStyle)) colors.progressStyle = c.progressStyle;
    if (Object.keys(colors).length > 0) validated.colors = colors as HudConfig['colors'];
  }

  if (userConfig.format) {
    const f = userConfig.format;
    const format: Partial<HudConfig['format']> = {};
    if (typeof f.modelFormat === 'string') format.modelFormat = f.modelFormat.slice(0, 100);
    if (typeof f.percentagePrecision === 'number') format.percentagePrecision = Math.max(0, Math.min(3, Math.round(f.percentagePrecision)));
    if (Object.keys(format).length > 0) validated.format = format as HudConfig['format'];
  }

  return {
    display: { ...DEFAULT_CONFIG.display, ...validated.display },
    gitStatus: { ...DEFAULT_CONFIG.gitStatus, ...validated.gitStatus },
    colors: { ...DEFAULT_CONFIG.colors, ...validated.colors },
    format: { ...DEFAULT_CONFIG.format, ...validated.format },
  };
}

export async function loadConfig(): Promise<HudConfig> {
  const configPath = getConfigPath();
  try {
    const pluginDir = getPluginDir();
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
    }
    if (!fs.existsSync(configPath)) {
      const defaultConfig = mergeConfig({});
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
      return defaultConfig;
    }
    const content = fs.readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(content);
    return mergeConfig(userConfig);
  } catch (error) {
    console.error(`Failed to load config: ${error}`);
    return mergeConfig({});
  }
}

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
