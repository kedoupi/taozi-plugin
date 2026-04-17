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

## 第四步：AI 配图生成

### 风格预设表

| 预设名 | 适用场景 | 画风关键词 |
|--------|---------|-----------|
| `cute-share`（默认）| 少女风种草、日常分享 | soft pastel, kawaii, warm light |
| `knowledge-card` | 干货知识、技术科普 | clean flat design, minimal, professional |
| `product-review` | 产品测评、对比 | fresh, bright, detailed product photography |
| `lifestyle` | 生活方式、美食、旅行 | warm golden hour, editorial, moody |
| `bold-info` | 避坑指南、重要提醒 | high contrast, bold typography, vivid colors |
| `sketch-edu` | 手绘教程、流程图解 | hand-drawn, sketch style, warm tones |

`auto` 时根据内容策略自动匹配：`story` → `lifestyle`，`info` → `knowledge-card`，`visual` → `cute-share`。

### 生成流程

1. 生成封面图（1:1，1080×1080），`youmind call generateImage`
2. 保存封面图路径，将其作为后续图片的 `--ref`（视觉一致性）
3. 并行生成其余配图（最多 7 张，比例 1:1 或 9:16）
4. 图片保存至 `xiaohongshu/images/YYYYMMDD/`

### 配图数量建议

| 内容类型 | 图片数 | 比例 |
|---------|--------|------|
| 种草/分享 | 6-9 张 | 1:1 |
| 教程/清单 | 3-6 张 | 1:1 |
| 视觉优先 | 3-5 张 | 9:16（封面）+ 1:1 |

## 第五步：输出汇总

展示完整内容包：

```
✅ 小红书内容已生成
标题：...
正文：[内容预览]
话题标签：...
图片：[图片路径列表，共 N 张]
```

提示可调用 `/taozi:image` 重新生成某张图，或调整风格重新生成全套。

## 错误处理

| 情况 | 处理 |
|------|------|
| YOUMIND_API_KEY 未配置 | 停止，提示 /taozi:setup |
| 研究超时 | 跳过研究，仅基于主题生成内容 |
| 图片生成失败 | 保留 prompt，提示手动调用 /taozi:image |
| 402 额度不足 | 告知升级套餐 |
