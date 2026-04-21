#!/usr/bin/env node
/**
 * wechat-key-check.js
 * 检测微信 API 命令执行前是否已配置 WECHAT_APPID 和 WECHAT_APPSECRET
 *
 * exit(2) = BLOCK，显示配置指引
 * exit(0) = 放行
 */

const { readStdinJson, error, getTaoziDir } = require('../lib/utils');

const input = readStdinJson();
if (!input || !input.tool_input) {
  process.exit(0);
}

const command = input.tool_input.command || '';

// 拦截微信 API 调用（curl 直调）和 wechat_publish.py 脚本调用
const isWeChatCommand = /(api\.weixin\.qq\.com|wechat_publish\.py)/.test(command);
if (!isWeChatCommand) {
  process.exit(0);
}

// 解析 $VAR 引用（与 wechat_publish.py 的 resolve() 对齐）
function resolveEnvRef(val) {
  if (!val) return '';
  const m = String(val).match(/^\$([A-Z0-9_]+)$/);
  if (m) return process.env[m[1]] || '';
  return val;
}

// 从新版配置文件读取凭据（优先），回退到 process.env
// 目录解析统一走 utils.getTaoziDir()，支持 TAOZI_HOME 环境变量
function loadYamlCreds() {
  const fs = require('fs');
  const path = require('path');
  const TAOZI = getTaoziDir();

  // 按优先级尝试：config.yaml（全局凭据） > platforms/wechat.yaml（平台配置）
  const candidates = [
    path.join(TAOZI, 'config.yaml'),
    path.join(TAOZI, 'platforms', 'wechat.yaml'),
  ];

  for (const yamlPath of candidates) {
    try {
      const text = fs.readFileSync(yamlPath, 'utf8');
      const appidMatch  = text.match(/appid\s*:\s*(.+)$/m);
      const secretMatch = text.match(/secret\s*:\s*(.+)$/m);
      const appid  = resolveEnvRef(appidMatch  ? appidMatch[1].trim()  : '');
      const secret = resolveEnvRef(secretMatch ? secretMatch[1].trim() : '');
      if (appid || secret) return { appid, secret };
    } catch (_) {}
  }

  return { appid: '', secret: '' };
}

// 检查必要凭据：YAML 优先，回退标准环境变量
const yamlCreds = loadYamlCreds();
const appid  = yamlCreds.appid  || process.env.WECHAT_APPID  || '';
const secret = yamlCreds.secret || process.env.WECHAT_APPSECRET || '';

if (appid.trim().length > 0 && secret.trim().length > 0) {
  process.exit(0);
}

// 未配置，拦截并给出清晰的设置指引
const missing = [];
if (!appid.trim())  missing.push('WECHAT_APPID');
if (!secret.trim()) missing.push('WECHAT_APPSECRET');

error('');
error('╔══════════════════════════════════════════════════════╗');
error('║         微信公众号 API 凭据未配置                      ║');
error('╠══════════════════════════════════════════════════════╣');
error('║  /taozi:wechat 需要以下环境变量才能使用                ║');
error('╚══════════════════════════════════════════════════════╝');
error('');
error('【缺少的变量】');
missing.forEach(v => error('  - ' + v));
error('');
error('【获取凭据】');
error('  访问 https://developers.weixin.qq.com/platform');
error('  → 选择公众号 → 基础信息 → AppID / AppSecret');
error('');
error('【配置方式】');
error('  临时（当前终端）:');
error('    export WECHAT_APPID=wx_xxxxxx');
error('    export WECHAT_APPSECRET=xxxxxx');
error('');
error('  永久（推荐，重启后依然有效）:');
error('    echo \'export WECHAT_APPID=wx_xxxxxx\' >> ~/.zshrc');
error('    echo \'export WECHAT_APPSECRET=xxxxxx\' >> ~/.zshrc');
error('    source ~/.zshrc');
error('');
error('  如果用的是 bash:');
error('    echo \'export WECHAT_APPID=wx_xxxxxx\' >> ~/.bashrc');
error('    echo \'export WECHAT_APPSECRET=xxxxxx\' >> ~/.bashrc');
error('    source ~/.bashrc');
error('');
error('【IP 白名单（必须配置，否则调用失败）】');
error('  1. 运行 `curl -s https://ifconfig.me` 获取本机公网 IP');
error('  2. 登录微信公众平台 → 公众号 → 基础信息 → API IP 白名单 → 编辑 → 添加 IP');
error('  提示：有代理服务器可在 ~/.taozi/platforms/wechat/style.yaml 的 proxy 字段填入，无需配白名单');
error('');
error('配置完成后重新执行命令即可。');
error('');

process.exit(2);
