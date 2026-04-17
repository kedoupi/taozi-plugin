---
name: clip
description: 内容采集与分析。输入任意 URL（YouTube 视频、微信公众号文章、网页），自动导入 YouMind 并用 AI 深度分析内容结构、核心观点和可借鉴点，为内容创作提供灵感和素材。需要 YOUMIND_API_KEY 环境变量。
triggers: "分析这个,帮我看看这篇,采集,导入,分析这篇文章,分析这个视频,看看这个链接,借鉴,帮我拆解,clip,analyze url"
allowed-tools:
  - Bash([ -n "$YOUMIND_API_KEY" ]*)
---

# 内容采集与分析

主 agent 只负责三件事：**环境检查 → 理解意图 → 派 Agent**。
所有 YouMind API 调用全部在子 Agent 内完成。

---

## 第一步：检查环境

```bash
[ -n "$YOUMIND_API_KEY" ] && echo "已配置" || echo "未配置"
```

未配置时告知用户设置 `YOUMIND_API_KEY=sk-ym-xxx`，停止执行。

---

## 第二步：提取参数

从用户描述中提取：

### URL
用户提供的链接。支持：
- YouTube 视频（youtube.com / youtu.be）
- 微信公众号文章（mp.weixin.qq.com）
- 普通网页文章（博客、新闻等公开页面）

**已知不支持（需登录）：** 知乎专栏、小红书、需要登录的付费内容。
如遇到不支持的 URL，告知用户并建议换一个。

### 分析目的（从上下文理解）

| 用户说 | 分析重点 |
|--------|---------|
| "拆解一下"、"学学它的套路" | 内容结构 + 标题技巧 + 写作手法 |
| "帮我做一篇类似的" | 核心观点 + 内容框架 + 差异化角度 |
| "看看有没有可以用的" | 关键数据 + 可引用观点 + 内容灵感 |
| 未说明 | 全面分析（结构 + 观点 + 可借鉴点） |

---

## 第三步：立刻派 Agent

**⚠️ 参数确认后立刻派 Agent，不要自己调用任何 YouMind API。**

告知用户：
> 正在导入并分析内容，1-2 分钟后告诉你结果。

用 Agent 工具，传入以下 prompt（替换实际值）：

---

**Agent prompt 模板：**

```
你是一个内容采集分析 agent，完整负责以下任务，不需要询问，直接执行。

## 参数
- url: <用户提供的 URL>
- 分析目的: <结构分析 / 内容借鉴 / 全面分析>

## 执行步骤

### 步骤 1：安装 CLI（如未安装）
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

### 步骤 2：获取 Board ID
youmind call getDefaultBoard
取返回值的 id 字段作为 boardId。

### 步骤 3：导入 URL
youmind call createMaterialByUrl '{"url":"<url>","boardId":"<boardId>"}'
取返回值的 id 字段作为 materialId。

如果返回错误（如 fetch-failed、URL 不支持等），直接返回：
CLIP_FAIL
原因: <错误信息>

### 步骤 4：等待解析完成（最多 60 秒）
每 5 秒执行：youmind call getMaterial '{"id":"<materialId>","includeBlocks":true}'
- type 不为 null 且不为 unknown-webpage → 解析完成，进入步骤 5
- status 字段为 fetching → 继续等待
- 超过 60 秒仍未完成 → 进入步骤 5（YouMind 可能仍在后台解析，继续尝试）
记录返回值的 title 字段作为 materialTitle，用于步骤 5 锚定素材。

### 步骤 5：用 createChat + atReferences 做分析
**⚠️ message 必须以素材标题开头，避免 AI 与 Board 中其他素材混淆。**

youmind call createChat '{"boardId":"<boardId>","message":"<分析提示词>","atReferences":[{"$class":"AtReferenceMaterialDto","id":"<materialId>"}]}'

分析提示词根据分析目的选择（每条都以「标题为《<materialTitle>》的内容」开头）：
- 结构分析："标题为《<materialTitle>》的这篇内容，请深度分析：1. 标题用了什么技巧吸引点击？2. 内容结构是什么套路？3. 开头/中间/结尾各怎么写的？4. 有哪些可以直接复用的写作手法？"
- 内容借鉴："标题为《<materialTitle>》的这篇内容，请分析：1. 核心观点和论据是什么？2. 内容框架和逻辑结构？3. 我可以从哪些角度做一篇更好的内容？4. 给我 3 个差异化选题方向。"
- 全面分析（默认）："标题为《<materialTitle>》的这篇内容，请全面分析：1. 主题和核心观点 2. 内容结构和写作套路 3. 标题和钩子技巧 4. 数据和案例亮点 5. 对内容创作者最有价值的借鉴点"

取返回值的 id 作为 chatId。

### 步骤 6：提取分析结果
youmind call listMessages '{"chatId":"<chatId>","pageSize":20}' | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d if isinstance(d, list) else d.get('items', d.get('messages', []))
for m in items:
    if m.get('role') == 'assistant':
        for b in (m.get('blocks') or []):
            if b.get('type') == 'text':
                print(b.get('text', ''))
"

### 步骤 7：返回结果
CLIP_DONE
素材类型: <video / article / webpage>
标题: <内容标题>
分析报告:
<完整分析内容>
```

---

## 第四步：展示结果 + 引导下一步

收到 Agent 返回的 `CLIP_DONE` 后，整理展示：

```
## 内容分析：<标题>

<分析报告正文>

---
接下来你可以：
- 说"帮我写一篇类似的小红书" → 直接生成内容
- 说"帮我做成公众号文章" → 生成对应平台版本
- 说"帮我生一张配图" → 基于这个内容风格生图
```

---

## 错误处理

| 情况 | 处理 |
|------|------|
| `YOUMIND_API_KEY` 未配置 | 停止，提示配置 |
| URL 需要登录（知乎、小红书等） | 告知不支持，建议换公开 URL |
| Agent 返回 CLIP_FAIL | 告知用户 URL 无法解析，建议换一个 |
| 分析超时 | 告知用户去 YouMind Board 查看导入的素材 |
| 402 额度不足 | 告知升级套餐 |
