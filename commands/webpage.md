---
name: webpage
description: AI 网页生成 — 输入主题或内容，生成可直接分享的美观网页，返回访问链接
argument-hint: <网页内容描述，如"帮我做一个AI工具介绍页面，蓝色科技风">
allowed-tools:
  - Bash([ -n "$YOUMIND_API_KEY" ]*)
---

# AI 网页生成

根据 `$ARGUMENTS` 生成网页。

## 第一步：环境检查

```bash
[ -n "$YOUMIND_API_KEY" ] && echo "ok" || echo "missing"
```

未配置时告知用户设置 `YOUMIND_API_KEY=sk-ym-xxx`，停止执行。

---

## 第二步：解析参数

从 `$ARGUMENTS` 中提取网页的主题、内容、风格要求。

常见场景：
- 项目/产品介绍页
- 文章/研究报告转网页
- 活动/课程介绍页
- 个人/团队展示页

---

## 第三步：派 Agent

告知用户：
> 已开始生成网页，约 2-3 分钟后给你一个可访问的链接。

```
你是网页生成执行 agent，直接执行以下任务，无需询问。

prompt: <网页内容描述>

步骤：

1. 安装检查
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

2. 获取 Board ID
youmind call getDefaultBoard
取 id 字段。

3. 发起生成
youmind call createChat '{"boardId":"<id>","message":"<prompt>","tools":{"generateWebpage":{"useTool":"required"}}}'
取返回 id 作为 chatId。超时则执行：youmind call listChats '{"boardId":"<id>","pageSize":3}'，取最新一条 id。

4. 轮询（每 5 秒，最多 180 秒）
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
    if b.get('toolName','')=='generate_webpage':
      print('url:',tr.get('cdn_url',''))
      wp=tr.get('webpage') or {}
      print('title:',wp.get('title',''))
"

6. 返回
WEBPAGE_DONE
url: <cdn_url>
title: <网页标题>
```

---

## 第四步：展示结果

收到 `WEBPAGE_DONE` 后展示：

```
✅ 网页生成完成

🔗 <url>

可直接分享给他人访问。需要调整内容、换风格，还是生成配套 PPT 或文章？
```

---

## 错误处理

| 情况 | 处理 |
|------|------|
| API Key 未配置 | 停止并提示配置 |
| TIMEOUT | 建议换更简洁的描述重试 |
| 402 额度不足 | 告知升级套餐 |
