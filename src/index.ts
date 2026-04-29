#!/usr/bin/env node

import { readStdin, extractHudData } from './stdin';
import { loadConfig } from './config';
import { render } from './render/index';

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    // 1. 读取stdin数据
    const stdinData = await readStdin();
    if (!stdinData) {
      // 没有数据，可能是从TTY调用，输出调试信息
      console.error('HUD Debug: No stdin data received');
      // 输出占位符，以便在状态栏显示
      console.log('[HUD]');
      process.exit(0);
    }

    // 2. 加载配置
    const config = await loadConfig();

    // 3. 提取HUD数据
    const hudData = extractHudData(stdinData);

    // 4. 渲染输出
    const terminalWidth = process.stdout.columns || 80;
    const output = render(hudData, config, terminalWidth);

    // 5. 输出到stdout
    console.log(output);

  } catch (error) {
    // 发生错误时输出简单错误信息
    console.error(`HUD Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main().catch(error => {
    console.error(`Fatal HUD Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}

export { main };