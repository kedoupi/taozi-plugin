#!/usr/bin/env node
/**
 * security-scan.js
 * 会话结束时扫描已修改文件中的安全问题（OWASP Top 10 覆盖）
 *
 * 触发: Stop event
 * 扫描 git diff 中的文件，按严重级别分组报告
 * 仅报告警告，不阻断（始终 exit(0)）
 */

const fs = require('fs');
const path = require('path');
const {
  readStdinJson,
  warn,
  readFile,
  isGitRepo,
  getGitRoot,
  getGitModifiedFiles,
} = require('../lib/utils');

// --- 严重级别 ---

const SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

// --- 安全检查规则（OWASP Top 10 覆盖） ---

const RULES = [
  // ========== CRITICAL: 密钥泄露 ==========

  {
    name: 'AWS Access Key',
    severity: SEVERITY.CRITICAL,
    patterns: [
      { regex: /AKIA[A-Z0-9]{16}/g, desc: 'AWS Access Key ID' },
    ],
  },
  {
    name: 'GitHub Token',
    severity: SEVERITY.CRITICAL,
    patterns: [
      { regex: /ghp_[a-zA-Z0-9]{36}/g, desc: 'GitHub Personal Access Token' },
      { regex: /gho_[a-zA-Z0-9]{36}/g, desc: 'GitHub OAuth Token' },
      { regex: /ghu_[a-zA-Z0-9]{36}/g, desc: 'GitHub User-to-Server Token' },
    ],
  },
  {
    name: 'AI API Key',
    severity: SEVERITY.CRITICAL,
    patterns: [
      { regex: /sk-[a-zA-Z0-9]{20,}/g, desc: 'OpenAI API Key' },
      { regex: /sk-ant-[a-zA-Z0-9]{20,}/g, desc: 'Anthropic API Key' },
    ],
  },
  {
    name: 'Private Key',
    severity: SEVERITY.CRITICAL,
    patterns: [
      { regex: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/g, desc: 'Private Key 文件内容' },
    ],
  },
  {
    name: '硬编码 Secret/密码',
    severity: SEVERITY.CRITICAL,
    patterns: [
      { regex: /password\s*[:=]\s*['"][^'"]{4,}['"]/gi, desc: '硬编码密码' },
      { regex: /jwt\.sign\([^,]+,\s*['"][^'"]{8,}['"]/g, desc: 'JWT 签名使用硬编码密钥' },
    ],
  },
  {
    name: '数据库 URL 含凭据',
    severity: SEVERITY.CRITICAL,
    patterns: [
      { regex: /mongodb:\/\/[^:]+:[^@]+@/g, desc: 'MongoDB 连接串含明文凭据' },
      { regex: /postgres(?:ql)?\/\/[^:]+:[^@]+@/g, desc: 'PostgreSQL 连接串含明文凭据' },
    ],
  },
  {
    name: 'Generic API Key',
    severity: SEVERITY.HIGH,
    patterns: [
      { regex: /api[_-]?key\s*[:=]\s*['"][^'"]{10,}['"]/gi, desc: '硬编码 API Key' },
    ],
  },

  // ========== HIGH: 注入攻击 ==========

  {
    name: 'SQL 注入',
    severity: SEVERITY.HIGH,
    patterns: [
      {
        regex: /(?:SELECT|INSERT|UPDATE|DELETE|DROP)\s+.*\+\s*(?:req|params|body|query|userInput)/gi,
        desc: 'SQL 查询拼接用户输入',
      },
      {
        regex: /`(?:SELECT|INSERT|UPDATE|DELETE|DROP)[^`]*\$\{[^}]+\}/gi,
        desc: '模板字符串拼接 SQL',
      },
    ],
  },
  {
    name: 'NoSQL 注入',
    severity: SEVERITY.HIGH,
    patterns: [
      { regex: /\$where\s*:/g, desc: 'MongoDB $where 操作符（允许任意 JS 执行）' },
      {
        regex: /\$regex\s*:\s*(?:req|params|body|query|userInput)/gi,
        desc: 'MongoDB $regex 使用用户输入',
      },
    ],
  },
  {
    name: '命令注入',
    severity: SEVERITY.HIGH,
    patterns: [
      {
        regex: /(?:exec|execSync|execFile|spawn|spawnSync)\s*\([^)]*(?:\+|`|\$\{)/g,
        desc: '子进程执行拼接用户输入',
      },
      {
        regex: /system\s*\([^)]*(?:\+|`|\$\{)/g,
        desc: 'system() 调用拼接用户输入',
      },
    ],
  },
  {
    name: 'LDAP 注入',
    severity: SEVERITY.HIGH,
    patterns: [
      {
        regex: /ldapSearch|ldap\.bind|ldap\.search[^;]*(?:\+|`|\$\{)/gi,
        desc: 'LDAP 查询拼接用户输入',
      },
    ],
  },

  // ========== HIGH: XSS ==========

  {
    name: 'XSS 风险',
    severity: SEVERITY.HIGH,
    patterns: [
      {
        regex: /\.innerHTML\s*=\s*(?!['"]<)/g,
        desc: 'innerHTML 赋值非常量',
      },
      {
        regex: /dangerouslySetInnerHTML/g,
        desc: 'React dangerouslySetInnerHTML',
      },
      {
        regex: /v-html\s*=\s*(?!['"][\w\s]*['"])/g,
        desc: 'Vue v-html 绑定非常量',
      },
      {
        regex: /document\.write\s*\(/g,
        desc: 'document.write 使用',
      },
      {
        regex: /\{\{\{/g,
        desc: 'Handlebars 三重花括号（未转义输出）',
      },
      {
        regex: /\{!!/g,
        desc: 'Blade 未转义输出 {!!',
      },
    ],
  },

  // ========== HIGH: 认证问题 ==========

  {
    name: '认证配置缺陷',
    severity: SEVERITY.HIGH,
    patterns: [
      {
        regex: /cookie\s*:\s*\{[^}]*(?:secure\s*:\s*false)/g,
        desc: 'Cookie secure 设为 false',
      },
      {
        regex: /httpOnly\s*:\s*false/g,
        desc: 'Cookie httpOnly 设为 false',
      },
      {
        regex: /Access-Control-Allow-Origin['":\s]*\*[^}]*(?:credentials|withCredentials|Authorization)/gi,
        desc: 'CORS 通配符配合凭据',
      },
    ],
  },

  // ========== MEDIUM: 数据泄露 ==========

  {
    name: '敏感日志',
    severity: SEVERITY.MEDIUM,
    patterns: [
      {
        regex: /console\.log\([^)]*(?:password|token|secret|key|auth|credential)/gi,
        desc: 'console.log 输出敏感信息',
      },
      {
        regex: /logger\.(?:info|debug|trace|warn)\([^)]*(?:password|token|secret|key|auth|credential)/gi,
        desc: 'logger 记录敏感字段',
      },
    ],
  },
  {
    name: '生产环境信息泄露',
    severity: SEVERITY.MEDIUM,
    patterns: [
      {
        regex: /res\.(?:json|send|end)\([^)]*(?:err\.stack|error\.stack|new Error\(\))/gi,
        desc: '生产环境返回堆栈跟踪',
      },
      {
        regex: /res\.(?:json|send|end)\([^)]*(?:err\.message|error\.message)/gi,
        desc: '生产环境返回详细错误信息',
      },
    ],
  },

  // ========== LOW: 安全配置 ==========

  {
    name: '调试模式',
    severity: SEVERITY.LOW,
    patterns: [
      { regex: /DEBUG\s*=\s*['"]?true['"]?/gi, desc: '调试模式开启' },
      { regex: /NODE_ENV\s*[:=]\s*['"]development['"]/g, desc: '部署代码中 NODE_ENV=development' },
    ],
  },
];

// --- 文件级检查 ---

const FILE_LEVEL_RULES = [
  {
    name: '.env 文件提交',
    severity: SEVERITY.CRITICAL,
    check: (filePath) => {
      const basename = path.basename(filePath);
      // 允许 .env.example / .env.template，禁止 .env / .env.local / .env.production
      if (/^\.env(?:\.(?!example|template)[a-zA-Z0-9._-]+)?$/.test(basename) && !basename.includes('example') && !basename.includes('template')) {
        return basename;
      }
      return null;
    },
    desc: '.env 文件不应提交到版本控制',
  },
];

// --- 严重级别排序 ---

const SEVERITY_ORDER = [SEVERITY.CRITICAL, SEVERITY.HIGH, SEVERITY.MEDIUM, SEVERITY.LOW];

// --- 查找行号辅助 ---

function getLineNumber(content, matchStr) {
  const idx = content.indexOf(matchStr);
  if (idx === -1) return 0;
  return content.substring(0, idx).split('\n').length;
}

// --- 执行扫描 ---

const input = readStdinJson();
const cwd = process.cwd();

if (!isGitRepo(cwd)) {
  process.exit(0);
}

const root = getGitRoot(cwd);
if (!root) {
  process.exit(0);
}

const modifiedFiles = getGitModifiedFiles(cwd);
if (modifiedFiles.length === 0) {
  process.exit(0);
}

const textExtensions = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.java', '.php', '.rs',
  '.env', '.yaml', '.yml', '.json', '.toml', '.ini', '.conf',
  '.vue', '.svelte', '.html', '.hbs', '.blade', '.ejs',
]);

// 收集所有发现，按严重级别分组
const findings = {
  [SEVERITY.CRITICAL]: [],
  [SEVERITY.HIGH]: [],
  [SEVERITY.MEDIUM]: [],
  [SEVERITY.LOW]: [],
};

for (const filePath of modifiedFiles) {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);

  // 文件级检查（不依赖扩展名）
  for (const rule of FILE_LEVEL_RULES) {
    const result = rule.check(filePath);
    if (result) {
      findings[rule.severity].push({
        file: filePath,
        line: 0,
        rule: rule.name,
        desc: rule.desc,
        snippet: result,
      });
    }
  }

  // 只扫描文本文件
  if (!textExtensions.has(ext) && !filePath.includes('.env')) {
    continue;
  }

  const fullPath = path.join(root, filePath);
  const content = readFile(fullPath);
  if (!content) continue;

  // 内容级规则扫描
  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      pattern.regex.lastIndex = 0;
      const matches = content.match(pattern.regex);
      if (!matches) continue;

      for (const match of matches) {
        const lineNum = getLineNumber(content, match);
        findings[rule.severity].push({
          file: filePath,
          line: lineNum,
          rule: rule.name,
          desc: pattern.desc,
          snippet: match.slice(0, 80),
        });
      }
    }
  }
}

// --- 输出结果（按严重级别分组） ---

const severityLabel = {
  [SEVERITY.CRITICAL]: 'CRITICAL',
  [SEVERITY.HIGH]: 'HIGH',
  [SEVERITY.MEDIUM]: 'MEDIUM',
  [SEVERITY.LOW]: 'LOW',
};

let totalFindings = 0;

for (const sev of SEVERITY_ORDER) {
  const items = findings[sev];
  if (items.length === 0) continue;

  totalFindings += items.length;
  warn('');
  warn(`--- ${severityLabel[sev]} (${items.length}) ---`);

  // 按文件分组输出
  const byFile = {};
  for (const f of items) {
    const key = f.file;
    if (!byFile[key]) byFile[key] = [];
    byFile[key].push(f);
  }

  for (const [file, fileFindings] of Object.entries(byFile)) {
    warn(`  ${file}:`);
    for (const f of fileFindings) {
      const lineRef = f.line > 0 ? `L${f.line}` : 'FILE';
      warn(`    ${lineRef} [${f.rule}] ${f.desc}`);
      warn(`      ${f.snippet}`);
    }
  }
}

if (totalFindings > 0) {
  warn('');
  const critical = findings[SEVERITY.CRITICAL].length;
  const high = findings[SEVERITY.HIGH].length;
  warn(`[Security] 共 ${totalFindings} 个发现: CRITICAL=${critical} HIGH=${high} MEDIUM=${findings[SEVERITY.MEDIUM].length} LOW=${findings[SEVERITY.LOW].length}`);
  if (critical > 0) {
    warn('[Security] 存在 CRITICAL 级别问题，请立即处理！');
  }
  warn('[Security] 仅警告，不阻断');
  warn('');
}

process.exit(0);
