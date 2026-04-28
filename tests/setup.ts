// 测试设置文件
import { jest, beforeAll, afterAll } from '@jest/globals';

// 全局测试超时设置
jest.setTimeout(10000);

// 清理console输出，避免测试输出干扰
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// 模拟process.stdout.columns用于终端宽度测试
Object.defineProperty(process.stdout, 'columns', {
  writable: true,
  value: 80
});

// 模拟process.stdin.isTTY
Object.defineProperty(process.stdin, 'isTTY', {
  writable: true,
  value: false
});

// 测试辅助函数
export function mockProcessExit() {
  const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit(${code})`);
  });
  return mockExit;
}

export function mockConsoleOutput() {
  const logs: string[] = [];
  const errors: string[] = [];

  console.log = jest.fn((...args) => {
    logs.push(args.join(' '));
  });

  console.error = jest.fn((...args) => {
    errors.push(args.join(' '));
  });

  return {
    logs,
    errors,
    restore: () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    }
  };
}

// 测试数据生成器
export function createTestStdinData(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);

  return {
    model: {
      id: 'anthropic.claude-3-5-sonnet-20241022',
      display_name: 'Claude 3.5 Sonnet'
    },
    context_window: {
      context_window_size: 200000,
      current_usage: {
        input_tokens: 45000,
        output_tokens: 39000,
        cache_creation_input_tokens: 5000,
        cache_read_input_tokens: 1000
      },
      used_percentage: 47.5
    },
    transcript_path: '/path/to/transcript.json',
    cwd: '/home/user/projects',
    ...overrides
  };
}

// 模拟文件系统
export function mockFs() {
  const fsMock: Record<string, string> = {};

  jest.mock('node:fs', () => ({
    ...(jest.requireActual('node:fs') as any),
    existsSync: jest.fn((path: string) => path in fsMock),
    readFileSync: jest.fn((path: string) => {
      if (path in fsMock) {
        return fsMock[path];
      }
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }),
    writeFileSync: jest.fn((path: string, content: string) => {
      fsMock[path] = content;
    }),
    mkdirSync: jest.fn((path: string) => {
      // 简化实现
    }),
    rmSync: jest.fn()
  }));

  return {
    files: fsMock,
    clear: () => {
      Object.keys(fsMock).forEach(key => delete fsMock[key]);
    }
  };
}