import type { StdinData, TokenUsage, HudData } from './types';

type StdinStream = Pick<NodeJS.ReadStream, 'setEncoding' | 'on' | 'off' | 'pause'> & {
  isTTY?: boolean;
};

type ReadStdinOptions = {
  firstByteTimeoutMs?: number;
  idleTimeoutMs?: number;
  maxBytes?: number;
};

const DEFAULT_FIRST_BYTE_TIMEOUT_MS = 250;
const DEFAULT_IDLE_TIMEOUT_MS = 30;
const DEFAULT_MAX_STDIN_BYTES = 256 * 1024;

/**
 * Read and parse JSON data from stdin
 */
export async function readStdin(
  stream: StdinStream = process.stdin,
  options: ReadStdinOptions = {},
): Promise<StdinData | null> {
  if (stream.isTTY) {
    return null;
  }

  const firstByteTimeoutMs = options.firstByteTimeoutMs ?? DEFAULT_FIRST_BYTE_TIMEOUT_MS;
  const idleTimeoutMs = options.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_STDIN_BYTES;

  try {
    stream.setEncoding('utf8');
  } catch {
    return null;
  }

  return await new Promise<StdinData | null>((resolve) => {
    let raw = '';
    let settled = false;
    let sawData = false;
    let firstByteTimer: ReturnType<typeof setTimeout> | undefined;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const cleanup = (): void => {
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

    const finish = (value: StdinData | null): void => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(value);
    };

    const tryParse = (): StdinData | null | undefined => {
      const trimmed = raw.trim();
      if (!trimmed) {
        return null;
      }

      try {
        return JSON.parse(trimmed) as StdinData;
      } catch {
        return undefined;
      }
    };

    const scheduleIdleParse = (): void => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      idleTimer = setTimeout(() => {
        const parsed = tryParse();
        finish(parsed ?? null);
      }, idleTimeoutMs);
    };

    const onData = (chunk: string | Buffer): void => {
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

    const onEnd = (): void => {
      const parsed = tryParse();
      finish(parsed ?? null);
    };

    const onError = (): void => {
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

/**
 * Calculate total tokens from stdin data
 */
export function getTotalTokens(stdin: StdinData): number {
  const usage = stdin.context_window?.current_usage;
  return (
    (usage?.input_tokens ?? 0) +
    (usage?.output_tokens ?? 0) +
    (usage?.cache_creation_input_tokens ?? 0) +
    (usage?.cache_read_input_tokens ?? 0)
  );
}

/**
 * Get native percentage from Claude Code v2.1.6+ if available
 */
function getNativePercent(stdin: StdinData): number | null {
  const nativePercent = stdin.context_window?.used_percentage;
  if (typeof nativePercent === 'number' && !Number.isNaN(nativePercent)) {
    return Math.min(100, Math.max(0, Math.round(nativePercent)));
  }
  return null;
}

/**
 * Calculate context window usage percentage
 */
export function getContextPercentage(stdin: StdinData): number {
  // Prefer native percentage (v2.1.6+)
  const native = getNativePercent(stdin);
  if (native !== null) {
    return native;
  }

  // Fallback: manual calculation
  const size = stdin.context_window?.context_window_size;
  if (!size || size <= 0) {
    return 0;
  }

  const totalTokens = getTotalTokens(stdin);
  return Math.min(100, Math.round((totalTokens / size) * 100));
}

/**
 * Get model name from stdin data
 */
export function getModelName(stdin: StdinData): string {
  const displayName = stdin.model?.display_name?.trim();
  if (displayName) {
    return displayName;
  }

  const modelId = stdin.model?.id?.trim();
  if (!modelId) {
    return 'Unknown';
  }

  // Strip anthropic. prefix if present
  let id = modelId;
  if (id.startsWith('anthropic.')) {
    id = id.slice('anthropic.'.length);
  }

  // Pattern 1: claude-MAJOR[-MINOR]-VARIANT[-DATE] (old API format)
  let match = id.match(/^claude-(\d+)(?:-(\d+))?-(\w+)(?:-\d{8})?$/);
  if (match) {
    const major = match[1];
    const minor = match[2];
    const variant = match[3];
    const version = minor ? `${major}.${minor}` : major;
    const variantName = variant.charAt(0).toUpperCase() + variant.slice(1);
    return `Claude ${version} ${variantName}`;
  }

  // Pattern 2: claude-VARIANT-MAJOR[-MINOR][-DATE] (new API format)
  // Use \d{1,7} for minor so 8-digit dates don't get captured as version
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

/**
 * Extract and format all HUD data from stdin
 */
export function extractHudData(stdin: StdinData): HudData {
  const modelName = getModelName(stdin);
  const contextPercentage = getContextPercentage(stdin);

  const usage = stdin.context_window?.current_usage;
  const tokenUsage: TokenUsage = {
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    cacheCreationTokens: usage?.cache_creation_input_tokens ?? 0,
    cacheReadTokens: usage?.cache_read_input_tokens ?? 0,
    totalTokens: getTotalTokens(stdin),
  };

  const hasNativePercentage = stdin.context_window?.used_percentage !== undefined;

  return {
    modelName,
    modelId: stdin.model?.id,
    contextWindowSize: stdin.context_window?.context_window_size,
    tokenUsage,
    contextPercentage,
    hasNativePercentage,
  };
}