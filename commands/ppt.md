---
name: ppt
description: AI PPT 生成 — 输入主题或内容，生成专业幻灯片，保存到 YouMind Board
argument-hint: <PPT 主题，可指定比例，如"帮我做一个关于AI内容创作的PPT，横版16:9">
allowed-tools:
  - Bash([ -n "$YOUMIND_API_KEY" ]*)
---

# AI PPT 生成

根据 `$ARGUMENTS` 生成 PPT。

## 第一步：环境检查

```bash
[ -n "$YOUMIND_API_KEY" ] && echo "ok" || echo "missing"
```

未配置时告知用户设置 `YOUMIND_API_KEY=sk-ym-xxx`，停止执行。

---

## 第二步：解析参数

从 `$ARGUMENTS` 中提取：

- **主题/内容**：要做成 PPT 的内容描述
- **比例**：16:9（默认横版）/ 9:16（竖版）/ 4:3（传统）
- **质量**：high（默认）/ medium（快速草稿）

---

## 第三步：派 Agent

告知用户：
> 已开始生成 PPT，约 3-5 分钟后告诉你结果。

```
你是 PPT 生成执行 agent，直接执行以下任务，无需询问。

prompt: <主题和内容描述>
aspectRatio: <16:9 / 9:16 / 4:3>
quality: high

步骤：

1. 安装检查
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

2. 获取 Board ID
youmind call getDefaultBoard
取 id 字段。

3. 发起生成
youmind call createChat '{"boardId":"<id>","message":"<prompt>","tools":{"slidesGenerate":{"useTool":"required","quality":"high","aspectRatio":"<aspectRatio>"}}}'
取返回 id 作为 chatId。超时则执行：youmind call listChats '{"boardId":"<id>","pageSize":3}'，取最新一条 id。

4. 轮询（每 10 秒，最多 300 秒）
youmind call getChat '{"chatId":"<chatId>"}'
status=completed 进入步骤 5，超时返回 TIMEOUT。

5. 提取结果
youmind call listMessages '{"chatId":"<chatId>","pageSize":20}' | python3 -c "
import sys,json
d=json.load(sys.stdin)
items=d if isinstance(d,list) else d.get('items',d.get('messages',[]))
for m in items:
  for b in (m.get('blocks') or []):
    tr=b.get('toolResult') or {}
    tname=b.get('toolName','')
    if tname=='slides_compose':
      print('craftId:',tr.get('craftId',''))
      print('totalSlides:',tr.get('totalSegments',0))
    if tname=='slides_generate':
      slides=tr.get('slides') or []
      if slides: print('cover:',slides[0].get('imageUrl',''))
"

6. 返回
PPT_DONE
总页数: <totalSlides>
craftId: <craftId>
封面: <封面图片 URL>
```

---

## 第四步：展示结果

收到 `PPT_DONE` 后展示：

```
✅ PPT 生成完成

页数：<N> 页 · 比例：<aspectRatio>
封面预览：<封面 URL>

PPT 已保存到 YouMind Board，可直接在 YouMind 中查看编辑。

需要调整内容、换风格，还是生成配套文章或图片？
```

---

## 错误处理

| 情况 | 处理 |
|------|------|
| API Key 未配置 | 停止并提示配置 |
| TIMEOUT | 告知去 YouMind Board 查看，可能仍在生成 |
| 402 额度不足 | 告知升级套餐 |
