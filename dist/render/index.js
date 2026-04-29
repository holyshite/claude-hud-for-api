"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderContextBar = exports.renderTokenLine = exports.renderModelLine = void 0;
exports.renderHud = renderHud;
exports.renderAdaptiveHud = renderAdaptiveHud;
exports.render = render;
const model_line_1 = require("./model-line");
const token_line_1 = require("./token-line");
const context_bar_1 = require("./context-bar");
var model_line_2 = require("./model-line");
Object.defineProperty(exports, "renderModelLine", { enumerable: true, get: function () { return model_line_2.renderModelLine; } });
var token_line_2 = require("./token-line");
Object.defineProperty(exports, "renderTokenLine", { enumerable: true, get: function () { return token_line_2.renderTokenLine; } });
var context_bar_2 = require("./context-bar");
Object.defineProperty(exports, "renderContextBar", { enumerable: true, get: function () { return context_bar_2.renderContextBar; } });
const UNKNOWN_TERMINAL_WIDTH = 80;
function getTerminalWidth() {
    var _a, _b, _c;
    const stdoutColumns = (_a = process.stdout) === null || _a === void 0 ? void 0 : _a.columns;
    if (typeof stdoutColumns === 'number' && Number.isFinite(stdoutColumns) && stdoutColumns > 0) {
        return Math.floor(stdoutColumns);
    }
    const stderrColumns = (_b = process.stderr) === null || _b === void 0 ? void 0 : _b.columns;
    if (typeof stderrColumns === 'number' && Number.isFinite(stderrColumns) && stderrColumns > 0) {
        return Math.floor(stderrColumns);
    }
    const envColumns = Number.parseInt((_c = process.env.COLUMNS) !== null && _c !== void 0 ? _c : '', 10);
    if (Number.isFinite(envColumns) && envColumns > 0) {
        return envColumns;
    }
    return UNKNOWN_TERMINAL_WIDTH;
}
const ANSI_ESCAPE_GLOBAL = /(?:\x1b\[[0-9;]*m|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\))/g;
function stripAnsi(str) {
    return str.replace(ANSI_ESCAPE_GLOBAL, '');
}
function visualLength(str) {
    return stripAnsi(str).length;
}
function truncateToWidth(str, maxWidth) {
    if (maxWidth <= 0 || visualLength(str) <= maxWidth) {
        return str;
    }
    const suffix = maxWidth >= 3 ? '...' : '.'.repeat(maxWidth);
    const keep = Math.max(0, maxWidth - suffix.length);
    const clean = stripAnsi(str);
    return clean.slice(0, keep) + suffix;
}
function renderCompact(data, config) {
    const lines = [];
    const parts = [];
    const modelLine = (0, model_line_1.renderModelLine)(data, config);
    if (modelLine)
        parts.push(modelLine);
    const contextBar = (0, context_bar_1.renderContextBar)(data, config);
    if (contextBar)
        parts.push(contextBar);
    const tokenLine = (0, token_line_1.renderTokenLine)(data, config);
    if (tokenLine)
        parts.push(tokenLine);
    if (config.display.showDuration && data.sessionDuration) {
        parts.push(`⏱️ ${data.sessionDuration}`);
    }
    const separator = config.display.showSeparators ? ' | ' : ' ';
    lines.push(parts.join(separator));
    return lines;
}
function collectActivityLines(data, config) {
    const lines = [];
    return lines;
}
function renderExpanded(data, config) {
    const lines = [];
    const modelLine = (0, model_line_1.renderModelLine)(data, config);
    if (modelLine)
        lines.push(modelLine);
    const contextBar = (0, context_bar_1.renderContextBar)(data, config);
    if (contextBar)
        lines.push(contextBar);
    if (config.display.showUsage && data.usageData) {
        const usage = data.usageData;
        if (usage.fiveHour !== null) {
            lines.push(`usage: ${usage.fiveHour}%`);
        }
    }
    if (config.display.showSessionTokens && data.sessionTokens) {
        const st = data.sessionTokens;
        const total = st.inputTokens + st.outputTokens + st.cacheCreationTokens + st.cacheReadTokens;
        if (total > 0) {
            const fmt = (n) => {
                if (n >= 1000000)
                    return `${(n / 1000000).toFixed(1)}M`;
                if (n >= 1000)
                    return `${(n / 1000).toFixed(0)}k`;
                return n.toString();
            };
            const parts = [`i:${fmt(st.inputTokens)}`, `o:${fmt(st.outputTokens)}`];
            if (st.cacheCreationTokens > 0 || st.cacheReadTokens > 0) {
                parts.push(`c:${fmt(st.cacheCreationTokens + st.cacheReadTokens)}`);
            }
            lines.push(`T ${fmt(total)} (${parts.join(', ')})`);
        }
    }
    if (config.display.showDuration && data.sessionDuration) {
        lines.push(`⏱️ ${data.sessionDuration}`);
    }
    return lines;
}
function renderHud(data, config) {
    const lines = [];
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
    }
    else if (lineLayout === 'expanded') {
        const expandedLines = renderExpanded(data, config);
        lines.push(...expandedLines);
        const activityLines = collectActivityLines(data, config);
        if (config.display.showSeparators && activityLines.length > 0 && expandedLines.length > 0) {
            const maxWidth = Math.max(...expandedLines.map(visualLength), 20);
            lines.push('─'.repeat(maxWidth));
        }
        lines.push(...activityLines);
    }
    else {
        const modelLine = (0, model_line_1.renderModelLine)(data, config);
        if (modelLine)
            lines.push(modelLine);
        const contextBar = (0, context_bar_1.renderContextBar)(data, config);
        if (contextBar)
            lines.push(contextBar);
        const tokenLine = (0, token_line_1.renderTokenLine)(data, config);
        if (tokenLine)
            lines.push(tokenLine);
    }
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    return nonEmptyLines.join('\n');
}
function renderAdaptiveHud(data, config, terminalWidth) {
    const tw = terminalWidth !== null && terminalWidth !== void 0 ? terminalWidth : getTerminalWidth();
    const baseOutput = renderHud(data, config);
    if (tw <= 0) {
        return baseOutput;
    }
    const lines = baseOutput.split('\n');
    if (config.display.lineLayout === 'expanded' || config.display.lineLayout === 'detailed') {
        if (lines.some(line => visualLength(line) > tw)) {
            const compactConfig = {
                ...config,
                display: { ...config.display, lineLayout: 'compact', showSeparators: false },
            };
            return renderHud(data, compactConfig);
        }
    }
    return lines.map(line => truncateToWidth(line, tw)).join('\n');
}
function render(data, config, terminalWidth) {
    return renderAdaptiveHud(data, config, terminalWidth);
}
