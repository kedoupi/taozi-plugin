---
name: wechat
description: 微信公众号文章全链路：热点选题 → YouMind 研究 → AI 写作 → 封面图生成 → 推送草稿箱。依赖 ~/.taozi/ 全局配置（运行 /taozi:setup 初始化），草稿和历史记录存于项目 ./wechat/ 目录。
triggers: "公众号文章,微信推文,发草稿箱,公众号写作,写公众号,微信公众号,WeChat article,publish to WeChat"
allowed-tools:
  - Bash([ -d "$HOME/.taozi" ]*)
  - Bash([ -f "$HOME/.taozi/platforms/wechat/style.yaml" ]*)
  - Bash([ -d "wechat" ]*)
  - Bash([ -f "wechat/history.yaml" ]*)
  - Bash(mkdir -p *)
  - Bash(python3 *)
---

# 微信公众号文章全链路

主 agent 只负责三件事：**环境检查 → 意图路由 → 派 Agent**。
所有 API 调用在子 Agent 内完成。

---

## 第一步：初始化 + 配置检查

分三个阶段依次执行。

---

### 阶段 1：检查 ~/.taozi/ 全局配置

```bash
[ -d "$HOME/.taozi" ] && echo "taozi_exists" || echo "taozi_missing"
[ -f "$HOME/.taozi/platforms/wechat/style.yaml" ] && echo "wechat_cfg_exists" || echo "wechat_cfg_missing"
```

**`~/.taozi/` 不存在** 或 **`~/.taozi/platforms/wechat/style.yaml` 不存在** → 停止执行，提示用户：

```
❌ 尚未完成 Taozi 全局配置。

请运行 /taozi:setup 完成初始化（约 2 分钟交互向导），配置完成后再回来。
```

**两个目录均存在** → 继续阶段 2。

---

### 阶段 2：检查并创建项目内容目录

```bash
[ -d "wechat" ] && echo "project_exists" || echo "project_missing"
```

**项目内容目录不存在** → 自动创建（无需用户干预）：

```bash
mkdir -p wechat/drafts
```

**`wechat/history.yaml` 内容**（写入）：

```yaml
# 发布历史 — 由 /taozi:wechat-article 自动维护
# 每次发布后自动追加一条记录
articles: []
```

告知用户：

```
✅ 已创建项目内容目录 ./wechat/（草稿和历史记录存于此）
```

**项目内容目录已存在** → 继续阶段 3。

---

### 阶段 3：读取配置 + 品牌文件

用以下 python3 脚本读取配置（四级合并）和品牌文件：

```bash
python3 -c "
import os, sys

HOME = os.path.expanduser('~')
TAOZI = os.path.join(HOME, '.taozi')

def expand(val):
    if isinstance(val, str) and val.startswith('\$'):
        return os.environ.get(val[1:], '') or ''
    return val or ''

def load_yaml(path):
    if not os.path.exists(path):
        return {}
    try:
        import yaml
        with open(path) as f:
            return yaml.safe_load(f) or {}
    except Exception:
        return {}

def deep_merge(base, override):
    result = dict(base)
    for key, val in override.items():
        if isinstance(val, dict) and isinstance(result.get(key), dict):
            result[key] = {**result.get(key, {}), **val}
        else:
            result[key] = val
    return result

cfg = {}
cfg = deep_merge(cfg, load_yaml(os.path.join(TAOZI, 'config.yaml')))
cfg = deep_merge(cfg, load_yaml(os.path.join(TAOZI, 'platforms', 'wechat', 'style.yaml')))
cfg = deep_merge(cfg, load_yaml('.taozi/platforms/wechat/style.yaml'))
cfg = deep_merge(cfg, load_yaml('wechat/style.yaml'))

wechat  = cfg.get('wechat', {}) or {}
youmind = cfg.get('youmind', {}) or {}
fmt     = cfg.get('format', {}) or {}

appid  = expand(wechat.get('appid',  '\$WECHAT_APPID'))
secret = expand(wechat.get('secret', '\$WECHAT_APPSECRET'))
apikey = expand(youmind.get('api_key', '\$YOUMIND_API_KEY'))
theme  = fmt.get('theme', cfg.get('theme', 'simple')) or 'simple'

missing = []
if not appid:  missing.append('wechat.appid')
if not secret: missing.append('wechat.secret')
if not apikey: missing.append('youmind.api_key')

if missing:
    print('MISSING:' + ','.join(missing))
else:
    print('OK')
    print('APPID:' + appid)
    print('APIKEY:' + apikey[:8] + '...')
    print('THEME:' + theme)
"
```

如果输出含 `MISSING:`，提示用户运行 `/taozi:setup` 补填对应字段，停止执行。

同时读取品牌文件（优先 `./.taozi/brand/`，其次 `~/.taozi/brand/`）：

```bash
python3 -c "
import os
HOME = os.path.expanduser('~')

def read_brand(filename):
    for base in ('.taozi/brand', os.path.join(HOME, '.taozi', 'brand')):
        path = os.path.join(base, filename)
        if os.path.exists(path):
            with open(path) as f:
                return f.read()
    return ''

voice    = read_brand('voice.md')
playbook = read_brand('playbook.md')
print('VOICE_FOUND:' + ('yes' if voice else 'no'))
print('PLAYBOOK_FOUND:' + ('yes' if playbook else 'no'))
"
```

将 `voice.md` 和 `playbook.md` 内容作为上下文，传递给后续子 Agent。

---

## 第二步：意图路由

根据用户输入判断进入哪条路径，并同时提取主题和排版主题：

| 用户输入 | 路径 |
|---------|------|
| 提供了明确主题（如"写一篇关于 AI Agent 的文章"）| 跳过热点，从 YouMind 研究开始（步骤 3B）|
| 提供了完整 Markdown 内容 | 直接发布（跳到步骤 3C）|
| 什么都没给，或只说"写公众号文章" | 全流程：热点 → 选题 → 研究 → 写作 → 发布（步骤 3A）|

**同时提取排版主题**：若用户输入含 "用 X 主题"、"X 风格排版" 等字样，提取主题名作为本次 `THEME`；否则使用 style.yaml 的 `theme` 字段（默认 `simple`）。

可用主题（wewrite 提供，引入后生效）：`simple`（通用简洁）、`sspai`（少数派）、`tech`（科技深色）、`minimal`（极简）、`green`（清新绿）、`elegant`（典雅）等共 16 个。

---

## 第三步：派子 Agent 执行

### 路径 3A：全流程（无主题）

告知用户：
> 开始全流程，包含选题 → 研究 → 写作 → 配图 → 发布，约 5-10 分钟，期间可继续其他工作。

依次派以下子 Agent：

**子 Agent A — 热点研究 + 选题**

```
你是热点选题 agent，任务是找到适合该公众号发布的热点话题。

## 品牌信息（来自 ~/.taozi/brand/voice.md）
<voice.md 内容，含行业/目标读者/内容方向/禁用词>

## 执行步骤

### 步骤 1：安装 YouMind CLI（如未安装）
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

### 步骤 2：搜索近 48 小时热点
从 voice.md 提取行业关键词，拼接搜索词：
youmind call webSearch '{"query":"<行业> 最新动态 热点","timeRange":"48h","limit":10}'

### 步骤 3：筛选 + 生成选题
根据搜索结果，结合品牌信息中的定位和目标读者，生成 3 个候选标题，格式：
TOPICS_DONE
1. <标题1> | <一句话说明选题理由>
2. <标题2> | <一句话说明选题理由>
3. <标题3> | <一句话说明选题理由>
RECOMMENDED: 1
```

收到选题后，**询问用户选择哪个**（或提供自己的主题），等待确认后再派写作 Agent。

**子 Agent B — YouMind 深度研究 + 写作**

```
你是文章写作 agent，任务是完成从研究到成稿的全过程。

## 参数
- 主题：<确认的标题或主题>
- 排版主题：<THEME>
- 品牌文件（已读取）：
  - voice.md 内容：<voice.md 内容，含账号名称/行业/目标读者/语气/人设/禁用词>
  - playbook.md 内容：<playbook.md 内容>

## 执行步骤

### 步骤 1：YouMind 深度研究
youmind call webSearch '{"query":"<主题>","limit":15}'
提炼：核心观点 3-5 条、数据/案例 2-3 个、争议点 1-2 个

### 步骤 2：撰写文章（Markdown）

**写作前必须参考以下规范**：
- 参数中的 `playbook.md` 内容：标题规范、段落节奏、HKR 质检框架、风格禁忌
- `references/writing-guide.md`（若存在）：de-AI 四级协议、So What 三层法、原子洞察强制框架
  读取路径：`skills/wechat-article/references/writing-guide.md`
- 参数中的 `voice.md` 内容：用于确定写作语气、人设、禁用词、目标读者

遵循规范撰写，输出：
- 标题（20-28 字）
- 摘要（54 字以内）
- 正文（1200-2500 字，微信公众号适合长度）
- 封面图生成 prompt（英文，16:9，无人脸）：
  1. 读取 `~/.taozi/brand/character.md`（优先 `./.taozi/brand/character.md`），找到 `## 封面图用法（16:9）` 下方代码块，提取其完整内容作为封面 prompt 基础
  2. 在此基础上追加本文主题相关的场景描述（10 词以内）
  3. 若 character.md 不存在或「我的角色」为空，则纯粹按文章主题和风格自由生成封面 prompt

**写完后执行 L1-L4 四层终检（playbook.md 有详细说明）**：
- L1 禁词扫描：检查 style.yaml `blacklist.words` 中的禁用词，有则替换
- L2 节奏检查：是否有连续 3 段以上"首先…其次…最后"或 AI 排比句，有则打散
- L3 活人感终审：通读一遍，像机器生成的句子改掉
- L4 信息诚信：无来源的数字/案例标 "暂缺数据" 或删除，不编造

### 步骤 3：提取视觉锚点 + 生成章节配图 prompt

从封面图 prompt 中提取 3 个风格关键词作为**视觉锚点**（如 `manga / cream beige / Q-style`），
所有章节配图必须包含这些锚点，确保风格统一。

读取角色文件（优先 `./.taozi/brand/character.md`，其次 `~/.taozi/brand/character.md`），
提取"章节配图用法（16:9）"模板。

为文章每个 H2 章节（最多 4 个）生成一条配图 prompt，格式：

```
SECTION_IMAGE_PROMPT_1: <章节标题> | <完整英文 prompt，含视觉锚点 + 角色模板 + 章节场景描述>
SECTION_IMAGE_PROMPT_2: ...
```

配图 prompt 构建规则：

1. **读取 character.md**（优先 `./.taozi/brand/character.md`，其次 `~/.taozi/brand/character.md`）
2. 找到 `## 章节配图用法（16:9）` 下方的代码块，提取其完整内容作为**角色模板**
3. 若找不到该章节、或"我的角色"部分为空注释（只有 `<!-- ... -->`），则**无角色模板**

最终 prompt 结构：
```
WeChat article section illustration, 16:9 landscape.
Scene: <用 10 词描述该章节核心场景>.
<角色模板内容（从 character.md 提取，原样保留）>
Visual anchors: <锚点1, 锚点2, 锚点3>. No text overlay. Not realistic.
```

无角色模板时省略角色行，视觉锚点仍保留：
```
WeChat article section illustration, 16:9 landscape.
Scene: <用 10 词描述该章节核心场景>.
Visual anchors: <锚点1, 锚点2, 锚点3>. No text overlay. Not realistic.
```

### 步骤 4：插入章节配图占位符 + 保存草稿

在草稿 Markdown 中，将每个 H2 章节标题（最多 4 个）的**第一个段落后**插入对应占位符：

```
## 第一章标题

第一段正文...

![](section-1.jpg)

## 第二章标题
...
```

占位符规则：`section-1.jpg`、`section-2.jpg`…按 H2 出现顺序从 1 开始编号；超过 4 个 H2 章节时只给前 4 个插入占位符。

将处理后的完整 Markdown 写入 `wechat/drafts/<YYYYMMDD>-<slug>.md`。

### 步骤 5：返回结果
DRAFT_DONE
title: <标题>
digest: <摘要>
draft_path: wechat/drafts/<文件名>
cover_prompt: <封面图 prompt>
visual_anchors: <锚点1,锚点2,锚点3>
section_count: <章节数，最多4>
SECTION_IMAGE_PROMPT_1: <章节标题> | <prompt>
SECTION_IMAGE_PROMPT_2: ...（有几个写几个）
```

**子 Agent C — 封面图 + 章节配图 + 微信发布**

```
你是发布 agent，负责生成封面图、章节配图，并推送到微信草稿箱。

## 参数
- draft_path: <草稿文件路径>
- title: <标题>
- digest: <摘要>
- cover_prompt: <封面图 prompt>
- section_prompts: [<SECTION_IMAGE_PROMPT_1>, <SECTION_IMAGE_PROMPT_2>, ...]（从写作 agent 传入）

## 执行步骤

### 步骤 1：生成封面图（YouMind）
youmind call generateImage '{"prompt":"<cover_prompt>, 16:9 ratio, widescreen, no faces, no text","width":900,"height":506}'
下载到本地 /tmp/cover-<slug>.jpg。

### 步骤 2：批量生成章节配图（最多 4 张，并行调用）
对每个 section_prompt，调用：
youmind call generateImage '{"prompt":"<section_prompt>","width":900,"height":506}'
下载到 wechat/images/<YYYYMMDD>/section-<n>.jpg。

目录不存在时先创建：
mkdir -p wechat/images/<YYYYMMDD>/

注意：章节配图数 > 4 时只取前 4 个。

### 步骤 3：执行发布脚本

python3 skills/wechat-article/scripts/wechat_publish.py \
  --publish \
  --title "<title>" \
  --content "<draft_path>" \
  --cover "/tmp/cover-<slug>.jpg" \
  --theme "<THEME>" \
  --images wechat/images/<YYYYMMDD>/section-1.jpg \
           wechat/images/<YYYYMMDD>/section-2.jpg \
           ...（有几张列几张）

脚本自动从 ~/.taozi/ 读取凭据，封面图自动完成 900×383 裁切 + 标题叠字。

### 步骤 4：返回结果
WECHAT_DRAFT_DONE
title: <标题>
digest: <摘要>
cover_url: <封面图 URL>
section_images: <生成的章节配图数量>
media_id: <草稿 media_id>
```

---

### 路径 3B：有主题，跳过热点

直接派子 Agent B（写作）→ 子 Agent C（发布），参数中主题替换为用户提供的内容。

---

### 路径 3C：有完整内容，直接发布

仅派子 Agent C，draft_path 指向用户提供的内容（先写入临时文件），cover_prompt 由 AI 根据标题生成。

---

## 第四步：展示结果

收到 `WECHAT_DRAFT_DONE` 后，展示：

```
✅ 文章已推送到草稿箱！

标题：<title>
摘要：<digest>
封面：<cover_url>
草稿 ID：<media_id>

下一步：登录 https://mp.weixin.qq.com → 内容 → 草稿箱 → 找到文章 → 发布

需要调整文章、重新生成封面，还是写下一篇？
```

同时调用脚本追加发布记录（安全 YAML 写入，字段用于下次选题参考）：

```bash
python3 skills/wechat-article/scripts/wechat_publish.py \
  --update-history \
  --media-id "<media_id>" \
  --title "<title>" \
  --keywords "<关键词1,关键词2,关键词3>" \
  --visual-anchors "<锚点1,锚点2,锚点3>" \
  --framework "<文章结构，如：问题分析方案行动>" \
  --section-images <章节配图数量>
```

---

## 错误处理

| 情况 | 处理 |
|------|------|
| 必填字段未填写 | 停止，列出缺少的字段，提示运行 `/taozi:setup` 补填 |
| token 获取失败（40001）| 检查 appid/secret 是否正确，重试一次 |
| IP 不在白名单（40164）| 提示用户配置 IP 白名单或在 `~/.taozi/platforms/wechat/style.yaml` 的 proxy 字段填入代理 |
| 草稿创建失败（45009）| 提示已达今日调用上限（1000 次/天），明天再试 |
| 未开通草稿箱（43019）| 提示用户在公众号后台：设置与开发 → 接口权限 → 开通草稿箱 |
| YouMind 超时 | 告知用户稍后重试或简化主题关键词 |
| 402 额度不足 | 告知升级 YouMind 套餐 |
