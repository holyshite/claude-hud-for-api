"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderRateLimits = renderRateLimits;
const colors_1 = require("./colors");
function renderRateLimits(data, config) {
    if (!config.display.showRateLimits || !data.usageData) {
        return '';
    }
    const { usageData } = data;
    const { safeThreshold, warningThreshold } = config.colors;
    const { percentagePrecision } = config.format;
    const parts = [];
    if (usageData.fiveHour !== null) {
        const percentage = (0, colors_1.formatPercentage)(usageData.fiveHour, percentagePrecision);
        const color = (0, colors_1.getRateLimitColor)(usageData.fiveHour, safeThreshold, warningThreshold);
        const label = (0, colors_1.colorize)(`5h: ${percentage}`, color);
        parts.push(label);
    }
    if (usageData.sevenDay !== null) {
        const percentage = (0, colors_1.formatPercentage)(usageData.sevenDay, percentagePrecision);
        const color = (0, colors_1.getRateLimitColor)(usageData.sevenDay, safeThreshold, warningThreshold);
        const label = (0, colors_1.colorize)(`7d: ${percentage}`, color);
        parts.push(label);
    }
    const resetParts = [];
    if (usageData.fiveHourResetAt) {
        const resetTime = formatResetTime(usageData.fiveHourResetAt);
        resetParts.push(`5h reset: ${resetTime}`);
    }
    if (usageData.sevenDayResetAt) {
        const resetTime = formatResetTime(usageData.sevenDayResetAt);
        resetParts.push(`7d reset: ${resetTime}`);
    }
    if (resetParts.length > 0) {
        parts.push(`(${resetParts.join(', ')})`);
    }
    return parts.join(' ');
}
function formatResetTime(date) {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    if (diffMs <= 0) {
        return 'now';
    }
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
}
