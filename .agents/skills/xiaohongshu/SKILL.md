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
---

# Xiaohongshu

根据 `$ARGUMENTS` 完成从选题到配图的小红书内容全链路。

## 第一步：环境检查

用 `[ -d "$HOME/.taozi" ]` 检查配置目录。

读取 `~/.taozi/config.yaml`，提取 `youmind.api_key`。

**缺失时**：停止并提示运行 `/taozi:setup`。

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

## 第四步：风格选择 + 展示文案 + 后台配图

### 步骤 1：分析内容 → 推荐风格方案

读取 `skills/xiaohongshu/references/xhs-card-styles.md` 的**智能推荐规则**，根据文章内容类型（种草/干货/测评/学习笔记/热点等）推荐 **2-3 个** style + layout 组合，每个组合附简短理由。

示例推荐输出：
```
推荐方案：
A. 🌸 cute × balanced（甜美卡片，适合种草分享，视觉温暖）
B. 📋 notion × dense（知识卡片，适合干货输出，信息密度高）
C. ✏️ sketch-notes × flow（手绘流程，适合步骤梳理，有趣易读）
```

### 步骤 2：立即展示文案 + Smart Confirm

**立即**向用户展示文案 + 风格推荐（无需等图片）：

```
✅ 小红书内容已生成！

【标题】<title>
【正文】<正文预览，前 150 字>...
【话题标签】<标签列表>

🎨 推荐配图风格（选一个，或告诉我你想要的风格）：

A. 🌸 cute × balanced — <理由，10字以内>
B. 📋 notion × dense — <理由，10字以内>
C. ✏️ sketch-notes × flow — <理由，10字以内>

直接回复 A/B/C，或说「用 xxx 风格 + xxx 布局」自定义
（回复「帮我选」则直接用 A 方案）
```

等待用户确认后进入步骤 3。若用户说「帮我选」或不回复风格偏好，默认 A 方案。

### 步骤 3：后台启动配图 sub-agent（`run_in_background: true`）

确认 style + layout 后，将所有参数传入配图 sub-agent，以 `run_in_background: true` 派出，立即告知：
> "好！已开始后台生成 <N> 张 {style} × {layout} 风格配图，约 3-5 分钟后通知你。"

---

### 可选风格速查（完整列表见 `references/xhs-card-styles.md`）

**12 种风格**：`cute`（甜美）/ `fresh`（清新）/ `warm`（温暖）/ `bold`（高冲击）/ `minimal`（极简）/ `retro`（复古）/ `pop`（活力 Y2K）/ `notion`（极简知识）/ `chalkboard`（黑板粉笔）/ `study-notes`（手写笔记）/ `screen-print`（丝网印刷）/ `sketch-notes`（手绘信息图）

**8 种布局**：`sparse`（金句封面）/ `balanced`（常规）/ `dense`（知识卡片）/ `list`（清单）/ `comparison`（对比）/ `flow`（流程）/ `mindmap`（思维导图）/ `quadrant`（四象限）

**3 种配色**（可追加）：`macaron` / `warm` / `neon`

---

### 后台 sub-agent 指令

```
你是小红书配图生成 agent。完成所有图片后用 PushNotification 通知用户。

## 参数
- style: <确认的风格名，如 cute>
- layout: <确认的布局名，如 balanced>
- palette: <配色方案，如 macaron，可选>
- content_outline: <文章标题 + 各图核心要点列表>
- cover_prompt: <第三步生成的封面 prompt>
- image_prompts: [<配图 prompt 1>, <配图 prompt 2>, ...]
- output_dir: xiaohongshu/images/<YYYYMMDD>/
- total_count: <总图片数>

## Prompt 组装（每张图执行）

1. 读取 `skills/xiaohongshu/references/xhs-card-styles.md` 中对应 style 的 `## Style:` 定义（Color Palette + Visual Elements + Typography）
2. 读取对应 layout 的 `## Layout:` 定义（Structure + Best For）
3. 如有 palette，读取 `## 3 种配色方案` 中对应配色定义
4. 按 `## Prompt 组装模板` 将 {STYLE_SECTION} + {LAYOUT_SECTION} + {CONTENT_SECTION} 拼装完整 prompt

## 执行步骤

### 步骤 1：生成封面图（串行，建立视觉锚点）
按组装好的 prompt 生成封面：
youmind call generateImage '{"prompt":"<assembled_prompt>","width":1080,"height":1440}'
（getDefaultBoard → createChat → 每5秒 getChat 轮询，最长300秒 → listMessages 提取 URL）
下载到 xiaohongshu/images/<YYYYMMDD>/cover.jpg
**保存封面图 URL 作为所有后续图片的 --ref（视觉一致性链）。**

### 步骤 2：并行生成其余配图（reference chain）

目录预先创建：`mkdir -p xiaohongshu/images/<YYYYMMDD>/`

对每张内容图（最多 7 张，配图数 > 7 时取前 7），各派一个独立子 agent：
- 子 agent 同样按**步骤 1 的 prompt 组装方式**组装 prompt（相同 style+layout，不同 content section）
- 在 generateImage 调用中，将封面图 URL 作为 `--ref` 参数传入（保持视觉一致性链）
- 图片尺寸：1:1 → `{"width":1080,"height":1080}`，9:16 → `{"width":1080,"height":1920}`，默认 1:1
- 下载到 `xiaohongshu/images/<YYYYMMDD>/image-<n>.jpg`

同时派出所有子 agent，等全部完成后进入步骤 3。

### 步骤 3：用 PushNotification 通知用户

调用 PushNotification，内容：
"✅ 小红书配图已生成！\n风格：{style} × {layout}\n共 {total_count} 张图片\n保存至：xiaohongshu/images/<YYYYMMDD>/\n\n可用 /taozi:image 重新生成某张图，或告诉我换个风格重新生成全套。"
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
