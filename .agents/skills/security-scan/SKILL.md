---
name: security-scan
description: 独立安全扫描 — OWASP Top 10、密钥检测、依赖漏洞、权限配置审查
allowed-tools: Read, Grep, Glob, Bash
argument-hint: [可选：文件路径或目录]
---

# Security Scan

对指定路径或整个项目进行安全专项扫描，独立于代码质量审查。目标: `$ARGUMENTS`（未指定则扫描整个项目）。

## 何时使用

- 发布前独立安全体检
- 引入用户输入、第三方依赖、敏感数据后
- 用户明确要求"安全扫描"、"找漏洞"、"查密钥"

## 原则

- 此 skill 只做扫描报告，不自动修复
- CRITICAL 问题应立即用 `/taozi:code-review` 或 `/taozi:tdd` 处理
- 建议定期运行并加入 CI/CD

## 扫描步骤

### 1. 密钥与敏感数据检测

```bash
# 硬编码密钥
grep -rn --include='*.ts' --include='*.js' --include='*.py' --include='*.go' --include='*.java' \
  -E '(api_key|apikey|api-key|secret|password|token|passwd|private_key)\s*=\s*["\x27][^"\x27]{8,}' \
  --exclude-dir=node_modules --exclude-dir=.git .

# 常见密钥格式
grep -rn -E '(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36}|AKIA[0-9A-Z]{16})' \
  --exclude-dir=node_modules --exclude-dir=.git .

# .env 是否被跟踪
git ls-files | grep -E '\.env$|\.env\.'
```

### 2. 注入风险检测

```bash
# SQL 注入
grep -rn -E '(query|sql|execute)\s*[+\`].*\$\{' \
  --include='*.ts' --include='*.js' --include='*.py' .

# 命令注入
grep -rn -E '(exec|eval|execSync|system|popen)\s*\(' \
  --include='*.ts' --include='*.js' --include='*.py' --include='*.go' .

# XSS
grep -rn 'innerHTML\s*=' --include='*.ts' --include='*.tsx' --include='*.js' .
```

### 3. 依赖漏洞扫描

```bash
[ -f package.json ] && npm audit --json 2>/dev/null | head -50
[ -f requirements.txt ] && pip-audit -r requirements.txt 2>/dev/null
[ -f go.mod ] && govulncheck ./... 2>/dev/null
[ -f pom.xml ] && mvn dependency-check:check -q 2>/dev/null
```

### 4. 认证与授权检测

```bash
# JWT 弱算法
grep -rn -E '"alg"\s*:\s*"(none|HS256)"' --include='*.ts' --include='*.js' .

# 密码明文
grep -rn -E 'password\s*=\s*["\x27]' --include='*.ts' --include='*.js' --include='*.py' .

# Controller 层权限检查缺失
grep -rn '@Get\|@Post\|@Put\|@Delete' --include='*.ts' -l . | \
  xargs grep -L '@UseGuards\|@Public'
```

### 5. 配置安全

```bash
# CORS 过于宽松
grep -rn 'origin.*\*\|cors.*\*' --include='*.ts' --include='*.js' .

# 生产启用 debug
grep -rn 'DEBUG\s*=\s*true\|debug:\s*true' --include='*.ts' --include='*.js' .

# HTTPS 降级
grep -rn 'http://' --include='*.ts' --include='*.js' . | \
  grep -v 'localhost\|127.0.0.1\|comment\|//'
```

## 报告格式

```markdown
## 安全扫描报告

**扫描时间** / **扫描范围**

### CRITICAL（必须立即修复）

| # | 文件:行号 | 类别 | 描述 | OWASP |
|---|---------|------|------|-------|
| 1 | src/db.ts:42 | SQL注入 | 用户输入直接拼接 SQL | A03 |

### WARNING（应在发布前修复）
### INFO（建议改进）

### 依赖漏洞
- 高危 X 个 / 中危 X 个

### 总结
- [ ] 无硬编码密钥
- [ ] 无 SQL/命令注入风险
- [ ] 依赖无已知高危漏洞
- [ ] 认证授权配置正确
```
