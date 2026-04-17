---
name: wechat-article
description: 微信公众号文章全链路：热点选题 → YouMind 研究 → AI 写作 → 封面图生成 → 推送草稿箱。支持全局配置（~/wechat-articles/）+ 项目覆盖（./wechat-articles/），首次运行自动初始化。需要 YOUMIND_API_KEY、WECHAT_APPID、WECHAT_APPSECRET 环境变量。
triggers: "公众号文章,微信推文,发草稿箱,公众号写作,写公众号,微信公众号,WeChat article,publish to WeChat"
allowed-tools:
  - Bash([ -n "$YOUMIND_API_KEY" ]*)
  - Bash([ -d "wechat-articles" ]*)
  - Bash([ -d "$HOME/wechat-articles" ]*)
  - Bash([ -f "wechat-articles/style.yaml" ]*)
  - Bash([ -f "$HOME/wechat-articles/style.yaml" ]*)
  - Bash(python3 *)
---

# 微信公众号文章全链路

主 agent 只负责三件事：**环境检查 → 意图路由 → 派 Agent**。
所有 API 调用在子 Agent 内完成。

---

## 第一步：初始化 + 配置检查

分三个阶段依次执行。

---

### 阶段 1：检查全局目录

```bash
[ -d "$HOME/wechat-articles" ] && echo "global_exists" || echo "global_missing"
```

**全局目录不存在** → 立刻创建 `~/wechat-articles/` 并写入以下三个文件，然后停止：

```bash
mkdir -p "$HOME/wechat-articles"
```

**`~/wechat-articles/style.yaml` 内容**（原样写入）：

```yaml
# ============================================================
# 微信公众号全局配置 — 由 /taozi:wechat-article 自动生成
# 此文件保存在 ~/wechat-articles/，所有项目共享
# 凭据优先读环境变量，直接在此填写则覆盖环境变量
# ============================================================

# 【必填】微信公众号 API 凭据
# 获取：https://developers.weixin.qq.com/platform → 公众号 → 基础信息
wechat:
  appid: $WECHAT_APPID          # 直接修改此值可覆盖环境变量
  secret: $WECHAT_APPSECRET     # 直接修改此值可覆盖环境变量
  author: ""                    # 文章作者名（公众号底部显示）

# 【可选】代理服务器（绕过微信 IP 白名单限制）
# 留空则读取 $WECHAT_PROXY；没有代理则需配置微信 IP 白名单
proxy: $WECHAT_PROXY

# 【必填】YouMind API Key（研究、搜索、生图）
# 获取：https://youmind.com/settings/api-keys
youmind:
  api_key: $YOUMIND_API_KEY     # 直接修改此值可覆盖环境变量

# 【必填】品牌信息
name: ""            # 公众号名称，如"硅星人"
industry: ""        # 行业，如"AI/科技"
target_audience: "" # 目标读者，如"25-35 岁互联网从业者"

# 【必填】写作风格（越具体，AI 越像你）
tone: ""            # 语气，如"专业但不学术，像同行之间聊天，不是教授讲课"
voice: ""           # 人设，如"第一人称，8 年 AI 从业经验的老兵，对套路有本能反感"

# -------------------------------------------------------
# 以下可选，不填也能运行
# -------------------------------------------------------

# 内容方向（不填则 AI 自由发挥）
# topics:
#   - AI 工具与效率
#   - 独立开发

# 硬性禁止
# blacklist:
#   words: ["颠覆", "赋能", "生态"]
#   topics: ["投资理财"]

# 参考账号写法
# reference_accounts: ["硅星人", "AI产品手册"]

# 排版主题
# theme: "simple"       # simple | center | decoration | prominent
# theme_color: "#576b95"

# 封面图风格（不填则 AI 根据标题发挥）
# cover_style: "科技感，深色调，极简几何，无人脸"

# 封面图固定角色：在 ~/wechat-articles/character.md 中定义（参考 references/character-template.md）
# 文件存在 → 每张封面都会包含该角色；文件不存在 → AI 自由发挥

# YouMind 知识库打通
# youmind_boards:
#   source_boards: []   # 写作时搜索这些 Board 的素材
#   save_board: ""      # 发布后归档到这个 Board
```

**`~/wechat-articles/playbook.md` 内容**（原样写入）：

```markdown
# 写作手册

> 此文件由 /taozi:wechat-article 自动生成。
> 随着你使用（改稿、喂语料），AI 会不断更新这里的内容。

## 通用写作原则

- 开头不用废话，第一句必须能抓住读者
- 每段控制在 3-5 句，移动端适合短段落
- 用具体例子代替抽象描述
- 结尾有明确的行动点或思考问题

## 标题规范

- 20-28 个汉字（微信最优区间）
- 禁用"最全"、"颠覆"、"赋能"等过度营销词
- 优先：数字 + 具体场景

## 内容结构

适合用"问题 → 分析 → 方案 → 行动"四段式，
或"背景 → 核心观点 → 论据 → 结论"学术型。

## 摘要要求

- 54 个汉字以内（微信限制）
- 是文章价值的浓缩，不是标题的重复

## 风格禁忌

- 不写 AI 味道的排比句
- 不写"首先…其次…最后…"的流水账
- 不写没有具体数据支撑的大词
```

**`~/wechat-articles/character.md` 内容**（原样写入）：

````markdown
# 封面角色设定

> 填写下方角色描述后，每张封面图都会自动包含此角色。
> 保持空白（只有注释和示例）时，AI 会自由发挥封面视觉，不出现固定角色。
>
> 不确定如何写？直接告诉 AI：
> "帮我生成一个[科技感/可爱卡通/商务]风格的封面角色，写成 character.md 格式"
> 把 AI 生成的结果粘贴到「我的角色」部分即可。

---

<!-- 示例（仅供参考，不影响生成）

外形：戴圆框眼镜的卡通熊猫，圆润体型，穿黑色卫衣，手持平板电脑
风格：卡通扁平插画，2D，线条干净
位置：封面右下角，半身像，不遮挡主标题文字
标志性元素：圆框眼镜、黑色卫衣、平板电脑
禁止：不出现真实人脸，不遮挡大字标题，不改变眼镜形状

-->

---

## 我的角色

<!-- 在这里填写你的角色。删除此注释并按示例格式描述即可。 -->
````

创建完成后，告知用户：

```
✅ 已创建全局配置目录 ~/wechat-articles/

请打开 ~/wechat-articles/style.yaml，填写必填项：
- wechat.appid 和 wechat.secret（微信开发者平台获取）
- youmind.api_key（YouMind 设置页获取）
- name、industry、target_audience、tone、voice

配置一次，所有项目共享。
每个项目可在 ./wechat-articles/style.yaml 中覆盖部分字段（只写需要覆盖的）。

⚠️  微信 IP 白名单（需配置，否则发布失败）：
1. 运行 `curl -s https://ifconfig.me` 获取本机公网 IP
2. 登录 https://developers.weixin.qq.com/platform → 公众号 → 基础信息 → API IP 白名单 → 编辑 → 添加 IP
（有代理服务器可在 style.yaml 的 proxy 字段填入，无需配白名单）

📎 可选：~/wechat-articles/character.md 已创建
   → 填写「我的角色」部分可为每张封面图设定固定 IP 角色
   → 保持空白则 AI 自由发挥，不影响发布流程

填完后再告诉我要写什么主题就可以开始了
```

**停止执行，等待用户反馈。**

**全局目录已存在** → 继续阶段 2。

---

### 阶段 2：检查项目目录

```bash
[ -d "wechat-articles" ] && echo "project_exists" || echo "project_missing"
```

**项目目录不存在** → 创建项目目录结构（不创建 style.yaml，草稿和历史按项目隔离）：

```bash
mkdir -p wechat-articles/drafts wechat-articles/corpus wechat-articles/lessons
touch wechat-articles/corpus/.gitkeep wechat-articles/lessons/.gitkeep
```

**`wechat-articles/history.yaml` 内容**（写入）：

```yaml
# 发布历史 — 由 /taozi:wechat-article 自动维护
# 每次发布后自动追加一条记录
# stats 字段可手动填入数据（用于优化未来选题）
articles: []

# 格式参考：
# articles:
#   - date: "2026-04-17"
#     title: "文章标题"
#     media_id: "xxx"
#     topic_keywords: ["关键词1", "关键词2"]
#     stats:
#       reads: 0
#       likes: 0
```

告知用户：

```
✅ 已创建项目目录 ./wechat-articles/（草稿和历史记录存于此）
   使用全局配置 ~/wechat-articles/style.yaml
   如需为本项目定制风格，可创建 ./wechat-articles/style.yaml（只写需覆盖的字段）
```

**项目目录已存在** → 继续阶段 3。

---

### 阶段 3：读取并合并配置

用以下 python3 脚本读取全局 + 项目配置，项目字段覆盖全局字段：

```bash
python3 -c "
import os, sys

HOME = os.path.expanduser('~')
GLOBAL_CFG = os.path.join(HOME, 'wechat-articles', 'style.yaml')
PROJECT_CFG = 'wechat-articles/style.yaml'

def expand(val):
    if isinstance(val, str) and val.startswith('\$'):
        return os.environ.get(val[1:], '') or ''
    return val or ''

def load_yaml(path):
    try:
        import yaml
        with open(path) as f:
            return yaml.safe_load(f) or {}
    except Exception:
        return {}

cfg = load_yaml(GLOBAL_CFG)
if os.path.exists(PROJECT_CFG):
    proj = load_yaml(PROJECT_CFG)
    for key, val in proj.items():
        if isinstance(val, dict) and isinstance(cfg.get(key), dict):
            cfg[key] = {**cfg.get(key, {}), **val}
        else:
            cfg[key] = val

wechat  = cfg.get('wechat', {})
youmind = cfg.get('youmind', {})

appid  = expand(wechat.get('appid',  '\$WECHAT_APPID'))
secret = expand(wechat.get('secret', '\$WECHAT_APPSECRET'))
apikey = expand(youmind.get('api_key', '\$YOUMIND_API_KEY'))

name     = cfg.get('name', '')
industry = cfg.get('industry', '')
audience = cfg.get('target_audience', '')
tone     = cfg.get('tone', '')
voice    = cfg.get('voice', '')

missing = []
if not appid:    missing.append('wechat.appid')
if not secret:   missing.append('wechat.secret')
if not apikey:   missing.append('youmind.api_key')
if not name:     missing.append('name')
if not industry: missing.append('industry')
if not audience: missing.append('target_audience')
if not tone:     missing.append('tone')
if not voice:    missing.append('voice')

if missing:
    print('MISSING:' + ','.join(missing))
else:
    print('OK')
    print('APPID:' + appid)
    print('APIKEY:' + apikey[:8] + '...')
"
```

如果输出含 `MISSING:`，提示用户在 `~/wechat-articles/style.yaml` 中补填对应字段，停止执行。

---

## 第二步：意图路由

根据用户输入判断进入哪条路径：

| 用户输入 | 路径 |
|---------|------|
| 提供了明确主题（如"写一篇关于 AI Agent 的文章"）| 跳过热点，从 YouMind 研究开始（步骤 3B）|
| 提供了完整 Markdown 内容 | 直接发布（跳到步骤 3C）|
| 什么都没给，或只说"写公众号文章" | 全流程：热点 → 选题 → 研究 → 写作 → 发布（步骤 3A）|

---

## 第三步：派子 Agent 执行

### 路径 3A：全流程（无主题）

告知用户：
> 开始全流程，包含选题 → 研究 → 写作 → 配图 → 发布，约 5-10 分钟，期间可继续其他工作。

依次派以下子 Agent：

**子 Agent A — 热点研究 + 选题**

```
你是热点选题 agent，任务是找到适合该公众号发布的热点话题。

## 公众号信息
- 行业：<industry>
- 目标读者：<target_audience>
- 内容方向：<topics 或"AI/科技/效率">

## 执行步骤

### 步骤 1：安装 YouMind CLI（如未安装）
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

### 步骤 2：搜索近 48 小时热点
youmind call webSearch '{"query":"<industry> 最新动态 热点 2024","timeRange":"48h","limit":10}'

### 步骤 3：筛选 + 生成选题
根据搜索结果，结合公众号定位，生成 3 个候选标题，格式：
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
- 公众号名称：<name>
- 语气：<tone>
- 人设：<voice>
- 目标读者：<target_audience>

## 执行步骤

### 步骤 1：YouMind 深度研究
youmind call webSearch '{"query":"<主题>","limit":15}'
提炼：核心观点 3-5 条、数据/案例 2-3 个、争议点 1-2 个

### 步骤 2：撰写文章（Markdown）
读取写作规范：优先 `wechat-articles/playbook.md`，不存在则读 `~/wechat-articles/playbook.md`。遵循其规范撰写。
输出：
- 标题（20-28 字）
- 摘要（54 字以内）
- 正文（1200-2500 字，微信公众号适合长度）
- 封面图生成 prompt（英文，16:9，无人脸）：
  1. 读取 `wechat-articles/character.md`（或 `~/wechat-articles/character.md`），找到 `## 封面图用法（16:9）` 下方代码块，提取其完整内容作为封面 prompt 基础
  2. 在此基础上追加本文主题相关的场景描述（10 词以内）
  3. 若 character.md 不存在或「我的角色」为空，则纯粹按文章主题和风格自由生成封面 prompt

### 步骤 3：提取视觉锚点 + 生成章节配图 prompt

从封面图 prompt 中提取 3 个风格关键词作为**视觉锚点**（如 `manga / cream beige / Q-style`），
所有章节配图必须包含这些锚点，确保风格统一。

读取角色文件（优先 `wechat-articles/character.md`，其次 `~/wechat-articles/character.md`），
提取"章节配图用法（16:9）"模板。

为文章每个 H2 章节（最多 4 个）生成一条配图 prompt，格式：

```
SECTION_IMAGE_PROMPT_1: <章节标题> | <完整英文 prompt，含视觉锚点 + 角色模板 + 章节场景描述>
SECTION_IMAGE_PROMPT_2: ...
```

配图 prompt 构建规则：

1. **读取 character.md**（优先 `wechat-articles/character.md`，其次 `~/wechat-articles/character.md`）
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

### 步骤 4：保存草稿
将完整 Markdown 写入 wechat-articles/drafts/<YYYYMMDD>-<slug>.md

### 步骤 5：返回结果
DRAFT_DONE
title: <标题>
digest: <摘要>
draft_path: wechat-articles/drafts/<文件名>
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
下载到 wechat-articles/images/<YYYYMMDD>/section-<n>.jpg。

目录不存在时先创建：
mkdir -p wechat-articles/images/<YYYYMMDD>/

注意：章节配图数 > 4 时只取前 4 个。

### 步骤 3：执行发布脚本
source ~/.config/env/wechat/kedoupi-mp.env 2>/dev/null || true
source ~/.config/env/productivity/youmind.env 2>/dev/null || true

python3 skills/wechat-article/scripts/wechat_publish.py \
  --publish \
  --title "<title>" \
  --content "<draft_path>" \
  --cover "/tmp/cover-<slug>.jpg" \
  --images wechat-articles/images/<YYYYMMDD>/section-1.jpg \
           wechat-articles/images/<YYYYMMDD>/section-2.jpg \
           ...（有几张列几张）

脚本会自动从 style.yaml 读取凭据，封面图自动完成 900×383 裁切 + 标题叠字。

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

同时将本次发布记录追加到 `wechat-articles/history.yaml`（扩展字段用于下次选题参考）：

```yaml
  - date: "<YYYY-MM-DD>"
    title: "<title>"
    media_id: "<media_id>"
    topic_keywords: []          # 从标题/内容提取的关键词
    framework: ""               # 文章结构：问题分析方案行动 / 背景观点论据结论 / 其他
    visual_anchors: []          # 封面视觉锚点关键词（供下篇配图参考）
    section_images: 0           # 本篇生成的章节配图数量
    quality:
      hkr_pass: true            # HKR 三维是否通过
      notes: ""                 # 人工补充的质量备注
    stats:
      reads: 0
      likes: 0
```

---

## 错误处理

| 情况 | 处理 |
|------|------|
| 必填字段未填写 | 停止，列出缺少的字段，提示打开 style.yaml 填写 |
| token 获取失败（40001）| 检查 appid/secret 是否正确，重试一次 |
| IP 不在白名单（40164）| 提示用户配置 IP 白名单或在 style.yaml 的 proxy 字段填入代理 |
| 草稿创建失败（45009）| 提示已达今日调用上限（1000 次/天），明天再试 |
| 未开通草稿箱（43019）| 提示用户在公众号后台：设置与开发 → 接口权限 → 开通草稿箱 |
| YouMind 超时 | 告知用户稍后重试或简化主题关键词 |
| 402 额度不足 | 告知升级 YouMind 套餐 |
