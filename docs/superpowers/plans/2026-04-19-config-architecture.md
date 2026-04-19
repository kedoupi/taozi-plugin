# Taozi 配置体系重构 + Lark Skill 修正 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将配置体系统一为 3 层平铺结构（全局凭据 / 项目平台配置 / 品牌文件），修正 lark skill 的错误配置路径，新增飞书平台到 setup，wechat/xiaohongshu 软引导替代硬停。

**Architecture:** 全局 `~/.taozi/config.yaml` 存多账号凭据；平台格式偏好存 `~/.taozi/platforms/<平台>.yaml`（平铺文件）；项目绑定存 `.taozi/platforms/<平台>.yaml`；品牌文件 `.taozi/brand/` 优先于 `~/.taozi/brand/`。移除 wechat skill 的第 4 层 `wechat/style.yaml` 覆盖。

**Tech Stack:** Markdown skill files, node tests/run-all.js, node scripts/sync-codex.js

**设计文档：** `docs/superpowers/specs/2026-04-19-taozi-config-architecture-design.md`

---

## 受影响文件

| 文件 | 操作 |
|------|------|
| `skills/lark/SKILL.md` | 修改：配置路径从 `.lark.json` 改为 `.taozi/platforms/lark.yaml` |
| `skills/setup/SKILL.md` | 修改：新增飞书平台、config.yaml 多账号格式、路径平铺 |
| `skills/wechat/SKILL.md` | 修改：3 层合并、新路径、软引导 |
| `skills/xiaohongshu/SKILL.md` | 修改：新增项目层读取、软引导 |

---

## Task 1：修正 skills/lark/SKILL.md 配置路径

**Files:**
- Modify: `skills/lark/SKILL.md`

- [ ] **Step 1：替换 frontmatter allowed-tools**

将：
```
  - Bash(find . -maxdepth 5 -name .lark.json*)
  - Bash(cat .lark.json*)
```
改为：
```
  - Bash(find . -maxdepth 5 -name lark.yaml -path */.taozi/platforms/*)
  - Bash(cat .taozi/platforms/lark.yaml*)
```

- [ ] **Step 2：更新 description 字段**

将 `支持在项目目录下放 .lark.json 绑定默认知识库` 改为：
`支持在项目目录下放 .taozi/platforms/lark.yaml 绑定默认知识库`

- [ ] **Step 3：更新铁律逃逸借口表中的 .lark.json 引用**

将：
```
| "目录下有 .lark.json 就直接操作" | 仍需展示将要操作的目标，让用户确认 |
```
改为：
```
| "目录下有 .taozi/platforms/lark.yaml 就直接操作" | 仍需展示将要操作的目标，让用户确认 |
```

- [ ] **Step 4：替换"优先级 2"的查找命令和格式说明**

将查找命令从：
```bash
find . -maxdepth 5 -name ".lark.json" 2>/dev/null | head -1
```
改为：
```bash
find . -maxdepth 5 -name "lark.yaml" -path "*/.taozi/platforms/*" 2>/dev/null | head -1
```

读取命令从 `cat <找到的路径>` 改为：
```bash
cat .taozi/platforms/lark.yaml
```

配置格式从 JSON 改为 YAML：
```yaml
wiki_url: https://xxx.feishu.cn/wiki/SpaceXXX
description: 项目备注（可选）
```

- [ ] **Step 5：替换"优先级 3"的错误提示**

将 `.lark.json` 的格式示例改为：
```
.taozi/platforms/lark.yaml 格式：
  wiki_url: https://xxx.feishu.cn/wiki/SpaceXXX
  description: 项目名称
```

- [ ] **Step 6：替换"配置文件管理"的写入命令**

将"初始化项目绑定"中的写入步骤改为：
```bash
mkdir -p .taozi/platforms
# 写入 .taozi/platforms/lark.yaml
```
格式改为 YAML，移除 gitignore 提示（YAML 不含凭据，可提交 git）。

- [ ] **Step 7：运行测试**

```bash
node tests/run-all.js 2>&1 | grep "Skill lark"
```

期望：5 项全部 ✓

- [ ] **Step 8：提交**

```bash
git add skills/lark/SKILL.md
git commit -m "fix(lark): 配置路径从 .lark.json 改为 .taozi/platforms/lark.yaml"
```

---

## Task 2：更新 skills/setup/SKILL.md

**Files:**
- Modify: `skills/setup/SKILL.md`

- [ ] **Step 1：更新 description 字段**

改为：
```
Taozi 配置向导：交互式引导创建 ~/.taozi/ 全局配置（YouMind key、品牌人设、平台凭据），支持微信/飞书等多平台，一次配置所有内容 skill 共享。新设备或新账号配置时使用。
```

- [ ] **Step 2：更新第一步检查脚本的路径**

将 Python 脚本 files 字典中的：
```python
'platforms/wechat/style.yaml': os.path.join(TAOZI, 'platforms', 'wechat', 'style.yaml'),
```
改为：
```python
'platforms/wechat.yaml': os.path.join(TAOZI, 'platforms', 'wechat.yaml'),
```

- [ ] **Step 3：升级第二步 config.yaml 写入格式为多账号结构**

将写入内容改为（用户填写 YouMind key 时只更新 youmind 字段，wechat 字段在第五步填入）：
```yaml
# Taozi 共享凭据 — 由 /taozi:setup 自动生成

youmind:
  api_key: <API_KEY>

# 微信账号（支持多账号，在 .taozi/platforms/wechat.yaml 中用 account: <名称> 引用）
# wechat:
#   accounts:
#     default:
#       appid: $WECHAT_APPID
#       secret: $WECHAT_APPSECRET
#       author: "作者名"
#   proxy: $WECHAT_PROXY
```

- [ ] **Step 4：第四步新增飞书平台选项**

平台选项列表改为：
```
1. 微信公众号
2. 小红书（无需凭据）
3. 飞书知识库（无需在此配置，使用 lark-cli auth login 认证）
4. 抖音（无需凭据）
```

选择飞书时说明：
```
飞书使用 lark-cli 统一认证，无需存储 token。
请确保已运行：lark-cli auth login
项目绑定知识库：在项目目录创建 .taozi/platforms/lark.yaml 即可。
```

- [ ] **Step 5：更新第五步微信配置路径**

mkdir 命令改为：
```bash
mkdir -p "$HOME/.taozi/platforms"
```

凭据写入 `~/.taozi/config.yaml`（更新 wechat.accounts.default 字段）：
```yaml
wechat:
  accounts:
    default:
      appid: <APPID>
      secret: <APPSECRET>
      author: "<AUTHOR>"
  proxy: <PROXY>
```

格式偏好单独写入 `~/.taozi/platforms/wechat.yaml`：
```yaml
format:
  length: "1200-2500"
  digest_limit: 54
  cover_ratio: "16:9"
  theme: "newspaper"
```

- [ ] **Step 6：更新第六步完成报告路径**

路径列表改为：
```
  ~/.taozi/config.yaml               ← YouMind API Key + 微信账号凭据
  ~/.taozi/brand/voice.md            ← 品牌人设
  ~/.taozi/brand/playbook.md         ← 通用写作规范
  ~/.taozi/brand/character.md        ← 封面角色（可选）
  ~/.taozi/platforms/wechat.yaml     ← 微信格式偏好
```

可选操作提示改为：
```
  📎 在任意项目建 .taozi/platforms/wechat.yaml 可覆盖微信账号和格式
  📎 在任意项目建 .taozi/platforms/lark.yaml 可绑定飞书知识库
  📎 在任意项目建 .taozi/brand/voice.md 可覆盖全局人设
```

- [ ] **Step 7：运行测试**

```bash
node tests/run-all.js 2>&1 | grep "Skill setup"
```

期望：5 项全部 ✓

- [ ] **Step 8：提交**

```bash
git add skills/setup/SKILL.md
git commit -m "feat(setup): 新增飞书平台入口，config.yaml 多账号结构，路径改平铺"
```

---

## Task 3：更新 skills/wechat/SKILL.md

**Files:**
- Modify: `skills/wechat/SKILL.md`

- [ ] **Step 1：更新 frontmatter allowed-tools**

将：
```
  - Bash([ -f "$HOME/.taozi/platforms/wechat/style.yaml" ]*)
```
改为：
```
  - Bash([ -f "$HOME/.taozi/platforms/wechat.yaml" ]*)
  - Bash([ -f ".taozi/platforms/wechat.yaml" ]*)
```

- [ ] **Step 2：阶段 1 检查路径更新 + 硬停改软引导**

检查命令改为：
```bash
[ -f "$HOME/.taozi/platforms/wechat.yaml" ] && echo "wechat_cfg_exists" || echo "wechat_cfg_missing"
```

`wechat_cfg_missing` 的处理从硬停改为软引导：
```
**`~/.taozi/platforms/wechat.yaml` 不存在** → 软引导：

⚠️ 未检测到微信配置，是否现在完成初始化？（需填写 AppID / AppSecret / 作者名）[初始化/跳过]

- 初始化：引导填写，写入 ~/.taozi/config.yaml 的 wechat.accounts.default 和 ~/.taozi/platforms/wechat.yaml，然后继续。
- 跳过：继续执行，凭据从环境变量读取（$WECHAT_APPID / $WECHAT_APPSECRET）。
```

- [ ] **Step 3：阶段 3 配置合并改为 3 层**

将四级合并：
```python
cfg = deep_merge(cfg, load_yaml(os.path.join(TAOZI, 'config.yaml')))
cfg = deep_merge(cfg, load_yaml(os.path.join(TAOZI, 'platforms', 'wechat', 'style.yaml')))
cfg = deep_merge(cfg, load_yaml('.taozi/platforms/wechat/style.yaml'))
cfg = deep_merge(cfg, load_yaml('wechat/style.yaml'))
```
改为三层：
```python
cfg = deep_merge(cfg, load_yaml(os.path.join(TAOZI, 'config.yaml')))
cfg = deep_merge(cfg, load_yaml(os.path.join(TAOZI, 'platforms', 'wechat.yaml')))
cfg = deep_merge(cfg, load_yaml('.taozi/platforms/wechat.yaml'))
```

凭据提取逻辑支持新的 accounts 结构（同时兼容旧格式）：
```python
wechat   = cfg.get('wechat', {}) or {}
accounts = wechat.get('accounts', {}) or {}
account_name = cfg.get('account', 'default')
account  = accounts.get(account_name, {}) or wechat  # 兼容旧格式
youmind  = cfg.get('youmind', {}) or {}
fmt      = cfg.get('format', {}) or {}

appid  = expand(account.get('appid',  '$WECHAT_APPID'))
secret = expand(account.get('secret', '$WECHAT_APPSECRET'))
apikey = expand(youmind.get('api_key', '$YOUMIND_API_KEY'))
proxy  = expand(wechat.get('proxy', cfg.get('proxy', '')))
theme  = fmt.get('theme', cfg.get('theme', 'newspaper')) or 'newspaper'
```

- [ ] **Step 4：子 Agent C 步骤 0 更新 read_platform 路径**

将 `read_platform` 函数改为直接读 `~/.taozi/platforms/wechat.yaml`：
```python
def read_platform_yaml():
    path = os.path.join(HOME, '.taozi', 'platforms', 'wechat.yaml')
    try:
        with open(path) as f:
            return f.read()
    except:
        return ''

style = read_platform_yaml()
```

- [ ] **Step 5：错误处理表更新 proxy 路径说明**

将 IP 白名单错误的处理中：
```
在 `~/.taozi/platforms/wechat/style.yaml` 的 proxy 字段
```
改为：
```
在 `~/.taozi/config.yaml` 的 wechat.proxy 字段
```

- [ ] **Step 6：运行测试**

```bash
node tests/run-all.js 2>&1 | grep "Skill wechat"
```

期望：5 项全部 ✓

- [ ] **Step 7：提交**

```bash
git add skills/wechat/SKILL.md
git commit -m "refactor(wechat): 配置合并改 3 层，路径平铺，硬停改软引导"
```

---

## Task 4：更新 skills/xiaohongshu/SKILL.md

**Files:**
- Modify: `skills/xiaohongshu/SKILL.md`

- [ ] **Step 1：更新 allowed-tools**

新增一行：
```yaml
  - Bash([ -f ".taozi/platforms/xiaohongshu.yaml" ]*)
```

- [ ] **Step 2：更新第一步 — 硬停改软引导并新增项目配置读取**

在现有 `~/.taozi/` 检查之后，新增项目配置检查：
```bash
[ -f ".taozi/platforms/xiaohongshu.yaml" ] && echo "xhs_cfg_exists" || echo "xhs_cfg_missing"
```

`xhs_cfg_missing` 时软提示（不阻断，继续执行）：
```
⚠️ 未检测到小红书项目配置，将使用全局默认值。
如需自定义：创建 .taozi/platforms/xiaohongshu.yaml
  format:
    image_count: 6
    ratio: "1:1"
    strategy: auto
```

- [ ] **Step 3：运行测试**

```bash
node tests/run-all.js 2>&1 | grep "Skill xiaohongshu"
```

期望：5 项全部 ✓

- [ ] **Step 4：提交**

```bash
git add skills/xiaohongshu/SKILL.md
git commit -m "refactor(xiaohongshu): 新增项目配置层读取，硬停改软引导"
```

---

## Task 5：同步 Codex + 全量测试

- [ ] **Step 1：同步 Codex 适配层**

```bash
node scripts/sync-codex.js
```

期望：`Synced 23 agents and 65 skills for Codex.`

- [ ] **Step 2：全量测试**

```bash
node tests/run-all.js 2>&1 | tail -3
```

失败项只应包含已知的 4 条 wechat-key-check，不能有新增失败。

- [ ] **Step 3：提交同步产物**

```bash
git add .agents/ .codex/
git commit -m "chore: sync codex after config architecture refactor"
```

---

## 验收标准

1. `skills/lark/SKILL.md` 中不再出现 `.lark.json`
2. `skills/wechat/SKILL.md` 中不再出现 `wechat/style.yaml`（四层合并已移除）
3. 所有 skill 中旧子目录路径 `platforms/wechat/style.yaml` 均替换为 `platforms/wechat.yaml`
4. wechat/xiaohongshu 配置缺失时输出软引导提示而非直接停止
5. setup SKILL.md 包含飞书平台选项和多账号 config.yaml 格式
6. `node tests/run-all.js` 失败项仅为预存的 4 条 wechat-key-check
