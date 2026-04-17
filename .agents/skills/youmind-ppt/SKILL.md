---
name: youmind-ppt
description: AI PPT 生成。输入主题或内容，自动生成专业幻灯片，支持选择比例和质量。需要 YOUMIND_API_KEY 环境变量。
triggers: "做个PPT,生成PPT,做幻灯片,做演示文稿,做个slides,转成PPT,文章转PPT,make slides,create presentation,generate ppt"
allowed-tools:
  - Bash([ -n "$YOUMIND_API_KEY" ]*)
---

# AI PPT 生成

主 agent 只负责三件事：**环境检查 → 理解意图 → 派 Agent**。
所有 YouMind API 调用全部在子 Agent 内完成。

---

## 第一步：检查环境

```bash
[ -n "$YOUMIND_API_KEY" ] && echo "已配置" || echo "未配置"
```

未配置时告知用户设置 `YOUMIND_API_KEY=sk-ym-xxx`，停止执行。

---

## 第二步：确定参数

从用户描述中提取：

### prompt（PPT 主题/内容）

清晰描述要做的 PPT，包含：
- 主题是什么
- 需要覆盖哪些内容/章节
- 目标受众（可选）
- 风格要求（商务/简约/创意等，未说明默认商务）

如果用户提供的是一篇文章或研究报告，说明"将以下内容做成 PPT"并附上内容。

### aspectRatio（比例）

| 用户说 | aspectRatio |
|--------|------------|
| 宽屏、横版、普通 PPT | `16:9`（默认） |
| 竖版、手机、社交媒体 | `9:16` |
| 传统、4:3 | `4:3` |
| 未说明 | `16:9` |

### quality

默认使用 `high`，用户说"快速"或"草稿"时用 `medium`。

---

## 第三步：立刻派 Agent

**⚠️ 参数确认后立刻派 Agent，不要自己调用任何 YouMind API。**

告知用户：
> 已开始生成 PPT，约 3-5 分钟后告诉你结果，可以继续问我其他问题。

用 Agent 工具，传入以下 prompt（替换实际值）：

---

**Agent prompt 模板：**

```
你是一个 PPT 生成执行 agent，完整负责以下任务，不需要询问，直接执行。

## 参数
- prompt: <PPT 主题和内容描述>
- aspectRatio: <16:9 / 9:16 / 4:3>
- quality: high

## 执行步骤

### 步骤 1：安装 CLI（如未安装）
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

### 步骤 2：获取 Board ID
youmind call getDefaultBoard
取返回值的 id 字段作为 boardId。

### 步骤 3：发起 PPT 生成
youmind call createChat '{"boardId":"<boardId>","message":"<prompt>","tools":{"slidesGenerate":{"useTool":"required","quality":"high","aspectRatio":"<aspectRatio>"}}}'

取返回值的 id 作为 chatId。
如果超时未返回，执行：youmind call listChats '{"boardId":"<boardId>","pageSize":3}'，取最新一条的 id。

### 步骤 4：轮询（每 10 秒，最多 300 秒）
youmind call getChat '{"chatId":"<chatId>"}'
- status 为 completed → 执行步骤 5
- 超过 300 秒 → 返回 TIMEOUT

### 步骤 5：提取结果
youmind call listMessages '{"chatId":"<chatId>","pageSize":20}' | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d if isinstance(d, list) else d.get('items', d.get('messages', []))
craft_id = None
total_slides = 0
slide_urls = []
for m in items:
    for b in (m.get('blocks') or []):
        tr = b.get('toolResult') or {}
        tname = b.get('toolName', '')
        if tname == 'slides_compose':
            craft_id = tr.get('craftId', '')
            total_slides = tr.get('totalSegments', 0)
            print(f'craftId: {craft_id}')
            print(f'totalSlides: {total_slides}')
        if tname == 'slides_generate':
            for s in (tr.get('slides') or []):
                url = s.get('imageUrl', '')
                if url:
                    slide_urls.append(url)
for i, u in enumerate(slide_urls[:3]):
    print(f'slide_{i+1}: {u}')
"

### 步骤 6：返回结果
PPT_DONE
总页数: <totalSlides>
craftId: <craftId>
封面预览: <第一张 slide URL>
```

---

## 第四步：展示结果

收到 Agent 返回的 `PPT_DONE` 后：

```
✅ PPT 生成完成

主题：<prompt 摘要>
页数：<totalSlides> 页
比例：<aspectRatio>

封面预览：<封面图片 URL>

PPT 已保存到你的 YouMind Board，可以在 YouMind 中直接查看和编辑。

需要调整内容、换风格，还是基于这个主题生成配套的小红书/公众号文章？
```

---

## 错误处理

| 情况 | 处理 |
|------|------|
| `YOUMIND_API_KEY` 未配置 | 停止，提示配置 |
| Agent 返回 TIMEOUT | 告知用户去 YouMind Board 查看，生成可能仍在进行 |
| 生成失败 | 建议换更简洁的描述重试 |
| 402 额度不足 | 告知升级套餐 |
