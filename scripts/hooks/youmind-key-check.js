#!/usr/bin/env node
/**
 * youmind-key-check.js
 * 检测 YouMind CLI 命令执行前是否已配置 YOUMIND_API_KEY
 *
 * exit(2) = BLOCK，显示配置指引
 * exit(0) = 放行
 */

const { readStdinJson, error } = require('../lib/utils');

const input = readStdinJson();
if (!input || !input.tool_input) {
  process.exit(0);
}

const command = input.tool_input.command || '';

// 只拦截 youmind CLI 命令
const isYouMindCommand = /\byoumind\b/.test(command);
if (!isYouMindCommand) {
  process.exit(0);
}

// 从 ~/.taozi/config.yaml 读取 youmind.api_key（优先），回退 process.env
function loadYamlApiKey() {
  const fs = require('fs');
  const os = require('os');
  const yamlPath = `${os.homedir()}/.taozi/config.yaml`;
  try {
    const text = fs.readFileSync(yamlPath, 'utf8');
    const m = text.match(/^\s+api_key\s*:\s*(.+)$/m);
    if (!m) return '';
    const val = m[1].trim();
    const envRef = val.match(/^\$([A-Z0-9_]+)$/);
    return envRef ? (process.env[envRef[1]] || '') : val;
  } catch (_) { return ''; }
}

// 检查 API Key 是否已配置：YAML 优先，回退标准环境变量
const apiKey = loadYamlApiKey() || process.env.YOUMIND_API_KEY || '';
if (apiKey.trim().length > 0) {
  process.exit(0);
}

// 未配置，拦截并给出清晰的设置指引
error('');
error('╔══════════════════════════════════════════════════════╗');
error('║         YouMind API Key 未配置                        ║');
error('╠══════════════════════════════════════════════════════╣');
error('║  /taozi:image · /taozi:research · /taozi:infographic ║');
error('║  /taozi:clip · /taozi:ppt · /taozi:webpage           ║');
error('║  /taozi:wechat · /taozi:xiaohongshu                  ║');
error('║  以上功能需要 YOUMIND_API_KEY 才能使用               ║');
error('╚══════════════════════════════════════════════════════╝');
error('');
error('【获取 API Key】');
error('  访问 https://youmind.com → 设置 → API Key → 生成');
error('');
error('【配置方式】');
error('  临时（当前终端）:');
error('    export YOUMIND_API_KEY=sk-ym-xxxxxx');
error('');
error('  永久（推荐，重启后依然有效）:');
error('    echo \'export YOUMIND_API_KEY=sk-ym-xxxxxx\' >> ~/.zshrc');
error('    source ~/.zshrc');
error('');
error('  如果用的是 bash:');
error('    echo \'export YOUMIND_API_KEY=sk-ym-xxxxxx\' >> ~/.bashrc');
error('    source ~/.bashrc');
error('');
error('配置完成后重新执行命令即可。');
error('');

process.exit(2);
