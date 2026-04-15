---
name: images
description: AI 图片生成 — 描述你要的图，自动选模型、比例、并行生成
argument-hint: <图片描述，用自然语言说清楚你想要什么>
allowed-tools:
  - Bash([ -n "$YOUMIND_API_KEY" ]*)
---

# AI 图片生成

根据 `$ARGUMENTS` 生成图片。主 agent 只负责理解意图和派发任务，所有生成工作由子 Agent 完成。

## 第一步：环境检查

```bash
[ -n "$YOUMIND_API_KEY" ] && echo "ok" || echo "missing"
```

未配置时告知用户设置 `YOUMIND_API_KEY=sk-ym-xxx`，停止执行。

---

## 第二步：从 $ARGUMENTS 解析意图

从用户的自然语言描述中提取以下信息：

### 数量（count）

| 用户说 | 数量 |
|--------|------|
| "生成3张"、"来3个"、"三张" | 3 |
| "两张"、"2张"、"对比一下" | 2 |
| 未提及数量 | 1 |

默认 1 张。最多 5 张。

### 平台与比例

所有模型统一使用 `aspectRatio` 参数：

| 用户说 | aspectRatio |
|--------|------------|
| 小红书、种草、笔记 | `3:4` |
| 公众号、推文、文章封面 | `16:9` |
| 抖音、视频号、短视频封面 | `9:16` |
| X、推特 | `16:9` |
| 未提及平台 | `1:1` |

### 模型自动路由

分析描述内容，选各厂旗舰：

| 内容特征 | 模型 |
|---------|------|
| 真人、产品、写真、摄影感、数据图表、商业海报 | `gemini-3-pro-image-preview` |
| 国风、新中式、古风、水墨、汉服、国潮 | `doubao-seedream-4-5-251128` |
| 插画、卡通、动漫、二次元、日式、漫画、手绘 | `gemini-3-pro-image-preview` |
| 其他/通用 | `gemini-3-pro-image-preview` |

告知用户：选了哪个模型、什么比例、生成几张，以及原因。

### Prompt 增强

按 **主体 + 背景/上下文 + 风格修饰** 结构扩展，聚焦 3-5 个核心元素。

各类型开头与推荐关键词：

| 内容类型 | 开头格式 | 推荐关键词 |
|---------|---------|-----------|
| 写实/摄影 | "A photo of..." | golden hour, bokeh, depth of field, 4K HDR |
| 数据图/信息图 | "An infographic of..." | clean lines, flat design, isometric |
| 国风/水墨 | "A traditional Chinese ink wash painting of..." | ink style, 写意, Song Dynasty style |
| 动漫/日式 | "An anime illustration of..." | chibi style, Studio Ghibli style, cel-shaded |
| 商业海报 | "A minimalist poster of..." | bold typography, clean composition |

规则：
- 质量修饰词**最多 2-3 个**（超量反而画面浑浊）
- 图片文字**限制 25 字符**以内，最多 2-3 个短语
- 如需多张，每张生成略有差异的 prompt 变体
- 图片中如需出现文字，默认使用简体中文，非必要不使用其他语言

---

## 第三步：派 Agent（并行）

**⚠️ 所有 Agent 同时启动，不要串行等待。**

每张图对应一个独立 Agent，传入以下 prompt（替换实际值）：

```
你是图片生成执行 agent，直接执行以下任务，无需询问。

prompt: <增强后的描述>
model: <模型ID>
aspectRatio: <比例，如 3:4 / 1:1 / 16:9 / 9:16>
quality: high

步骤：

1. 安装检查
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

2. 获取 Board ID
youmind call getDefaultBoard
取 id 字段。

3. 发起生图
youmind call createChat '{"boardId":"<id>","message":"<prompt>","tools":{"imageGenerate":{"useTool":"required","aspectRatio":"<aspectRatio>","quality":"high","model":"<model>"}}}'

取返回 id 作为 chatId。超时未返回则执行：
youmind call listChats '{"boardId":"<id>","pageSize":3}'，取最新一条 id。

4. 轮询（每 5 秒，最多 300 秒）
youmind call getChat '{"chatId":"<chatId>"}'
status=completed 进入步骤 5，超时返回 TIMEOUT。

5. 提取结果
youmind call listMessages '{"chatId":"<chatId>","pageSize":20}' | python3 -c "
import sys,json
d=json.load(sys.stdin)
items=d if isinstance(d,list) else d.get('items',d.get('messages',[]))
for m in items:
  for b in (m.get('blocks') or []):
    if b.get('type')=='tool' and b.get('toolName')=='image_generate':
      r=b.get('toolResult') or {}
      urls=r.get('original_image_urls') or r.get('image_urls') or []
      print(str(r.get('width'))+'x'+str(r.get('height')))
      for u in urls: print(u)
"

6. 返回
IMAGE_DONE
尺寸: <width>x<height>
链接: <url>
```

---

## 第四步：汇总展示

收到所有 Agent 的 `IMAGE_DONE` 后统一展示：

```
✅ 生成完成（共 N 张）

图1 · <模型> · <尺寸>
<链接>

图2 · <模型> · <尺寸>
<链接>
```

询问用户：
> 满意哪张？需要调整风格、换比例，还是基于某张继续生成变体？

---

## 错误处理

| 情况 | 处理 |
|------|------|
| API Key 未配置 | 停止并提示配置 |
| 某个 Agent TIMEOUT | 展示其他成功结果，标注哪张超时 |
| 全部失败 | 建议换描述或检查网络 |
| 402 额度不足 | 告知升级套餐 |
