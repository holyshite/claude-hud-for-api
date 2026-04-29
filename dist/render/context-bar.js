"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderContextBar = renderContextBar;
const colors_1 = require("./colors");
function formatTokens(n) {
    if (n >= 1000000)
        return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000)
        return `${(n / 1000).toFixed(0)}k`;
    return n.toString();
}
function renderContextBar(data, config) {
    if (!config.display.showContextBar) {
        return '';
    }
    const { contextPercentage, tokenUsage, contextWindowSize } = data;
    const { safeThreshold, warningThreshold, progressStyle } = config.colors;
    const { percentagePrecision } = config.format;
    const { compactNumbers, contextValue, showTokenBreakdown } = config.display;
    const parts = [];
    const skipBarPercent = contextValue === 'both' || contextValue === 'remaining';
    switch (progressStyle) {
        case 'bar':
            const bar = (0, colors_1.renderProgressBar)(contextPercentage, 10, safeThreshold, warningThreshold);
            if (skipBarPercent) {
                parts.push(bar);
            }
            else {
                const pctColor = (0, colors_1.getContextColor)(contextPercentage, safeThreshold, warningThreshold);
                parts.push(`${bar} ${(0, colors_1.colorize)((0, colors_1.formatPercentage)(contextPercentage, percentagePrecision), pctColor)}`);
            }
            break;
        case 'text':
            const textProgress = (0, colors_1.renderTextProgress)(contextPercentage, safeThreshold, warningThreshold);
            parts.push(textProgress);
            break;
        case 'percentage':
        default:
            if (!skipBarPercent) {
                const percentage = (0, colors_1.formatPercentage)(contextPercentage, percentagePrecision);
                const color = (0, colors_1.getContextColor)(contextPercentage, safeThreshold, warningThreshold);
                parts.push((0, colors_1.colorize)(percentage, color));
            }
            break;
    }
    if (contextWindowSize && tokenUsage.totalTokens > 0) {
        const tokensFormatted = compactNumbers
            ? (0, colors_1.formatCompactNumber)(tokenUsage.totalTokens)
            : tokenUsage.totalTokens.toString();
        const windowFormatted = compactNumbers
            ? (0, colors_1.formatCompactNumber)(contextWindowSize)
            : contextWindowSize.toString();
        switch (contextValue) {
            case 'tokens':
                parts.push(`${tokensFormatted}/${windowFormatted}`);
                break;
            case 'both':
                parts.push(`${(0, colors_1.formatPercentage)(contextPercentage, percentagePrecision)} (${tokensFormatted}/${windowFormatted})`);
                break;
            case 'remaining': {
                const remaining = Math.max(0, 100 - contextPercentage);
                parts.push(`${remaining}%`);
                break;
            }
            case 'percent':
            default:
                parts.push(`${tokensFormatted}/${windowFormatted}`);
                break;
        }
    }
    if (showTokenBreakdown && tokenUsage.totalTokens > 0) {
        const input = formatTokens(tokenUsage.inputTokens);
        const cache = formatTokens(tokenUsage.cacheCreationTokens + tokenUsage.cacheReadTokens);
        parts.push(`(in: ${input}, cache: ${cache})`);
    }
    return parts.join(' ');
}
