---
name: security-patterns
description: OWASP Top 10 (2021) 安全漏洞模式库（中文）— 漏洞描述、攻击示例、防御模式、检测技巧。
---

# OWASP Top 10 安全漏洞模式库

基于 OWASP Top 10 (2021) 的漏洞识别与防护参考。

## A01:2021 — 权限控制失效 (Broken Access Control)

**描述**: 用户越权访问未授权资源，绕过权限检查直接操作数据。

**攻击向量**: 修改 URL 参数 `user_id=123` 为其他用户 ID，或直接调用管理 API。

```javascript
// 错误: 未校验资源所有权
app.delete('/posts/:id', (req, res) => {
  db.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
});

// 正确: 校验当前用户是否为资源所有者
app.delete('/posts/:id', auth, (req, res) => {
  const post = db.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
  if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
});
```

**检测技巧**: 搜索无 `auth` 中间件的路由；搜索直接使用 `req.params.id` 删除/更新的操作。

## A02:2021 — 加密失败 (Cryptographic Failures)

**描述**: 敏感数据明文传输或存储，使用弱算法，缺少 TLS。

**攻击向量**: 中间人截获 HTTP 明文通信，或数据库泄露后密码直接可用。

```javascript
// 错误: 明文存储密码
const user = { email, password: req.body.password };

// 正确: bcrypt 哈希 + HTTPS 强制
const hash = await bcrypt.hash(req.body.password, 12);
const user = { email, password_hash: hash };
```

**检测技巧**: 搜索 `md5`、`sha1`、明文密码赋值；检查是否有 HTTP 非 HTTPS 的数据库连接串。

## A03:2021 — 注入 (Injection)

**描述**: 用户输入被当作代码或命令执行，涵盖 SQL/NoSQL/命令/LDAP 注入。

**攻击向量**: 输入 `' OR 1=1 --` 绕过认证；输入 `; rm -rf /` 执行系统命令。

```javascript
// SQL 注入防御: 参数化查询
db.query('SELECT * FROM users WHERE id = ?', [userId]);

// 命令注入防御: 不拼接，用参数数组
execFile('grep', [pattern, filePath]);

// NoSQL 注入防御: 禁止 $where，强制类型转换
const age = parseInt(req.body.age, 10);
db.collection('users').find({ age });
```

**检测技巧**: 搜索 SQL + 字符串拼接（`+` 或模板字符串）；搜索 `exec(` `spawn(` + 拼接模式。

## A04:2021 — 不安全设计 (Insecure Design)

**描述**: 架构层面缺少安全控制，如无速率限制、无威胁建模。

**攻击向量**: 暴力破解登录接口（无速率限制）；批量枚举用户 ID。

```javascript
// 正确: 速率限制 + 安全设计
const rateLimit = require('express-rate-limit');
app.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), loginHandler);
app.post('/reset-password', rateLimit({ windowMs: 60 * 60 * 1000, max: 3 }), resetHandler);
```

**检测技巧**: 检查认证相关路由是否有限流中间件；确认是否有输入长度限制。

## A05:2021 — 安全配置错误 (Security Misconfiguration)

**描述**: 默认配置未修改、调试模式开启、不必要的功能暴露、CORS 过宽。

**攻击向量**: 利用调试端点获取环境信息；利用 CORS 通配符窃取数据。

```javascript
// 错误: 过宽 CORS + 调试信息
app.use(cors({ origin: '*', credentials: true }));
app.use((err, req, res, next) => res.json({ error: err.stack }));

// 正确: 白名单 CORS + 生产错误处理
app.use(cors({ origin: ['https://app.example.com'], credentials: true }));
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
```

**检测技巧**: 搜索 `DEBUG=true`、`NODE_ENV=development`、`origin: '*'`、`secure: false`。

## A06:2021 — 易受攻击和过时的组件 (Vulnerable Components)

**描述**: 使用含已知漏洞的依赖库，未及时更新。

**攻击向量**: 利用 `lodash < 4.17.21` 的原型污染；利用旧版 `jsonwebtoken` 的算法混淆。

```bash
# 定期执行
npm audit
npm outdated
npx npm-check-updates -u
```

**检测技巧**: 检查 `package-lock.json` 中是否有已知漏洞版本；运行 `npm audit`。

## A07:2021 — 身份认证失败 (Identification and Authentication Failures)

**描述**: 弱密码策略、JWT 配置不当、会话管理缺陷。

**攻击向量**: 暴力破解弱密码；篡改 JWT 的 `alg: none`；会话固定攻击。

```javascript
// JWT 最佳实践
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '15m', algorithm: 'HS256' }  // 明确算法，不用 none
);

// 密码策略: 8位+ 大小写+数字+特殊字符
// 登录后重新生成 session ID
// 支持 MFA (TOTP / SMS)
```

**检测技巧**: 搜索硬编码 JWT 密钥、`algorithm: 'none'`、无过期时间的 token。

## A08:2021 — 软件和数据完整性失败 (Software and Data Integrity Failures)

**描述**: 未验证软件来源、CI/CD 管道不安全、反序列化不可信数据。

**攻击向量**: 篡改 npm 包；恶意 CI 脚本注入；反序列化攻击。

```javascript
// 错误: 反序列化不可信数据
const data = eval('(' + req.body.data + ')');

// 正确: 使用安全解析 + 签名验证
const data = JSON.parse(req.body.data);
// CI/CD: 锁定依赖哈希，使用 npm ci 而非 npm install
```

**检测技巧**: 搜索 `eval(`、`new Function(`、`deserialize`、未验证的 CDN 脚本引用。

## A09:2021 — 安全日志和监控失败 (Security Logging Failures)

**描述**: 未记录安全事件、日志含敏感信息、无告警机制。

**攻击向量**: 攻击者清除痕迹；大量失败登录未被检测。

```javascript
// 正确: 安全事件日志（脱敏）
function logAuthEvent(event) {
  logger.info({
    type: event.type,        // 'login_success' | 'login_failure' | 'password_change'
    userId: event.userId,
    ip: event.ip,
    timestamp: new Date().toISOString(),
    // 不记录 password、token 等敏感值
  });
}
// 配合告警: 同一 IP 5 分钟内 >10 次失败登录 → 触发告警
```

**检测技巧**: 搜索 `console.log` + 敏感字段名；确认认证路由是否有日志记录。

## A10:2021 — 服务端请求伪造 (SSRF)

**描述**: 服务端发起请求时未校验目标地址，攻击者借此访问内网资源。

**攻击向量**: 传入 `url=http://169.254.169.254/latest/meta-data/` 获取云服务器元数据。

```javascript
// 错误: 直接请求用户提供的 URL
app.post('/fetch', (req, res) => {
  fetch(req.body.url).then(r => r.text()).then(t => res.send(t));
});

// 正确: URL 白名单 + 禁止内网地址
function isSafeUrl(urlStr) {
  const parsed = new URL(urlStr);
  const allowed = ['api.example.com', 'cdn.example.com'];
  if (!allowed.includes(parsed.hostname)) throw new Error('Blocked');
  if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.|169\.254\.)/.test(parsed.hostname)) {
    throw new Error('Internal address blocked');
  }
  return true;
}
```

**检测技巧**: 搜索 `fetch(req`、`axios(req`、`request(req` 等直接使用用户输入作为 URL 的模式。
