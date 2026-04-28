import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
  mergeConfig,
  validateConfig,
  setPluginDir,
  HudConfig
} from '../src/config';

describe('config模块', () => {
  const testPluginDir = path.join(os.tmpdir(), 'test-claude-hud-config');

  beforeEach(() => {
    setPluginDir(testPluginDir);
    if (fs.existsSync(testPluginDir)) {
      fs.rmSync(testPluginDir, { recursive: true });
    }
  });

  afterEach(() => {
    setPluginDir(null);
    if (fs.existsSync(testPluginDir)) {
      fs.rmSync(testPluginDir, { recursive: true });
    }
  });

  describe('DEFAULT_CONFIG', () => {
    it('应该有正确的默认值', () => {
      expect(DEFAULT_CONFIG.display.layout).toBe('compact');
      expect(DEFAULT_CONFIG.display.showModel).toBe(true);
      expect(DEFAULT_CONFIG.display.showContextBar).toBe(true);
      expect(DEFAULT_CONFIG.display.showTokenCounts).toBe(false);
      expect(DEFAULT_CONFIG.display.showSeparators).toBe(true);
      expect(DEFAULT_CONFIG.display.compactNumbers).toBe(true);

      expect(DEFAULT_CONFIG.colors.safeThreshold).toBe(70);
      expect(DEFAULT_CONFIG.colors.warningThreshold).toBe(90);
      expect(DEFAULT_CONFIG.colors.modelColor).toBe('cyan');
      expect(DEFAULT_CONFIG.colors.progressStyle).toBe('bar');

      expect(DEFAULT_CONFIG.format.modelFormat).toBe('{name}');
      expect(DEFAULT_CONFIG.format.percentagePrecision).toBe(0);
    });
  });

  describe('validateConfig', () => {
    it('应该验证有效的配置', () => {
      const userConfig: Partial<HudConfig> = {
        display: {
          layout: 'detailed',
          showModel: false,
          showContextBar: true,
          showTokenCounts: true,
          showSeparators: false,
          compactNumbers: false
        },
        colors: {
          safeThreshold: 60,
          warningThreshold: 85,
          modelColor: 'blue',
          progressStyle: 'text'
        },
        format: {
          modelFormat: 'Model: {name}',
          percentagePrecision: 1
        }
      };

      const validated = validateConfig(userConfig);

      expect(validated.display?.layout).toBe('detailed');
      expect(validated.display?.showModel).toBe(false);
      expect(validated.colors?.safeThreshold).toBe(60);
      expect(validated.colors?.modelColor).toBe('blue');
      expect(validated.format?.modelFormat).toBe('Model: {name}');
    });

    it('应该拒绝无效的布局模式', () => {
      const userConfig: any = {
        display: {
          layout: 'invalid'
        }
      };

      const validated = validateConfig(userConfig);
      expect(validated.display?.layout).toBeUndefined();
    });

    it('应该限制阈值在0-100之间', () => {
      const userConfig: any = {
        colors: {
          safeThreshold: -10,
          warningThreshold: 150
        }
      };

      const validated = validateConfig(userConfig);
      expect(validated.colors?.safeThreshold).toBe(0);
      expect(validated.colors?.warningThreshold).toBe(100);
    });

    it('应该拒绝无效的颜色名称', () => {
      const userConfig: any = {
        colors: {
          modelColor: 'invalid-color'
        }
      };

      const validated = validateConfig(userConfig);
      expect(validated.colors?.modelColor).toBeUndefined();
    });

    it('应该拒绝无效的进度条样式', () => {
      const userConfig: any = {
        colors: {
          progressStyle: 'invalid'
        }
      };

      const validated = validateConfig(userConfig);
      expect(validated.colors?.progressStyle).toBeUndefined();
    });

    it('应该限制百分比精度在0-3之间', () => {
      const userConfig: any = {
        format: {
          percentagePrecision: 5
        }
      };

      const validated = validateConfig(userConfig);
      expect(validated.format?.percentagePrecision).toBe(3);

      const userConfig2: any = {
        format: {
          percentagePrecision: -2
        }
      };

      const validated2 = validateConfig(userConfig2);
      expect(validated2.format?.percentagePrecision).toBe(0);
    });

    it('应该截断过长的modelFormat', () => {
      const longString = 'a'.repeat(200);
      const userConfig: any = {
        format: {
          modelFormat: longString
        }
      };

      const validated = validateConfig(userConfig);
      expect(validated.format?.modelFormat).toHaveLength(100);
    });
  });

  describe('mergeConfig', () => {
    it('应该合并用户配置到默认配置', () => {
      const userConfig = {
        display: {
          layout: 'detailed' as const,
          showModel: false,
        },
        colors: {
          modelColor: 'blue' as const,
        },
      };
      const anyConfig = userConfig as any;

      const merged = mergeConfig(anyConfig);

      expect(merged.display.layout).toBe('detailed');
      expect(merged.display.showModel).toBe(false);
      expect(merged.colors.modelColor).toBe('blue');

      expect(merged.display.showContextBar).toBe(true);
      expect(merged.display.showTokenCounts).toBe(false);
      expect(merged.colors.safeThreshold).toBe(70);
      expect(merged.format.modelFormat).toBe('{name}');
    });

    it('应该忽略无效的用户配置', () => {
      const userConfig: any = {
        display: {
          layout: 'invalid',
          showModel: 'not-a-boolean'
        },
        colors: {
          modelColor: 'invalid-color'
        }
      };

      const merged = mergeConfig(userConfig);

      expect(merged.display.layout).toBe('compact');
      expect(merged.display.showModel).toBe(true);
      expect(merged.colors.modelColor).toBe('cyan');
    });
  });

  describe('loadConfig', () => {
    it('应该创建默认配置文件当不存在时', async () => {
      const config = await loadConfig();

      expect(config.display.layout).toBe('compact');

      const configPath = path.join(testPluginDir, 'config.json');
      expect(fs.existsSync(configPath)).toBe(true);

      const fileContent = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(fileContent.display.layout).toBe('compact');
    });

    it('应该加载现有的配置文件', async () => {
      const configPath = path.join(testPluginDir, 'config.json');
      const customConfig = {
        display: {
          layout: 'detailed',
          showModel: false
        }
      };

      fs.mkdirSync(testPluginDir, { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(customConfig), 'utf-8');

      const config = await loadConfig();

      expect(config.display.layout).toBe('detailed');
      expect(config.display.showModel).toBe(false);
      expect(config.display.showContextBar).toBe(true);
    });

    it('应该处理损坏的配置文件', async () => {
      const configPath = path.join(testPluginDir, 'config.json');

      fs.mkdirSync(testPluginDir, { recursive: true });
      fs.writeFileSync(configPath, 'invalid json', 'utf-8');

      const config = await loadConfig();

      expect(config.display.layout).toBe('compact');
    });

    it('应该处理读取错误', async () => {
      const configPath = path.join(testPluginDir, 'config.json');
      fs.mkdirSync(testPluginDir, { recursive: true });
      fs.mkdirSync(configPath);

      const config = await loadConfig();

      expect(config.display.layout).toBe('compact');
    });
  });

  describe('saveConfig', () => {
    it('应该保存配置到文件', async () => {
      const config: HudConfig = {
        display: {
          layout: 'detailed',
          showModel: false,
          showContextBar: true,
          showTokenCounts: true,
          showSeparators: true,
          compactNumbers: false
        },
        colors: {
          safeThreshold: 60,
          warningThreshold: 85,
          modelColor: 'blue',
          progressStyle: 'text'
        },
        format: {
          modelFormat: 'Model: {name}',
          percentagePrecision: 1
        }
      };

      await saveConfig(config);

      const configPath = path.join(testPluginDir, 'config.json');
      expect(fs.existsSync(configPath)).toBe(true);

      const fileContent = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(fileContent.display.layout).toBe('detailed');
      expect(fileContent.display.showModel).toBe(false);
      expect(fileContent.colors.modelColor).toBe('blue');
      expect(fileContent.format.percentagePrecision).toBe(1);
    });

    it('应该创建插件目录当不存在时', async () => {
      if (fs.existsSync(testPluginDir)) {
        fs.rmSync(testPluginDir, { recursive: true });
      }

      const config = DEFAULT_CONFIG;
      await saveConfig(config);

      expect(fs.existsSync(testPluginDir)).toBe(true);
    });

    it('应该处理写入错误', async () => {
      const readOnlyDir = path.join(os.tmpdir(), 'readonly-test-dir');
      fs.mkdirSync(readOnlyDir, { recursive: true });
      fs.chmodSync(readOnlyDir, 0o444);

      setPluginDir(readOnlyDir);

      const config = DEFAULT_CONFIG;

      await expect(saveConfig(config)).rejects.toThrow();

      fs.chmodSync(readOnlyDir, 0o755);
      fs.rmSync(readOnlyDir, { recursive: true });
    });
  });

  describe('配置持久化', () => {
    it('应该保存和加载相同的配置', async () => {
      const originalConfig: HudConfig = {
        display: {
          layout: 'detailed',
          showModel: false,
          showContextBar: true,
          showTokenCounts: true,
          showSeparators: false,
          compactNumbers: true
        },
        colors: {
          safeThreshold: 65,
          warningThreshold: 88,
          modelColor: 'magenta',
          progressStyle: 'percentage'
        },
        format: {
          modelFormat: '{name} ({id})',
          percentagePrecision: 2
        }
      };

      await saveConfig(originalConfig);
      const loadedConfig = await loadConfig();

      expect(loadedConfig).toEqual(originalConfig);
    });
  });
});
