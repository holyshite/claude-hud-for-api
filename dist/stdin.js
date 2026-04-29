"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readStdin = readStdin;
exports.getTotalTokens = getTotalTokens;
exports.getContextPercentage = getContextPercentage;
exports.getModelName = getModelName;
exports.getUsageFromStdin = getUsageFromStdin;
exports.extractHudData = extractHudData;
const DEFAULT_FIRST_BYTE_TIMEOUT_MS = 250;
const DEFAULT_IDLE_TIMEOUT_MS = 30;
const DEFAULT_MAX_STDIN_BYTES = 256 * 1024;
async function readStdin(stream = process.stdin, options = {}) {
    var _a, _b, _c;
    if (stream.isTTY) {
        return null;
    }
    const firstByteTimeoutMs = (_a = options.firstByteTimeoutMs) !== null && _a !== void 0 ? _a : DEFAULT_FIRST_BYTE_TIMEOUT_MS;
    const idleTimeoutMs = (_b = options.idleTimeoutMs) !== null && _b !== void 0 ? _b : DEFAULT_IDLE_TIMEOUT_MS;
    const maxBytes = (_c = options.maxBytes) !== null && _c !== void 0 ? _c : DEFAULT_MAX_STDIN_BYTES;
    try {
        stream.setEncoding('utf8');
    }
    catch {
        return null;
    }
    return await new Promise((resolve) => {
        let raw = '';
        let settled = false;
        let sawData = false;
        let firstByteTimer;
        let idleTimer;
        const cleanup = () => {
            if (firstByteTimer) {
                clearTimeout(firstByteTimer);
                firstByteTimer = undefined;
            }
            if (idleTimer) {
                clearTimeout(idleTimer);
                idleTimer = undefined;
            }
            stream.off('data', onData);
            stream.off('end', onEnd);
            stream.off('error', onError);
            stream.pause();
        };
        const finish = (value) => {
            if (settled) {
                return;
            }
            settled = true;
            cleanup();
            resolve(value);
        };
        const tryParse = () => {
            const trimmed = raw.trim();
            if (!trimmed) {
                return null;
            }
            try {
                return JSON.parse(trimmed);
            }
            catch {
                return undefined;
            }
        };
        const scheduleIdleParse = () => {
            if (idleTimer) {
                clearTimeout(idleTimer);
            }
            idleTimer = setTimeout(() => {
                const parsed = tryParse();
                finish(parsed !== null && parsed !== void 0 ? parsed : null);
            }, idleTimeoutMs);
        };
        const onData = (chunk) => {
            sawData = true;
            if (firstByteTimer) {
                clearTimeout(firstByteTimer);
                firstByteTimer = undefined;
            }
            raw += String(chunk);
            if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
                finish(null);
                return;
            }
            const parsed = tryParse();
            if (parsed !== undefined) {
                finish(parsed);
                return;
            }
            scheduleIdleParse();
        };
        const onEnd = () => {
            const parsed = tryParse();
            finish(parsed !== null && parsed !== void 0 ? parsed : null);
        };
        const onError = () => {
            finish(null);
        };
        firstByteTimer = setTimeout(() => {
            if (!sawData) {
                finish(null);
            }
        }, firstByteTimeoutMs);
        stream.on('data', onData);
        stream.on('end', onEnd);
        stream.on('error', onError);
    });
}
function getTotalTokens(stdin) {
    var _a, _b, _c, _d, _e;
    const usage = (_a = stdin.context_window) === null || _a === void 0 ? void 0 : _a.current_usage;
    return (((_b = usage === null || usage === void 0 ? void 0 : usage.input_tokens) !== null && _b !== void 0 ? _b : 0) +
        ((_c = usage === null || usage === void 0 ? void 0 : usage.output_tokens) !== null && _c !== void 0 ? _c : 0) +
        ((_d = usage === null || usage === void 0 ? void 0 : usage.cache_creation_input_tokens) !== null && _d !== void 0 ? _d : 0) +
        ((_e = usage === null || usage === void 0 ? void 0 : usage.cache_read_input_tokens) !== null && _e !== void 0 ? _e : 0));
}
function getNativePercent(stdin) {
    var _a;
    const nativePercent = (_a = stdin.context_window) === null || _a === void 0 ? void 0 : _a.used_percentage;
    if (typeof nativePercent === 'number' && !Number.isNaN(nativePercent)) {
        return Math.min(100, Math.max(0, Math.round(nativePercent)));
    }
    return null;
}
function getContextPercentage(stdin) {
    var _a;
    const native = getNativePercent(stdin);
    if (native !== null) {
        return native;
    }
    const size = (_a = stdin.context_window) === null || _a === void 0 ? void 0 : _a.context_window_size;
    if (!size || size <= 0) {
        return 0;
    }
    const totalTokens = getTotalTokens(stdin);
    return Math.min(100, Math.round((totalTokens / size) * 100));
}
function getModelName(stdin) {
    var _a, _b, _c, _d;
    const displayName = (_b = (_a = stdin.model) === null || _a === void 0 ? void 0 : _a.display_name) === null || _b === void 0 ? void 0 : _b.trim();
    if (displayName) {
        return displayName;
    }
    const modelId = (_d = (_c = stdin.model) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.trim();
    if (!modelId) {
        return 'Unknown';
    }
    let id = modelId;
    if (id.startsWith('anthropic.')) {
        id = id.slice('anthropic.'.length);
    }
    let match = id.match(/^claude-(\d+)(?:-(\d+))?-(\w+)(?:-\d{8})?$/);
    if (match) {
        const major = match[1];
        const minor = match[2];
        const variant = match[3];
        const version = minor ? `${major}.${minor}` : major;
        const variantName = variant.charAt(0).toUpperCase() + variant.slice(1);
        return `Claude ${version} ${variantName}`;
    }
    match = id.match(/^claude-(\w+)-(\d+)(?:-(\d{1,7}))?(?:-\d{8})?$/);
    if (match) {
        const variant = match[1];
        const major = match[2];
        const minor = match[3];
        const version = minor ? `${major}.${minor}` : major;
        const variantName = variant.charAt(0).toUpperCase() + variant.slice(1);
        return `Claude ${variantName} ${version}`;
    }
    return id;
}
function parseRateLimitPercent(value) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return null;
    return Math.round(Math.min(100, Math.max(0, value)));
}
function parseRateLimitResetAt(value) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)
        return null;
    return new Date(value * 1000);
}
function getUsageFromStdin(stdin) {
    var _a, _b, _c, _d;
    const rateLimits = stdin.rate_limits;
    if (!rateLimits)
        return null;
    const fiveHour = parseRateLimitPercent((_a = rateLimits.five_hour) === null || _a === void 0 ? void 0 : _a.used_percentage);
    const sevenDay = parseRateLimitPercent((_b = rateLimits.seven_day) === null || _b === void 0 ? void 0 : _b.used_percentage);
    if (fiveHour === null && sevenDay === null)
        return null;
    return {
        fiveHour,
        sevenDay,
        fiveHourResetAt: parseRateLimitResetAt((_c = rateLimits.five_hour) === null || _c === void 0 ? void 0 : _c.resets_at),
        sevenDayResetAt: parseRateLimitResetAt((_d = rateLimits.seven_day) === null || _d === void 0 ? void 0 : _d.resets_at),
    };
}
function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
}
function extractHudData(stdin) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const modelName = getModelName(stdin);
    const contextPercentage = getContextPercentage(stdin);
    const usage = (_a = stdin.context_window) === null || _a === void 0 ? void 0 : _a.current_usage;
    const tokenUsage = {
        inputTokens: (_b = usage === null || usage === void 0 ? void 0 : usage.input_tokens) !== null && _b !== void 0 ? _b : 0,
        outputTokens: (_c = usage === null || usage === void 0 ? void 0 : usage.output_tokens) !== null && _c !== void 0 ? _c : 0,
        cacheCreationTokens: (_d = usage === null || usage === void 0 ? void 0 : usage.cache_creation_input_tokens) !== null && _d !== void 0 ? _d : 0,
        cacheReadTokens: (_e = usage === null || usage === void 0 ? void 0 : usage.cache_read_input_tokens) !== null && _e !== void 0 ? _e : 0,
        totalTokens: getTotalTokens(stdin),
    };
    const hasNativePercentage = ((_f = stdin.context_window) === null || _f === void 0 ? void 0 : _f.used_percentage) !== undefined;
    let sessionTokens;
    const usageData = getUsageFromStdin(stdin);
    let sessionDuration;
    const durationMs = (_g = stdin.cost) === null || _g === void 0 ? void 0 : _g.total_duration_ms;
    if (typeof durationMs === 'number' && durationMs > 0) {
        sessionDuration = formatDuration(durationMs);
    }
    return {
        modelName,
        modelId: (_h = stdin.model) === null || _h === void 0 ? void 0 : _h.id,
        contextWindowSize: (_j = stdin.context_window) === null || _j === void 0 ? void 0 : _j.context_window_size,
        tokenUsage,
        contextPercentage,
        hasNativePercentage,
        sessionTokens: undefined,
        sessionDuration,
        gitStatus: undefined,
        usageData,
    };
}
