#!/usr/bin/env python3
import json
import os

settings_file = os.path.expanduser('~/.claude/settings.json')
plugin_dir = '/home/peter/projects/claude-hud-for-api'
node_path = '/home/peter/.nvm/versions/node/v18.20.8/bin/node'

try:
    with open(settings_file, 'r') as f:
        settings = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    settings = {}

# 修复statusLine配置
settings['statusLine'] = {
    'type': 'command',
    'command': f'bash -c "plugin_dir=\\"{plugin_dir}\\"; exec \\"{node_path}\\" \\"${{plugin_dir}}/dist/index.js\\""',
    'padding': 1,
    'interval': 300
}

with open(settings_file, 'w') as f:
    json.dump(settings, f, indent=2)

print(f'已修复 {settings_file}')
print('配置内容:')
print(json.dumps(settings, indent=2))