---
name: xiaohongshu
description: 小红书全链路：热点选题 → YouMind 研究 → 正文创作（标题/正文/话题标签）→ AI 配图生成（多图风格统一）。需要 YOUMIND_API_KEY。
argument-hint: <主题，如"分享一个 AI 工具测评，走信息密集风格">
triggers: "小红书,小红书文章,小红书内容,xhs,rednote,种草,小红书图文"
allowed-tools:
  - Bash([ -d "$HOME/.taozi" ]*)
  - Bash(python3 *)
  - Bash(mkdir -p *)
  - Bash(cat *)
  - Bash([ -f ".taozi/platforms/xiaohongshu.yaml" ]*)
---

# Xiaohongshu

根据 `$ARGUMENTS` 完成从选题到配图的小红书内容全链路。

## 第一步：环境检查

用 `[ -d "$HOME/.taozi" ]` 检查配置目录。

读取 `~/.taozi/config.yaml`，提取 `youmind.api_key`。

**缺失时**：停止并提示运行 `/taozi:setup`。

### 项目配置检查（非阻断）

```bash
[ -f ".taozi/platforms/xiaohongshu.yaml" ] && echo "xhs_cfg_exists" || echo "xhs_cfg_missing"
```

`xhs_cfg_missing` 时，软提示（**不阻断，继续执行**）：

```
⚠️ 未检测到小红书项目配置，将使用全局默认值。
如需自定义：创建 .taozi/platforms/xiaohongshu.yaml
  format:
    image_count: 6
    ratio: "1:1"
    strategy: auto
```

## 第二步：意图路由

从 `$ARGUMENTS` 解析：

| 输入 | 路由 |
|------|------|
| 有完整正文（>200 字）| → 直接第四步（生图） |
| 有明确主题 | → 跳过热点，直接第三步（研究 + 写作） |
| 模糊 / 无 | → 第二步 A（热点选题） → 用户确认 → 第三步 |

同时提取：
- 内容策略（默认 `auto`）：`story`（故事驱动）/ `info`（信息密集）/ `visual`（视觉优先）
- 风格预设（默认 `auto`）：见下方预设表
- 图片数量（默认 3-6 张）

## 第二步 A：热点选题（仅 vague 路由）

派 Sub-Agent 调用 YouMind 热点研究，返回 5 个候选选题。

展示给用户确认（含选题理由和内容策略建议）。

## 第三步：研究 + 正文创作

### 研究阶段

调用 `youmind research` 获取关键数据点（3-5 个）。

超时则跳过研究，基于主题直接写作。

### 内容策略映射

根据内容策略选择写作结构：

| 策略 | 适用场景 | 结构 |
|------|---------|------|
| `story`（故事驱动）| 个人分享、变化对比、种草 | 钩子故事 → 转折 → 干货 → 呼吁行动 |
| `info`（信息密集）| 教程、测评、清单、对比 | 结论前置 → 分点展开 → 数据支撑 → 总结 |
| `visual`（视觉优先）| 高颜值内容、生活方式 | 短文案 + 强视觉描述 → 情绪共鸣 |
| `auto` | 由 AI 根据主题自动判断 | — |

### 输出格式

```
【标题】≤20 字，含 1-2 个表情符号，有钩子
【正文】300-800 字，分段落，含小标题（视策略而定）
【话题标签】5-10 个，格式：#话题名 [热度：高/中/精准]
【封面图 prompt】英文，1:1，无人脸，风格与预设一致
【配图 prompts】每张图一个 prompt，英文，与封面保持视觉一致
```

## 第四步：展示文案 + 后台配图

### 步骤 1：立即展示文案

**立即**向用户展示文案（无需等图片，无需等用户确认风格）：

```
✅ 小红书内容已生成！

【标题】<title>
【正文】<正文预览，前 150 字>...
【话题标签】<标签列表>

⏳ 正在后台生成配图（约 3-5 分钟），完成后通知你。
```

### 步骤 2：后台启动配图 sub-agent（`run_in_background: true`）

**派出前**，先从标题推导 `title_slug`：取标题核心关键词翻译为英文，3-5 个词，全小写连字符，最多 25 字符。例如：「AI 替代职场 5 大趋势」→ `ai-workplace-trends`。

**立刻**以 `run_in_background: true` 派出配图 sub-agent，不等待返回。

---

### 后台 sub-agent 指令

```
你是小红书配图生成 agent。完成所有图片后用 PushNotification 通知用户。

## 参数
- article_type: <opinion|tech|tutorial|storytelling|knowledge>
- content_outline: <文章标题 + 各节核心内容列表（每项50字内）>
- total_count: <总图片数（封面1张 + 内容图N张）>
- title_slug: <从标题提取的英文 slug，3-5个词，小写连字符，如 "ai-career-shift">
- output_dir: xiaohongshu/images/<YYYYMMDD>-<title_slug>/

## 步骤 0：读取品牌配置

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

char = read_brand('character.md')
print('CHARACTER_EXISTS:' + ('yes' if char else 'no'))
if char:
    print('CHARACTER_CONTENT:' + char[:500])
"
```

提取：
- `character`：character.md 角色外形描述核心段落（若不存在则为空）
- `compatible_styles`：character.md 中 `compatible_styles:` 值（若不存在，默认 `[warm, vector-illustration, flat design]`）

## 步骤 1：风格决策（baoyu-xhs-images 体系）

根据 article_type 选风格和布局：

| article_type    | 推荐风格                  | 推荐布局  |
|----------------|--------------------------|---------|
| storytelling   | warm / cute              | balanced |
| opinion        | bold / minimal           | sparse  |
| tech           | notion                   | dense   |
| tutorial       | chalkboard / sketch-notes | flow   |
| knowledge      | notion / sketch-notes    | list / dense |

若 character 存在，从 compatible_styles 中选与上述推荐风格最接近的。

定义 **Style Anchor 字符串**（所有图共用，保证视觉一致）：
```
[Style Anchor] art style: <选定风格描述>, color palette: <对应配色>, <角色锚点（如有）>, consistent visual DNA
```

## 步骤 2：生成封面图（串行，建立视觉基准）

```bash
mkdir -p xiaohongshu/images/<YYYYMMDD>-<title_slug>/
```

**封面是带文字的小红书图文卡，参考 baoyu-xhs-images sparse 布局。**

封面 prompt 结构（自行组装，Direct Mode 传给 taozi:image）：
```
<角色锚点，如有：character 描述原文, consistent character design throughout.>
<article_type 场景主视觉，10词英文，聚焦1个主体>
Xiaohongshu cover card design, sparse layout, one prominent visual element,
Include large bold title text in Simplified Chinese: "<文章标题，最多20字>",
<Style Anchor 全文>,
3:4 portrait, high quality
```

示例（knowledge 类型，无角色）：
```
Flat vector illustration of a glowing laptop with colorful app icons,
Xiaohongshu cover card design, sparse layout, one prominent visual element,
Include large bold title text in Simplified Chinese: "5款AI工具测评",
art style: flat vector illustration, color palette: macaron (soft pink lavender mint peach cream), consistent visual DNA,
3:4 portrait, high quality
```

调用 `taozi:image`（Direct Mode，传完整 prompt + aspectRatio: 3:4）。
等待完成，保存到 `xiaohongshu/images/<YYYYMMDD>-<title_slug>/cover.jpg`。

## 步骤 3：并行生成内容图（最多 7 张）

**内容图也是带文字的图文卡，每张对应一个章节要点。**

每张内容图 prompt 结构（自行组装，Direct Mode 传给 taozi:image）：
```
<角色锚点，如有：character 描述原文, consistent character design throughout.>
<该节场景描述，10词英文>
Xiaohongshu content card design, <balanced/dense/list/flow> layout,
Include section key text in Simplified Chinese: "<该节标题或核心要点，15字内>",
[Style Anchor 全文], same visual DNA as the cover, consistent art style,
3:4 portrait, high quality
```

同时调用 `taozi:image`（Direct Mode）为每张内容图生成，等全部完成后保存到 `xiaohongshu/images/<YYYYMMDD>-<title_slug>/image-<n>.jpg`。

## 步骤 4：用 PushNotification 通知用户

调用 PushNotification，内容：
"✅ 小红书配图已生成！\n共 {total_count} 张图片\n保存至：xiaohongshu/images/<YYYYMMDD>-<title_slug>/\n\n可用 /taozi:image 重新生成某张图，或告诉我换个风格重新生成全套。"
```

### 配图数量建议

| 内容类型 | 图片数 | 比例 |
|---------|--------|------|
| 种草/分享 | 6-9 张 | 1:1 |
| 教程/清单 | 3-6 张 | 1:1 |
| 视觉优先 | 3-5 张 | 9:16（封面）+ 1:1 |

## 第五步：主 agent 等待用户

文案已在第四步展示，主 agent 询问用户：
```
需要调整文案、换个标题，还是现在等图片完成？
```

## 错误处理

| 情况 | 处理 |
|------|------|
| YOUMIND_API_KEY 未配置 | 停止，提示 /taozi:setup |
| 研究超时 | 跳过研究，仅基于主题生成内容 |
| 图片生成失败 | 保留 prompt，提示手动调用 /taozi:image |
| 402 额度不足 | 告知升级套餐 |
