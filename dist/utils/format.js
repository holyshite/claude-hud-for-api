"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatNumberWithCommas = formatNumberWithCommas;
exports.formatFileSize = formatFileSize;
exports.formatDuration = formatDuration;
exports.truncateText = truncateText;
exports.fitToTerminalWidth = fitToTerminalWidth;
exports.stripAnsi = stripAnsi;
exports.visibleLength = visibleLength;
function formatNumberWithCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}
function formatDuration(ms) {
    if (ms < 1000) {
        return `${ms}ms`;
    }
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
        return `${minutes}m ${remainingSeconds}s`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}
function truncateText(text, maxLength, ellipsis = '...') {
    if (text.length <= maxLength) {
        return text;
    }
    const keepLength = maxLength - ellipsis.length;
    if (keepLength <= 0) {
        return ellipsis.slice(0, maxLength);
    }
    return text.slice(0, keepLength) + ellipsis;
}
function fitToTerminalWidth(text, terminalWidth) {
    const lines = text.split('\n');
    const fittedLines = lines.map(line => {
        if (line.length <= terminalWidth) {
            return line;
        }
        return line.slice(0, terminalWidth - 3) + '...';
    });
    return fittedLines.join('\n');
}
function stripAnsi(text) {
    return text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}
function visibleLength(text) {
    return stripAnsi(text).length;
}
