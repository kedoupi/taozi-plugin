# 安全规范

> 安全是底线，不是选项。

## 输入验证

永远不信任用户输入，在入口处验证。

```javascript
// 推荐：在边界验证
function createUser(input) {
  const { name, email, age } = validateInput(input, {
    name: { type: 'string', minLength: 1, maxLength: 100 },
    email: { type: 'string', pattern: EMAIL_REGEX },
    age: { type: 'number', min: 0, max: 150 },
  });
  // 后续代码使用已验证的安全数据
}

// 避免：直接使用原始输入
app.post('/users', (req, res) => {
  db.query(`SELECT * FROM users WHERE name = '${req.body.name}'`);
});
```

## SQL 注入防护

```javascript
// 推荐：参数化查询
db.query('SELECT * FROM users WHERE id = ?', [userId]);

// 避免：字符串拼接
db.query(`SELECT * FROM users WHERE id = '${userId}'`);
```

## XSS 防护

- 所有输出到 HTML 的数据必须转义
- 使用框架自带的转义机制（React JSX 默认转义）
- 避免使用 `v-html`、`dangerouslySetInnerHTML` 等原始 HTML 注入
- Content-Security-Policy 头必设

## 密钥管理

```javascript
// 推荐：环境变量 + 密钥管理服务
const dbPassword = process.env.DB_PASSWORD;
const apiKey = process.env.API_KEY;

// 避免：硬编码
const dbPassword = 'p@ssw0rd123';
const apiKey = 'sk-abc123...';
```

禁止项：
- 禁止在代码中硬编码密钥、密码、token
- 禁止将 `.env` 文件提交到 Git
- 禁止在日志中打印敏感信息
- 禁止在 URL 参数中传递敏感数据

## 认证授权

- JWT：短过期时间（15-30 分钟）+ Refresh Token
- 密码：使用 bcrypt/scrypt 哈希，永远不要明文存储
- API 认证：每个请求验证 token，不依赖客户端状态
- 权限检查：服务端校验，不信任前端隐藏/禁用

## OWASP Top 10 检查清单

| # | 风险 | 检查点 |
|---|------|--------|
| 1 | 权限控制失效 | 每个 API 端点都校验权限 |
| 2 | 加密失败 | HTTPS、敏感数据加密存储 |
| 3 | 注入 | 参数化查询、输入验证、输出转义 |
| 4 | 不安全设计 | 威胁建模、最小权限原则 |
| 5 | 安全配置错误 | 关闭调试模式、移除默认账户 |
| 6 | 过期组件 | 定期更新依赖、关注 CVE |
| 7 | 身份认证失败 | MFA、强密码策略、限流 |
| 8 | 数据完整性失败 | 校验数据来源、签名验证 |
| 9 | 日志监控不足 | 记录安全事件、异常告警 |
| 10 | SSRF | 校验 URL 白名单、禁止内网访问 |

## 依赖安全

- 定期运行 `npm audit` / `yarn audit`
- 新增依赖前检查维护状态和已知漏洞
- 锁定依赖版本（`package-lock.json`）
- 最小化依赖数量

## Taozi 安全扫描模式参考

以下是 Taozi 安全扫描器（`scripts/hooks/security-scan.js`）自动检测的所有模式，供开发者对照参考。

### CRITICAL 级别（必须立即处理）

| 检测项 | 模式 | 说明 |
|--------|------|------|
| AWS Access Key | `AKIA[A-Z0-9]{16}` | AWS 访问密钥泄露 |
| GitHub Token | `ghp_`/`gho_`/`ghu_` + 36位 | GitHub 个人/OAuth/User-to-Server 令牌 |
| OpenAI API Key | `sk-` + 20位以上 | OpenAI API 密钥 |
| Anthropic API Key | `sk-ant-` + 20位以上 | Anthropic API 密钥 |
| Private Key | `-----BEGIN ... PRIVATE KEY-----` | RSA/EC/DSA 私钥内容 |
| 硬编码密码 | `password = '...'` | 代码中的明文密码 |
| JWT 硬编码密钥 | `jwt.sign(..., 'secret')` | JWT 签名使用硬编码密钥 |
| MongoDB 凭据 | `mongodb://user:pass@` | 数据库连接串含明文凭据 |
| PostgreSQL 凭据 | `postgres://user:pass@` | 数据库连接串含明文凭据 |
| .env 文件提交 | 文件名匹配 `.env` | 环境变量文件不应进入版本控制 |

### HIGH 级别（应尽快修复）

| 检测项 | 模式 | 说明 |
|--------|------|------|
| 硬编码 API Key | `api_key = '...'` | 通用 API 密钥硬编码 |
| SQL 注入 | SQL + 字符串拼接用户输入 | `SELECT ... + req.body` 或模板字符串 |
| NoSQL 注入 | `$where`、`$regex` + 用户输入 | MongoDB 不安全操作符 |
| 命令注入 | `exec()`/`spawn()` + 拼接 | 子进程调用拼接用户输入 |
| LDAP 注入 | LDAP 查询 + 拼接 | LDAP 过滤器注入 |
| innerHTML 滥用 | `.innerHTML =` 非常量 | DOM XSS 风险 |
| dangerouslySetInnerHTML | React 原始 HTML | React XSS 风险 |
| v-html 非常量 | Vue 原始 HTML 绑定 | Vue XSS 风险 |
| document.write | `document.write()` | 文档直接写入 |
| Handlebars 未转义 | `{{{` 三重花括号 | 模板未转义输出 |
| Blade 未转义 | `{!!` 语法 | Laravel Blade 未转义输出 |
| Cookie secure=false | `secure: false` | Cookie 未强制 HTTPS |
| Cookie httpOnly=false | `httpOnly: false` | Cookie 可被 JS 读取 |
| CORS 通配符+凭据 | `Allow-Origin: *` + credentials | 跨域策略过宽 |

### MEDIUM 级别（建议修复）

| 检测项 | 模式 | 说明 |
|--------|------|------|
| 敏感 console.log | `console.log` + 敏感字段名 | 控制台输出密码/token 等 |
| 敏感 logger 调用 | `logger.info` + 敏感字段名 | 日志记录敏感信息 |
| 堆栈跟踪泄露 | `res.send(err.stack)` | 生产环境返回堆栈信息 |
| 详细错误泄露 | `res.send(err.message)` | 生产环境返回内部错误详情 |

### LOW 级别（关注即可）

| 检测项 | 模式 | 说明 |
|--------|------|------|
| 调试模式开启 | `DEBUG=true` | 生产环境不应开启调试 |
| 开发环境变量 | `NODE_ENV=development` | 部署代码中的开发环境标识 |

扫描器在每次会话结束时自动运行，仅输出警告不阻断操作。扫描范围限于 `git diff HEAD` 中的文本文件。
