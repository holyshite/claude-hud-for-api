#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const stdin_1 = require("./stdin");
const config_1 = require("./config");
const index_1 = require("./render/index");
async function main() {
    try {
        const stdinData = await (0, stdin_1.readStdin)();
        if (!stdinData) {
            console.error('HUD Debug: No stdin data received');
            console.log('[HUD]');
            process.exit(0);
        }
        const config = await (0, config_1.loadConfig)();
        const hudData = (0, stdin_1.extractHudData)(stdinData);
        const terminalWidth = process.stdout.columns || 80;
        const output = (0, index_1.render)(hudData, config, terminalWidth);
        console.log(output);
    }
    catch (error) {
        console.error(`HUD Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}
if (require.main === module) {
    main().catch(error => {
        console.error(`Fatal HUD Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    });
}
