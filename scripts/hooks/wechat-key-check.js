#!/usr/bin/env node
/**
 * wechat-key-check.js
 * 检测微信 API 命令执行前是否已配置 WECHAT_APPID 和 WECHAT_APPSECRET
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

// 拦截微信 API 调用（curl 直调）和 wechat_publish.py 脚本调用
const isWeChatCommand = /(api\.weixin\.qq\.com|wechat_publish\.py)/.test(command);
if (!isWeChatCommand) {
  process.exit(0);
}

// 检查必要凭据是否均已配置
const appid  = process.env.WECHAT_APPID;
const secret = process.env.WECHAT_APPSECRET;

if (appid && appid.trim().length > 0 && secret && secret.trim().length > 0) {
  process.exit(0);
}

// 未配置，拦截并给出清晰的设置指引
const missing = [];
if (!appid  || appid.trim().length  === 0) missing.push('WECHAT_APPID');
if (!secret || secret.trim().length === 0) missing.push('WECHAT_APPSECRET');

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
