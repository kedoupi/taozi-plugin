---
name: research
description: 热点研究与调研分析 — 搜索新闻、推特、财经、学术信息，输出结构化报告和内容创作建议
argument-hint: <研究主题，用自然语言描述想了解什么>
allowed-tools:
  - Bash([ -n "$YOUMIND_API_KEY" ]*)
---

# 热点研究

根据 `$ARGUMENTS` 执行研究任务。主 agent 只负责理解意图和派发任务。

## 第一步：环境检查

```bash
[ -n "$YOUMIND_API_KEY" ] && echo "ok" || echo "missing"
```

未配置时告知用户设置 `YOUMIND_API_KEY=sk-ym-xxx`，停止执行。

---

## 第二步：从 $ARGUMENTS 解析意图

### 研究深度

| 用户说 | 模式 | YouMind tool |
|--------|------|-------------|
| "快速"、"大概"、"扫一眼"、未说明 | 快速扫描 | `webSearch` |
| "深度"、"详细"、"全面"、"要有数据" | 深度研究 | `research` |

### 搜索类别自动路由

| 内容特征 | categories |
|---------|-----------|
| 时事、行业新闻、动态 | `["news"]` |
| 舆论、KOL 观点、社交讨论 | `["tweet"]` |
| 股价、市场数据、财经 | `["finance"]` |
| 学术论文、权威数据 | `["scholar"]` |
| 通用 / 未说明 | `["news", "tweet"]` |

告知用户：选了哪种深度、搜索哪些类别、优化后的查询词。

---

## 第三步：派 Agent

每个研究任务对应一个独立 Agent。

**Agent prompt 模板（webSearch）：**

```
你是研究执行 agent，直接执行以下任务，无需询问。

query: <优化后的查询语句>
categories: <类别数组，如 ["news","tweet"]>
研究目的: <用户原始意图>

步骤：

1. 安装检查
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

2. 获取 Board ID
youmind call getDefaultBoard
取 id 字段。

3. 发起搜索
youmind call createChat '{"boardId":"<id>","message":"<query>","tools":{"webSearch":{"useTool":"required","categories":<categories>}}}'
取返回 id 作为 chatId。
超时未返回则执行：youmind call listChats '{"boardId":"<id>","pageSize":3}'，取最新一条 id。

4. 轮询（每 5 秒，最多 120 秒）
youmind call getChat '{"chatId":"<chatId>"}'
status=completed 进入步骤 5，超时返回 TIMEOUT。

5. 提取结果
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

6. 返回
RESEARCH_DONE
<完整研究内容>
```

**Agent prompt 模板（research 深度）：**

```
你是研究执行 agent，直接执行以下任务，无需询问。

query: <优化后的查询语句>
研究目的: <用户原始意图>

步骤：

1. 安装检查
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

2. 获取 Board ID
youmind call getDefaultBoard
取 id 字段。

3. 发起深度研究
youmind call createChat '{"boardId":"<id>","message":"<query>","tools":{"research":{"useTool":"required"}}}'
取返回 id 作为 chatId。
超时未返回则执行：youmind call listChats '{"boardId":"<id>","pageSize":3}'，取最新一条 id。

4. 轮询（每 10 秒，最多 300 秒）
youmind call getChat '{"chatId":"<chatId>"}'
status=completed 进入步骤 5，超时返回 TIMEOUT。

5. 提取结果
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

6. 返回
RESEARCH_DONE
<完整研究内容>
```

---

## 第四步：汇总展示

收到 `RESEARCH_DONE` 后整理为结构化报告：

```
## 研究报告：<主题>

### 核心发现
<3-5 个关键结论>

### 详细内容
<研究正文>

### 内容创作建议
- 适合平台：<平台推荐>
- 推荐角度：<2-3 个切入点>
- 热门话题标签：<#标签>
```

询问用户：
> 需要基于这份研究生成内容吗？直接说"帮我写小红书"或"做成公众号文章"即可。

---

## 错误处理

| 情况 | 处理 |
|------|------|
| API Key 未配置 | 停止并提示配置 |
| Agent TIMEOUT | 建议换更具体的查询词重试 |
| 无内容返回 | 建议换查询词或切换搜索类别 |
| 402 额度不足 | 告知升级套餐 |
