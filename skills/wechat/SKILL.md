---
name: wechat
description: 微信公众号文章全链路：热点选题 → YouMind 研究 → AI 写作 → 封面图生成 → 推送草稿箱。依赖 ~/.taozi/ 全局配置（运行 /taozi:setup 初始化），草稿和历史记录存于项目 ./wechat/ 目录。
triggers: "公众号文章,微信推文,发草稿箱,公众号写作,写公众号,微信公众号,WeChat article,publish to WeChat"
allowed-tools:
  - Bash([ -d "$HOME/.taozi" ]*)
  - Bash([ -f "$HOME/.taozi/platforms/wechat.yaml" ]*)
  - Bash([ -f ".taozi/platforms/wechat.yaml" ]*)
  - Bash([ -d "wechat" ]*)
  - Bash([ -f "wechat/history.yaml" ]*)
  - Bash(mkdir -p *)
  - Bash(python3 *)
---

# 微信公众号文章全链路

> **铁律（每次调用必读）**
> 无论对话进行了多少轮，无论用户说的是"再写一篇"还是"换个话题"，**只要涉及微信公众号写作/发布，必须从第一步开始执行完整流程**，不得跳过环境检查，不得直接开始写作。

**常见逃逸借口（全部无效）**：

| 借口 | 正确做法 |
|------|---------|
| "上次已经检查过环境了" | 每次都要检查，环境状态可能已变化 |
| "用户只是说'再写一篇'"，直接开始写 | 必须从第一步开始，意图路由决定路径 |
| "对话太长了，跳过检查省上下文" | 不允许，三步流程不可压缩 |
| "用户没提主题，我先问问" | 问询是意图路由的一部分，在第二步处理 |
| "已经在对话里有写作结果了，直接发布" | 走路径 3C，仍需第一步环境检查 |

主 agent 只负责三件事：**环境检查 → 意图路由 → 派 Agent**。
所有 API 调用在子 Agent 内完成。

---

## 第一步：初始化 + 配置检查

分三个阶段依次执行。

---

### 阶段 1：检查 ~/.taozi/ 全局配置

```bash
[ -d "$HOME/.taozi" ] && echo "taozi_exists" || echo "taozi_missing"
[ -f "$HOME/.taozi/platforms/wechat.yaml" ] && echo "wechat_cfg_exists" || echo "wechat_cfg_missing"
```

**`~/.taozi/` 不存在** → 停止执行，提示用户：

```
❌ 尚未完成 Taozi 全局配置，请运行 /taozi:setup（约 2 分钟），配置完成后再回来。
```

**`~/.taozi/platforms/wechat.yaml` 不存在** → 软引导（不停止，继续执行）：

```
⚠️ 未检测到微信配置，是否现在完成初始化？（需填写 AppID / AppSecret / 作者名）[初始化/跳过]
```

- **初始化**：引导用户填写，写入 `~/.taozi/config.yaml` 的 `wechat.accounts.default` 字段和 `~/.taozi/platforms/wechat.yaml`，然后继续执行。
- **跳过**：继续执行，凭据从环境变量读取（`$WECHAT_APPID` / `$WECHAT_APPSECRET`）。
  > ⚠️ 如果环境变量也未设置，后续配置检查仍会失败。请确认环境变量已配置，或选择"初始化"完成配置。

**`~/.taozi/` 存在**（无论 wechat.yaml 是否存在）→ 继续阶段 2。

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
# 发布历史 — 由 /taozi:wechat 自动维护
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

用以下 python3 脚本读取配置（三级合并）和品牌文件：

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

# 三级合并（优先级由低到高）：
# 1. ~/.taozi/config.yaml（全局凭据）
# 2. ~/.taozi/platforms/wechat.yaml（全局格式默认）
# 3. .taozi/platforms/wechat.yaml（项目级覆盖）
cfg = {}
cfg = deep_merge(cfg, load_yaml(os.path.join(TAOZI, 'config.yaml')))
cfg = deep_merge(cfg, load_yaml(os.path.join(TAOZI, 'platforms', 'wechat.yaml')))
cfg = deep_merge(cfg, load_yaml('.taozi/platforms/wechat.yaml'))

wechat   = cfg.get('wechat', {}) or {}
accounts = wechat.get('accounts', {}) or {}
account_name = cfg.get('account', 'default')
account  = accounts.get(account_name, {}) or wechat  # 兼容旧格式（直接存 appid/secret）
youmind  = cfg.get('youmind', {}) or {}
fmt      = cfg.get('format', {}) or {}

appid  = expand(account.get('appid',  '\$WECHAT_APPID'))
secret = expand(account.get('secret', '\$WECHAT_APPSECRET'))
apikey = expand(youmind.get('api_key', '\$YOUMIND_API_KEY'))
proxy  = expand(wechat.get('proxy', cfg.get('proxy', '')))
theme  = fmt.get('theme', cfg.get('theme', 'newspaper')) or 'newspaper'

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

**同时提取排版主题**：若用户输入含 "用 X 主题"、"X 风格排版" 等字样，提取主题名作为本次 `THEME`；否则使用 style.yaml 的 `theme` 字段（默认 `newspaper`）。

可用主题：`newspaper`（报纸编辑风，**默认**）、`simple`（通用简洁）、`sspai`（少数派）、`minimal`（极简）、`github`（GitHub 风）、`tech-modern`（科技深色）等。

---

## 第三步：派子 Agent 执行

### 路径 3A：全流程（无主题）

告知用户：
> 开始全流程，包含选题 → 研究 → 写作 → 配图 → 发布。写作完成后配图和发布会在**后台**进行，你可以继续聊其他事情，完成时会推送通知。

依次派以下子 Agent：

**子 Agent A — 热点研究 + 选题（多路调研 + 历史去重 + 打分）**

```
你是热点选题 agent，任务是从多路热点中筛出适合该公众号发布的选题。

## 品牌信息（来自 ~/.taozi/brand/voice.md）
<voice.md 内容，含行业/目标读者/内容方向/禁用词>

## 执行步骤

### 步骤 1：安装 YouMind CLI（如未安装）
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

### 步骤 2：读取历史选题（去重池）
读取 wechat/history.yaml（用 Read 工具），过滤 `published_at` 在今天 -30 天以内的记录，提取其 `articles[].keywords` 字段合并为去重池。
若文件不存在或为空，去重池为空集，继续后续步骤（不报错）。

### 步骤 3：3 路并行 YouMind 调研
从 voice.md 提取行业关键词 <INDUSTRY> 和领域关键词 <DOMAIN>，**一次性发出以下三个 tool call**（Claude Code 支持多 tool call 并行执行）：

路 1（行业热点 — 模拟微博/知乎热榜）：
youmind call webSearch '{"query":"<INDUSTRY> 本周热点 trending 讨论度高","timeRange":"7d","limit":10}'

路 2（破圈话题 — 模拟抖音/小红书爆款）：
youmind call webSearch '{"query":"<INDUSTRY> 出圈 跨界 普通人也在聊","timeRange":"7d","limit":10}'

路 3（竞品对标 — 同行高赞）：
youmind call webSearch '{"query":"<DOMAIN> 头部公众号 近期高赞文章主题","timeRange":"14d","limit":10}'

3 路任一失败：用剩余路结果，最终输出标注"仅 N 路数据"。
3 路全失败：报错并提示用户检查 YouMind 配置，停止。

### 步骤 4：合并去重 + history 过滤
- 合并 3 路结果，按标题语义相似度合并重复项（同义不同表述算一条）
- 用步骤 2 的去重池过滤：若候选标题的核心主题与历史关键词高度重叠（核心词至少 2 个相同，或整体语义基本一致），直接淘汰
- 候选池为空 → 提示用户放宽时间窗口或换关键词，停止

### 步骤 5：3 维打分（每候选 0–10 分，加权汇总）
- 热度（权重 0.4）：出现路数（1 路=3，2 路=6，3 路=10）
- 相关性（权重 0.4）：与品牌定位语义匹配度。锚点：7–10 分（直接在品牌行业内，目标读者高关注）；4–6 分（跨界话题，需改造贴合）；1–3 分（明显偏离品牌定位）
- SEO（权重 0.2）：标题是否含常见搜索意图词（教程/对比/指南/趋势/盘点/避坑等）+ 长度是否在 16–28 字（公众号搜索友好区间）。若 YouMind 返回了搜索量提示则参考；无数据时按标题本身判断。

汇总分 = 热度 × 0.4 + 相关性 × 0.4 + SEO × 0.2

取 top 10 候选 → 选汇总分最高 1 个为推荐 + 接下来 3 个为备选。

### 步骤 6：输出格式
TOPICS_DONE
RECOMMENDED: <标题1> | 热度<x>/相关性<y>/SEO<z> 汇总<总> | <一句话推荐理由>
ALTERNATIVES:
- <标题2> | 热度/相关性/SEO 汇总 | 理由
- <标题3> | 热度/相关性/SEO 汇总 | 理由
- <标题4> | 热度/相关性/SEO 汇总 | 理由
DATA_NOTE: <"3 路完整数据" 或 "仅 <成功路数> 路数据 — <缺失原因>">
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

### 步骤 0：选择写作框架 + 准备增强指令

a) 读取 `skills/wechat/references/frameworks.md`（用 Read 工具），按其中"框架选择判断顺序"段判定本文应使用的框架。
   输出到本轮会话上下文（**不写入文件**，由步骤 4 填入草稿元信息注释时引用）：
   SELECTED_FRAMEWORK: <框架名>
   REASON: <一句话理由>

b) 读取 `skills/wechat/references/enhancements.md`（用 Read 工具），从"框架 → 增强映射表"查询本框架对应的"必启用"和"推荐启用"策略，并输出到本轮会话上下文（**不写入文件**，由步骤 0c / 步骤 4 引用）：
   MANDATORY_ENHANCEMENTS: <必启用策略，多项用" + "（空格+号空格）连接>
   RECOMMENDED_ENHANCEMENTS: <推荐启用策略，多项用" + "连接；若映射表该列为 `—` 则写"无">

c) 把以下内容作为步骤 2 撰写时的**内联约束**（写作过程严格遵守，不是改 system prompt）：
   - 选定框架的"段落骨架"完整文本（直接引用原文，不改写）
   - 必启用策略的"注入指令模板"完整文本（直接引用原文，不改写）
   - 推荐启用策略的"注入指令模板"完整文本（若映射表该列为 `—` 则跳过）

   在步骤 2 开始撰写前，必须先完整读完上述三块文本，并在整篇文章中遵守。

文件缺失处理：
- frameworks.md 缺失 → 警告"框架库缺失，跳过步骤 0 全部子步骤，直接进步骤 1"，本轮不选框架也不注入增强
- enhancements.md 缺失（但 frameworks.md 存在）→ 警告"增强库缺失，跳过步骤 0c 的增强注入部分"，步骤 0a/0b 仍执行（选框架），步骤 2 仅按骨架写
- 两者均缺失 → 等同于 frameworks.md 缺失情形（跳过步骤 0 全部，直接进步骤 1）

### 步骤 1：YouMind 深度研究
youmind call webSearch '{"query":"<主题>","limit":15}'
提炼：核心观点 3-5 条、数据/案例 2-3 个、争议点 1-2 个

### 步骤 2：撰写文章（Markdown）

**写作前必须参考以下规范**：
- 步骤 0 输出的 `SELECTED_FRAMEWORK` 对应框架的"段落骨架"（步骤 0c 已读取）：**按该骨架的章节顺序组织正文**，不得擅自改变框架顺序
- 步骤 0c 已读取的"必启用/推荐启用"策略注入指令：写作全程遵守
- 参数中的 `playbook.md` 内容：标题规范、段落节奏、HKR 质检框架、风格禁忌
- `references/writing-guide.md`（若存在）：de-AI 四级协议、So What 三层法、原子洞察强制框架
  读取路径：`skills/wechat/references/writing-guide.md`
- 参数中的 `voice.md` 内容：用于确定写作语气、人设、禁用词、目标读者

遵循规范撰写，输出：
- 标题（20-28 字）
- 摘要（54 字以内）
- 正文（1200-2500 字，微信公众号适合长度）
- 文章类型判断（article_type）：从正文内容判断类型，输出 `opinion | tech | tutorial | storytelling | knowledge` 之一
- 封面场景描述（cover_scene，英文，10词以内）：描述文章主题对应的视觉场景，**不包含角色或风格修饰词**（这部分由 Sub-agent C 决策）
  示例：`vast digital network cityscape, glowing connections`（科技文）；`person at crossroads, sunrise ahead`（观点文）

**写完后执行 L1-L4 四层终检（playbook.md 有详细说明）**：
- L1 禁词扫描：检查 style.yaml `blacklist.words` 中的禁用词，有则替换
- L2 节奏检查：是否有连续 3 段以上"首先…其次…最后"或 AI 排比句，有则打散
- L3 活人感终审：通读一遍，像机器生成的句子改掉
- L4 信息诚信：无来源的数字/案例标 "暂缺数据" 或删除，不编造

### 步骤 3：章节类型识别 + 输出配图元数据

对每个 H2 章节（最多 4 个），判断章节类型并输出元数据（**不生成完整 prompt，由 Sub-agent C 的图片决策层组装**）：

**数据图表型（section_type: infographic）**：章节中含以下任一特征
- 含具体数字/百分比/统计数据
- 含对比（A vs B、优劣、前后）
- 含流程/步骤（3步以上）
- 含层级/分类体系
- 含多维数据或指标

**插画型（section_type: illustration）**：其余章节（场景描述、概念解释、情感表达等）

输出格式（**每个章节一行**）：
```
SECTION_IMAGE_META_N: <章节标题> | <section_type: illustration|infographic> | <章节核心内容，中文，50字以内>
```

示例：
```
SECTION_IMAGE_META_1: AI 时代的就业变局 | illustration | AI 替代部分岗位，新型人机协作工作涌现，技能迁移成为关键
SECTION_IMAGE_META_2: 五大高危职业 | infographic | 数据录入员、电话客服、流水线工人被替代率分别为 99%/97%/94%
```

### 步骤 4：插入章节配图占位符 + 保存草稿

在草稿 Markdown 中，将每个 H2 章节标题（最多 4 个）的**第一个段落后**插入对应占位符：

```
## 第一章标题

第一段正文...

![](../images/<YYYYMMDD>-<slug>/section-1.jpg)

## 第二章标题
...
```

占位符规则：路径为 `../images/<YYYYMMDD>-<slug>/section-<n>.jpg`，YYYYMMDD-slug 与草稿文件名一致；按 H2 出现顺序从 1 开始编号；超过 4 个 H2 章节时只给前 4 个插入占位符。

路径说明：草稿位于 `wechat/drafts/`，图片位于 `wechat/images/<YYYYMMDD>-<slug>/`，相对路径需写 `../images/<YYYYMMDD>-<slug>/section-<n>.jpg` 才能在本地 Markdown 预览中正确显示。

将处理后的完整 Markdown 写入 `wechat/drafts/<YYYYMMDD>-<slug>.md`。

**草稿元信息**：在草稿末尾追加 HTML 注释行（位于全部内容最末，不影响显示）：

```html
<!-- 框架: <SELECTED_FRAMEWORK> | 增强: <实际启用的增强项，多项用" + "（空格+号空格）连接，例如"密度强化 + 细节锚定"> -->
```

若步骤 0 因文件缺失被整体跳过（`SELECTED_FRAMEWORK` 未产生），元信息注释写：

```html
<!-- 框架: 无 | 增强: 无（文件缺失） -->
```

### 步骤 5：返回结果
DRAFT_DONE
title: <标题>
digest: <摘要>
article_type: <opinion|tech|tutorial|storytelling|knowledge>
draft_path: wechat/drafts/<文件名>
cover_scene: <封面场景描述，英文，10词以内，描述文章主题视觉场景>
section_count: <章节数，最多4>
SECTION_IMAGE_META_1: <章节标题> | illustration | <章节核心内容，中文，50字>
SECTION_IMAGE_META_2: <章节标题> | infographic | <章节核心数据，中文，50字>
...（有几个写几个）
```

**子 Agent C — 封面图 + 章节配图 + 微信发布（后台执行，`run_in_background: true`）**

收到 DRAFT_DONE 后：
1. 立即告知用户："✅ 文章写作完成！正在后台生成配图并推送草稿箱，约 3-5 分钟后会收到通知，可以继续聊其他事情。"
2. 以 `run_in_background: true` 派出子 Agent C，不等待其返回。

```
你是发布 agent，负责生成封面图、章节配图，并推送到微信草稿箱。完成后用 PushNotification 通知用户。

## 参数
- draft_path: <草稿文件路径>
- title: <标题>
- digest: <摘要>
- article_type: <opinion|tech|tutorial|storytelling|knowledge>
- cover_scene: <封面场景描述，英文，10词>
- section_metas: [<SECTION_IMAGE_META_1>, <SECTION_IMAGE_META_2>, ...]
- theme: <THEME>

## 执行步骤

### 步骤 0：读取品牌配置（角色 + 配色）

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

def read_platform_yaml():
    path = os.path.join(HOME, '.taozi', 'platforms', 'wechat.yaml')
    try:
        with open(path) as f:
            return f.read()
    except:
        return ''

char = read_brand('character.md')
print('CHARACTER_EXISTS:' + ('yes' if char else 'no'))
if char:
    print('CHARACTER_CONTENT:' + char[:500])

style = read_platform_yaml()
try:
    import yaml as _yaml
    _style_data = _yaml.safe_load(style) or {}
    palette = _style_data.get('palette', '') or ''
except Exception:
    palette = ''
print('PALETTE:' + palette)
"
```

从输出提取：
- `character`：character.md 中描述角色外形的核心段落（第一个非标题段落，或 `## 角色描述` 下的内容）
- `compatible_styles`：character.md 中 `compatible_styles:` 行的值（如不存在，默认 `[warm, vector-illustration, flat design]`）
- `palette`：style.yaml 中 `palette:` 的值（如不存在或为空则忽略，由 image skill 根据风格自动决定）

### 步骤 1：决策配图风格（基于 image skill 的 Context Mode 规则）

读取 `skills/image/SKILL.md` 中的 **上下文感知模式：决策规则** 部分，理解角色注入规则和 article_type → 风格映射。

**封面图决策**：
- image_role: cover，article_type: <传入值>，character: <步骤0读取值>
- 如 character 存在：在 prompt 最前加角色锚点，从 compatible_styles 选封面风格
- 如 character 不存在：按 article_type 推荐的封面关键词生成 prompt
- 封面 prompt 结构：`<角色锚点（如有）>, <cover_scene>, <风格关键词>, <palette（如有，追加 color palette: ...）>, widescreen 16:9, no text overlay, high quality`

**章节配图决策**（对每个 SECTION_IMAGE_META_N）：
解析 `<section_title> | <section_type> | <section_content>`

- illustration 类型：
  - 如 character 存在：角色锚点 + 章节场景 + 从 compatible_styles 选 Style
  - 如不存在：从 article_type 对应风格 + 章节内容语义组装 prompt
  - prompt 结构：`<角色锚点（如有）>, WeChat article illustration, <章节场景>, <风格关键词>, <palette（如有，追加 color palette: ...）>, 16:9, no text overlay`

- infographic 类型：
  - 读取 `skills/infographic/references/layouts.md` 和 `styles.md` 的内容类型推荐表
  - 根据 section_content 特征自动选 layout + style（参考推荐表）
  - 按 infographic prompt 模板组装（`Create a professional infographic ... Layout: ... Style: ... Content: <section_content>`）
  - **不注入角色**

### 步骤 2：生成封面图（串行）

先创建图片目录：
```bash
mkdir -p wechat/images/<YYYYMMDD>-<slug>/
```

派一个子 agent：
```
目标保存路径：/tmp/cover-<slug>.jpg

1. 安装 CLI（如未安装）：youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli
2. youmind call getDefaultBoard → boardId
3. youmind call createChat '{"boardId":"<boardId>","message":"<封面 prompt>","tools":{"imageGenerate":{"useTool":"required","aspectRatio":"16:9","quality":"high","model":"gemini-3-pro-image-preview"}}}'
4. 每 5 秒 getChat 轮询，status=completed 后 listMessages 提取图片 URL
5. 下载到 /tmp/cover-<slug>.jpg
6. 输出：SAVED: /tmp/cover-<slug>.jpg
```

### 步骤 3：并行生成章节配图（最多 4 张）

对每个章节（最多 4 个），各派一个独立子 agent：

```
目标保存路径：wechat/images/<YYYYMMDD>-<slug>/section-<n>.jpg

1. 安装 CLI（如未安装）：youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli
2. youmind call getDefaultBoard → boardId
3. youmind call createChat '{"boardId":"<boardId>","message":"<步骤1决策的完整 prompt>","tools":{"imageGenerate":{"useTool":"required","aspectRatio":"16:9","quality":"high","model":"gemini-3-pro-image-preview"}}}'
4. 每 5 秒 getChat 轮询，status=completed 后 listMessages 提取图片 URL
5. 下载到 wechat/images/<YYYYMMDD>-<slug>/section-<n>.jpg
6. 验证：ls -la wechat/images/<YYYYMMDD>-<slug>/section-<n>.jpg
7. 输出：SAVED: wechat/images/<YYYYMMDD>-<slug>/section-<n>.jpg
```

同时发出所有子 agent，**等所有子 agent 均返回结果后**进入下一步。

### 前置检查：收集实际保存路径 + 文件验证

所有子 agent 完成后，执行以下强制检查（**缺一不过**）：

```bash
# 1. 列出实际下载的文件
ls wechat/images/<YYYYMMDD>-<slug>/section-*.jpg 2>/dev/null | sort

# 2. 与草稿中的占位符对比
# 草稿中有多少个 ![](section-N.jpg) 占位符，磁盘上就必须有多少个文件
# 文件数 < 占位符数 → 报错，不发布
```

若任意图片文件缺失：
- 用 PushNotification 通知用户："❌ 配图生成失败：section-<n>.jpg 未成功下载，文章未发布，请重试"
- **立即终止，不执行步骤 3**

`--images` 参数从磁盘实际文件列表构建，不手动枚举：
```bash
IMAGE_FILES=$(ls wechat/images/<YYYYMMDD>-<slug>/section-*.jpg 2>/dev/null | sort | tr '\n' ' ')
```

### 步骤 3：执行发布脚本

```bash
python3 skills/wechat/scripts/wechat_publish.py \
  --publish \
  --title "<title>" \
  --content "<draft_path>" \
  --cover "/tmp/cover-<slug>.jpg" \
  --theme "<theme>" \
  --images $IMAGE_FILES
```

`$IMAGE_FILES` 是上一步 glob 收集到的**实际存在**的图片路径列表。
脚本自动从 ~/.taozi/ 读取凭据，封面图自动完成 900×383 裁切 + 标题叠字。
获取返回的 media_id。

### 步骤 4：追加发布历史记录

python3 skills/wechat/scripts/wechat_publish.py \
  --update-history \
  --media-id "<media_id>" \
  --title "<title>" \
  --keywords "<从 title 提取的关键词1,关键词2,关键词3>" \
  --visual-anchors "<visual_anchors>" \
  --framework "<文章结构>" \
  --section-images <章节配图数量>

### 步骤 5：用 PushNotification 通知用户

调用 PushNotification，内容：
"✅ 微信公众号草稿已发布！\n标题：<title>\n草稿 ID：<media_id>\n\n登录 https://mp.weixin.qq.com → 内容 → 草稿箱 → 找到文章 → 发布"
```

---

### 路径 3B：有主题，跳过热点

直接派子 Agent B（写作）→ 子 Agent C（`run_in_background: true`），参数中主题替换为用户提供的内容。
写作完成后立即告知用户"正在后台生图并发布"。

---

### 路径 3C：有完整内容，直接发布

仅派子 Agent C（`run_in_background: true`），draft_path 指向用户提供的内容（先写入临时文件），cover_prompt 由 AI 根据标题生成。
立即告知用户"正在后台生图并推送草稿箱"。

---

## 第四步：告知用户

子 Agent C 以 `run_in_background: true` 启动后，主 agent **立即**向用户展示写作成果并告知后台状态：

```
✅ 文章写作完成！

标题：<title>
摘要：<digest>
草稿已保存至：<draft_path>

⏳ 正在后台生成封面图和章节配图，并推送到草稿箱（约 3-5 分钟）。
   完成后会收到通知，届时登录 https://mp.weixin.qq.com → 内容 → 草稿箱 查看。

期间可以继续聊其他事情。
```

发布历史记录和 PushNotification 通知均在子 Agent C 内部完成（步骤 4-5）。

---

## 错误处理

| 情况 | 处理 |
|------|------|
| 必填字段未填写 | 停止，列出缺少的字段，提示运行 `/taozi:setup` 补填 |
| token 获取失败（40001）| 检查 appid/secret 是否正确，重试一次 |
| IP 不在白名单（40164）| 提示用户配置 IP 白名单或在 `~/.taozi/config.yaml` 的 wechat.proxy 字段填入代理 |
| 草稿创建失败（45009）| 提示已达今日调用上限（1000 次/天），明天再试 |
| 未开通草稿箱（43019）| 提示用户在公众号后台：设置与开发 → 接口权限 → 开通草稿箱 |
| YouMind 超时 | 告知用户稍后重试或简化主题关键词 |
| 402 额度不足 | 告知升级 YouMind 套餐 |
