"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTokenLine = renderTokenLine;
const colors_1 = require("./colors");
function renderTokenLine(data, config) {
    if (!config.display.showTokenCounts) {
        return '';
    }
    const { tokenUsage, contextWindowSize } = data;
    const parts = [];
    if (tokenUsage.inputTokens > 0) {
        const formatted = config.display.compactNumbers
            ? (0, colors_1.formatCompactNumber)(tokenUsage.inputTokens)
            : tokenUsage.inputTokens.toString();
        parts.push(`In: ${formatted}`);
    }
    if (tokenUsage.outputTokens > 0) {
        const formatted = config.display.compactNumbers
            ? (0, colors_1.formatCompactNumber)(tokenUsage.outputTokens)
            : tokenUsage.outputTokens.toString();
        parts.push(`Out: ${formatted}`);
    }
    if (tokenUsage.cacheCreationTokens > 0) {
        const formatted = config.display.compactNumbers
            ? (0, colors_1.formatCompactNumber)(tokenUsage.cacheCreationTokens)
            : tokenUsage.cacheCreationTokens.toString();
        parts.push(`Cache+: ${formatted}`);
    }
    if (tokenUsage.cacheReadTokens > 0) {
        const formatted = config.display.compactNumbers
            ? (0, colors_1.formatCompactNumber)(tokenUsage.cacheReadTokens)
            : tokenUsage.cacheReadTokens.toString();
        parts.push(`Cache-: ${formatted}`);
    }
    if (tokenUsage.totalTokens > 0) {
        const formatted = config.display.compactNumbers
            ? (0, colors_1.formatCompactNumber)(tokenUsage.totalTokens)
            : tokenUsage.totalTokens.toString();
        parts.push(`Total: ${formatted}`);
        if (contextWindowSize) {
            const windowFormatted = config.display.compactNumbers
                ? (0, colors_1.formatCompactNumber)(contextWindowSize)
                : contextWindowSize.toString();
            parts.push(`Window: ${windowFormatted}`);
        }
    }
    return parts.join(' | ');
}
