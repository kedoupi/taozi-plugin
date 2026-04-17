---
name: image
description: AI 图片生成。根据描述生成图片，支持自动/手动选择模型、多种比例。需要 YOUMIND_API_KEY 环境变量。
triggers: "生成图片,画一张,做张图,配图,生图,图片生成,AI 生图,generate image,create image,make image"
allowed-tools:
  - Bash([ -n "$YOUMIND_API_KEY" ]*)
---

# AI 图片生成

主 agent 只负责三件事：**环境检查 → 理解意图 → 派 Agent**。
所有 YouMind API 调用全部在子 Agent 内完成，主对话始终不阻塞。

---

## 第一步：检查环境

```bash
[ -n "$YOUMIND_API_KEY" ] && echo "已配置" || echo "未配置"
```

未配置时告知用户设置 `YOUMIND_API_KEY=sk-ym-xxx`，停止执行。

---

## 第二步：确定三个参数

从用户描述中提取，这三个参数将传给子 Agent：

### prompt（增强后）

按 **主体 + 背景/上下文 + 风格修饰** 结构扩展，聚焦 3-5 个核心元素，不要堆砌过多细节。

#### 各类型开头与关键词

| 内容类型 | 开头格式 | 推荐风格关键词 |
|---------|---------|--------------|
| 写实/摄影 | "A photo of..." | golden hour, depth of field, bokeh, 4K HDR, studio lighting |
| 数据图/信息图 | "An infographic of..." | clean lines, flat design, isometric, professional design |
| 插画/创意 | "A digital art of..." | highly detailed, vibrant colors, concept art |
| 国风/水墨 | "A traditional Chinese ink wash painting of..." | ink style, 工笔, 写意, Song Dynasty style, misty mountains |
| 动漫/日式 | "An anime illustration of..." | Studio Ghibli style / chibi style / cel-shaded / Makoto Shinkai style |
| 商业海报 | "A minimalist poster of..." | bold typography, solid background, clean composition |

#### 质量修饰词规则
- **最多 2-3 个**，超量反而导致画面浑浊
- 照片类：`4K HDR`、`by a professional photographer`
- 艺术类：`ultra-detailed`、`masterpiece`
- 通用：`high-quality`、`beautiful`

#### 文字入图规则
- 文字内容**限制 25 字符以内**
- 最多 2-3 个独立短语，不要长句
- 例：标题 "7000亿宠物经济" + 副标题 "铲屎官的隐形市场"

图片中如需出现文字，默认使用简体中文，非必要不使用其他语言。

### model（自动路由 or 手动）

**自动路由**（默认）：

| 内容类型 | 判断依据 | 模型（各厂旗舰） |
|---------|---------|----------------|
| 真实感/写真/产品/数据报告 | 真人、产品、写真、摄影、图表、数据 | `gemini-3-pro-image-preview` |
| 国风/新中式/古风/中式美学 | 国风、新中式、古风、水墨、汉服、国潮 | `doubao-seedream-4-5-251128` |
| 插画/卡通/动漫/日式漫画 | 插画、卡通、动漫、二次元、手绘、Q版、漫画 | `gemini-3-pro-image-preview` |
| 通用/其他 | 以上都不符合 | `gemini-3-pro-image-preview` |

告知用户选了哪个模型和原因。

**手动选择**（用户说"让我选"时展示）：

```
1. Gemini 3 Pro Image      — Google 旗舰，写实/插画/创意设计全能
2. Seedream                — 字节旗舰，国风/中式美学最强
3. Qwen Image 2.0 Pro      — 阿里旗舰，中文场景理解好
4. 自动选择（根据内容推荐最合适的）
```

| 选项 | model 参数值 |
|------|------------|
| Gemini 3 Pro Image | `gemini-3-pro-image-preview` |
| Seedream | `doubao-seedream-4-5-251128` |
| Qwen Image 2.0 Pro | `qwen-image-2.0-pro` |
| 自动 | 走自动路由规则 |

### ratio（比例）

所有模型统一使用 `aspectRatio` 参数：

| 用户意图 | aspectRatio |
|---------|------------|
| 小红书封面/竖图 | `3:4` |
| 小红书正方形 | `1:1` |
| 公众号封面/横图 | `16:9` |
| 抖音/视频号封面 | `9:16` |
| 未说明 | `1:1` |

---

## 第三步：立刻派 Agent

**⚠️ 三个参数确认后立刻派 Agent，不要自己调用任何 YouMind API。**

告知用户：
> 已开始生成，1-3 分钟后告诉你结果，可以继续问我其他问题。

用 Agent 工具，传入以下 prompt（替换实际值）：

---

**Agent prompt 模板：**

```
你是一个图片生成执行 agent，完整负责以下任务，不需要询问，直接执行。

## 参数
- prompt: <增强后的描述>
- model: <模型ID>
- aspectRatio: <比例，如 3:4 / 1:1 / 16:9 / 9:16>
- quality: high
- 语言: 图片中如需出现文字，默认使用简体中文，非必要不使用其他语言

## 执行步骤

### 步骤 1：安装 CLI（如未安装）
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

### 步骤 2：获取 Board ID
youmind call getDefaultBoard
取返回值的 id 字段作为 boardId。

### 步骤 3：发起生图
youmind call createChat '{"boardId":"<boardId>","message":"<prompt>","tools":{"imageGenerate":{"useTool":"required","aspectRatio":"<aspectRatio>","quality":"high","model":"<model>"}}}'

取返回值的 id 作为 chatId。
如果超时未返回，执行：youmind call listChats '{"boardId":"<boardId>","pageSize":3}'，取最新一条的 id。

### 步骤 4：轮询
每 5 秒执行：youmind call getChat '{"chatId":"<chatId>"}'
- status 为 completed → 执行步骤 5
- 超过 300 秒未完成 → 返回 TIMEOUT

### 步骤 5：提取图片
youmind call listMessages '{"chatId":"<chatId>","pageSize":20}'
用 python3 提取 toolName == image_generate 的 block：

python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d if isinstance(d, list) else d.get('items', d.get('messages', []))
for m in items:
    for b in (m.get('blocks') or []):
        if b.get('type') == 'tool' and b.get('toolName') == 'image_generate':
            r = b.get('toolResult') or {}
            urls = r.get('original_image_urls') or r.get('image_urls') or []
            print(r.get('width'), r.get('height'))
            for u in urls: print(u)
"

### 步骤 6：返回结果
格式：
IMAGE_DONE
尺寸: <width>x<height>
原图: <url>
```

---

**批量生图（风格统一）**：

生成多张系列图时，主 Agent 必须先定义 **Series Style Anchor**，再派子 Agent。

#### Step A：生成 Style Anchor

在所有子 Agent 启动前，主 Agent 输出一段风格锚字符串，例如：

```
[Style Anchor]
art style: clean flat design illustration
color palette: warm orange, cream white, soft coral accents
character: consistent proportions and line weight throughout
outline: thick black outline, flat color fills, soft drop shadow
typography: bold simplified Chinese, clean sans-serif
```

Style Anchor 根据用户意图生成，不同系列有不同风格。

#### Step B：每个子 Agent 的 prompt = 内容描述 + Style Anchor

```
<该张图的具体内容描述>, [Style Anchor 全文], same art style as the series
```

所有图共享同一段视觉 DNA，确保风格统一。

---

## 第四步：展示结果

收到 Agent 返回的 `IMAGE_DONE` 后：
- 展示图片链接（原图 + 压缩版）
- 说明使用的模型和比例
- 询问：需要调整风格、换比例、换模型，还是再生成一张？

---

## 错误处理

| 情况 | 处理 |
|------|------|
| `YOUMIND_API_KEY` 未配置 | 停止，提示配置 |
| Agent 返回 TIMEOUT | 告知用户去 YouMind Board 查看 |
| 无图片结果 | 建议换描述或换模型重试 |
| 用户不满意 | 继承上次 prompt，询问改哪里，派新 Agent 重新生成 |
| 402 额度不足 | 告知升级套餐 |
