"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.setPluginDir = setPluginDir;
exports.getPluginDir = getPluginDir;
exports.getConfigPath = getConfigPath;
exports.mergeConfig = mergeConfig;
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
exports.DEFAULT_CONFIG = {
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
let _pluginDir = null;
function setPluginDir(dir) {
    _pluginDir = dir;
}
function getPluginDir() {
    if (_pluginDir)
        return _pluginDir;
    const homeDir = os.homedir();
    return path.join(homeDir, '.claude', 'plugins', 'claude-hud');
}
function getConfigPath() {
    return path.join(getPluginDir(), 'config.json');
}
function isLayoutType(v) {
    return v === 'compact' || v === 'expanded' || v === 'detailed';
}
function isContextValueMode(v) {
    return v === 'percent' || v === 'tokens' || v === 'both' || v === 'remaining';
}
function isColorName(v) {
    return ['green', 'yellow', 'red', 'cyan', 'blue', 'magenta', 'dim'].includes(v);
}
function isProgressStyle(v) {
    return v === 'bar' || v === 'text' || v === 'percentage';
}
function migrateLegacyLayout(userConfig) {
    if ('layout' in userConfig && !('lineLayout' in userConfig)) {
        const layout = userConfig.layout;
        if (typeof layout === 'string') {
            if (layout === 'separators') {
                userConfig.lineLayout = 'compact';
                userConfig.showSeparators = true;
            }
            else if (layout === 'detailed') {
                userConfig.lineLayout = 'detailed';
            }
            else {
                userConfig.lineLayout = 'compact';
                userConfig.showSeparators = false;
            }
        }
        delete userConfig.layout;
    }
}
function mergeConfig(userConfig) {
    migrateLegacyLayout(userConfig);
    const validated = {};
    if (userConfig.display) {
        const d = userConfig.display;
        const display = {};
        if (isLayoutType(d.lineLayout))
            display.lineLayout = d.lineLayout;
        if (typeof d.showSeparators === 'boolean')
            display.showSeparators = d.showSeparators;
        if (typeof d.showModel === 'boolean')
            display.showModel = d.showModel;
        if (typeof d.showContextBar === 'boolean')
            display.showContextBar = d.showContextBar;
        if (isContextValueMode(d.contextValue))
            display.contextValue = d.contextValue;
        if (typeof d.showTokenCounts === 'boolean')
            display.showTokenCounts = d.showTokenCounts;
        if (typeof d.showTokenBreakdown === 'boolean')
            display.showTokenBreakdown = d.showTokenBreakdown;
        if (typeof d.compactNumbers === 'boolean')
            display.compactNumbers = d.compactNumbers;
        if (typeof d.showTools === 'boolean')
            display.showTools = d.showTools;
        if (typeof d.showAgents === 'boolean')
            display.showAgents = d.showAgents;
        if (typeof d.showTodos === 'boolean')
            display.showTodos = d.showTodos;
        if (typeof d.showProject === 'boolean')
            display.showProject = d.showProject;
        if (typeof d.showConfigCounts === 'boolean')
            display.showConfigCounts = d.showConfigCounts;
        if (typeof d.showDuration === 'boolean')
            display.showDuration = d.showDuration;
        if (typeof d.showSpeed === 'boolean')
            display.showSpeed = d.showSpeed;
        if (typeof d.showUsage === 'boolean')
            display.showUsage = d.showUsage;
        if (typeof d.usageBarEnabled === 'boolean')
            display.usageBarEnabled = d.usageBarEnabled;
        if (typeof d.showSessionName === 'boolean')
            display.showSessionName = d.showSessionName;
        if (typeof d.showSessionTokens === 'boolean')
            display.showSessionTokens = d.showSessionTokens;
        if (typeof d.customLine === 'string')
            display.customLine = d.customLine.slice(0, 80);
        if (typeof d.usageThreshold === 'number')
            display.usageThreshold = Math.max(0, Math.min(100, d.usageThreshold));
        if (typeof d.environmentThreshold === 'number')
            display.environmentThreshold = Math.max(0, Math.min(100, d.environmentThreshold));
        if (Object.keys(display).length > 0)
            validated.display = display;
    }
    if (userConfig.gitStatus) {
        const g = userConfig.gitStatus;
        const gitStatus = {};
        if (typeof g.enabled === 'boolean')
            gitStatus.enabled = g.enabled;
        if (typeof g.showDirty === 'boolean')
            gitStatus.showDirty = g.showDirty;
        if (typeof g.showAheadBehind === 'boolean')
            gitStatus.showAheadBehind = g.showAheadBehind;
        if (typeof g.showFileStats === 'boolean')
            gitStatus.showFileStats = g.showFileStats;
        if (Object.keys(gitStatus).length > 0)
            validated.gitStatus = gitStatus;
    }
    if (userConfig.colors) {
        const c = userConfig.colors;
        const colors = {};
        if (typeof c.safeThreshold === 'number')
            colors.safeThreshold = Math.max(0, Math.min(100, c.safeThreshold));
        if (typeof c.warningThreshold === 'number')
            colors.warningThreshold = Math.max(0, Math.min(100, c.warningThreshold));
        if (isColorName(c.modelColor))
            colors.modelColor = c.modelColor;
        if (isProgressStyle(c.progressStyle))
            colors.progressStyle = c.progressStyle;
        if (Object.keys(colors).length > 0)
            validated.colors = colors;
    }
    if (userConfig.format) {
        const f = userConfig.format;
        const format = {};
        if (typeof f.modelFormat === 'string')
            format.modelFormat = f.modelFormat.slice(0, 100);
        if (typeof f.percentagePrecision === 'number')
            format.percentagePrecision = Math.max(0, Math.min(3, Math.round(f.percentagePrecision)));
        if (Object.keys(format).length > 0)
            validated.format = format;
    }
    return {
        display: { ...exports.DEFAULT_CONFIG.display, ...validated.display },
        gitStatus: { ...exports.DEFAULT_CONFIG.gitStatus, ...validated.gitStatus },
        colors: { ...exports.DEFAULT_CONFIG.colors, ...validated.colors },
        format: { ...exports.DEFAULT_CONFIG.format, ...validated.format },
    };
}
async function loadConfig() {
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
    }
    catch (error) {
        console.error(`Failed to load config: ${error}`);
        return mergeConfig({});
    }
}
async function saveConfig(config) {
    const configPath = getConfigPath();
    try {
        const pluginDir = getPluginDir();
        if (!fs.existsSync(pluginDir)) {
            fs.mkdirSync(pluginDir, { recursive: true });
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    }
    catch (error) {
        console.error(`Failed to save config: ${error}`);
        throw error;
    }
}
