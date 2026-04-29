"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WHITE = exports.CYAN = exports.MAGENTA = exports.BLUE = exports.YELLOW = exports.GREEN = exports.RED = exports.DIM = exports.RESET = void 0;
exports.getColor = getColor;
exports.colorize = colorize;
exports.getContextColor = getContextColor;
exports.renderProgressBar = renderProgressBar;
exports.renderTextProgress = renderTextProgress;
exports.formatCompactNumber = formatCompactNumber;
exports.formatPercentage = formatPercentage;
exports.RESET = '\x1b[0m';
exports.DIM = '\x1b[2m';
exports.RED = '\x1b[31m';
exports.GREEN = '\x1b[32m';
exports.YELLOW = '\x1b[33m';
exports.BLUE = '\x1b[34m';
exports.MAGENTA = '\x1b[35m';
exports.CYAN = '\x1b[36m';
exports.WHITE = '\x1b[37m';
const COLOR_MAP = {
    green: exports.GREEN,
    yellow: exports.YELLOW,
    red: exports.RED,
    cyan: exports.CYAN,
    blue: exports.BLUE,
    magenta: exports.MAGENTA,
    dim: exports.DIM,
};
function getColor(color) {
    return COLOR_MAP[color] || exports.CYAN;
}
function colorize(text, color) {
    return `${getColor(color)}${text}${exports.RESET}`;
}
function getContextColor(percent, safeThreshold, warningThreshold) {
    if (percent >= warningThreshold)
        return 'red';
    if (percent >= safeThreshold)
        return 'yellow';
    return 'green';
}
function renderProgressBar(percent, width = 10, safeThreshold = 70, warningThreshold = 90) {
    const safeWidth = Math.max(0, Math.round(width));
    const safePercent = Math.min(100, Math.max(0, percent));
    const filled = Math.round((safePercent / 100) * safeWidth);
    const empty = safeWidth - filled;
    const color = getContextColor(safePercent, safeThreshold, warningThreshold);
    const colorCode = getColor(color);
    return `${colorCode}${'█'.repeat(filled)}${exports.DIM}${'░'.repeat(empty)}${exports.RESET}`;
}
function renderTextProgress(percent, safeThreshold = 70, warningThreshold = 90) {
    const color = getContextColor(percent, safeThreshold, warningThreshold);
    return colorize(`${Math.round(percent)}%`, color);
}
function formatCompactNumber(num) {
    if (num >= 1000000) {
        const val = num / 1000000;
        return val % 1 === 0 ? `${val.toFixed(0)}M` : `${val.toFixed(1)}M`;
    }
    if (num >= 1000) {
        const val = num / 1000;
        return val % 1 === 0 ? `${val.toFixed(0)}k` : `${val.toFixed(1)}k`;
    }
    return num.toString();
}
function formatPercentage(percent, precision = 0) {
    if (precision <= 0) {
        return `${Math.round(percent)}%`;
    }
    return `${percent.toFixed(precision)}%`;
}
