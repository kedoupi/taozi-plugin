---
name: youmind-research
description: 热点研究与调研分析。输入任意主题，自动搜索新闻、推特、财经、学术等多维度信息，输出结构化研究报告和内容创作建议。需要 YOUMIND_API_KEY 环境变量。
triggers: "调研,分析,热点,研究,查一下,找一下,了解下,帮我看看,最新趋势,survey,research,investigate"
allowed-tools:
  - Bash([ -n "$YOUMIND_API_KEY" ]*)
---

# YouMind 热点研究

主 agent 只负责三件事：**环境检查 → 理解意图 → 派 Agent**。
所有 YouMind API 调用全部在子 Agent 内完成。

---

## 第一步：检查环境

```bash
[ -n "$YOUMIND_API_KEY" ] && echo "已配置" || echo "未配置"
```

未配置时告知用户设置 `YOUMIND_API_KEY=sk-ym-xxx`，停止执行。

---

## 第二步：解析研究意图

从用户描述中提取三个参数：

### 研究深度

| 用户说 | 模式 | tool |
|--------|------|------|
| "快速看看"、"大概了解"、"扫一眼" | 快速扫描 | `webSearch` |
| 未说明 | 快速扫描 | `webSearch` |
| "深度研究"、"详细分析"、"全面了解"、"要有数据" | 深度研究 | `research` |

### 搜索类别自动路由（webSearch 模式）

| 内容特征 | categories |
|---------|-----------|
| 时事、新闻、行业动态 | `["news"]` |
| 舆论、KOL 观点、社交讨论 | `["tweet"]` |
| 股价、市场数据、财经报告 | `["finance"]` |
| 学术论文、研究报告、权威数据 | `["scholar"]` |
| 多维度综合分析 | `["news", "tweet"]` |
| 未说明 / 通用 | `["news", "tweet"]` |

告知用户：选了哪种深度、搜索哪些类别、原因是什么。

### 查询词优化

将用户的中文描述转化为高质量查询语句：
- 补充时间限定（"最新"、"2024-2025"）
- 补充领域关键词
- 如果是多平台分析，加上平台名称限定

---

## 第三步：立刻派 Agent

**⚠️ 参数确认后立刻派 Agent，不要自己调用任何 YouMind API。**

告知用户：
> 已开始研究，1-3 分钟后告诉你结果，可以继续问我其他问题。

---

**Agent prompt 模板（webSearch 快速扫描）：**

```
你是一个研究执行 agent，完整负责以下任务，不需要询问，直接执行。

## 参数
- query: <优化后的查询语句>
- categories: <["news","tweet"] 等>
- 研究目的: <用户原始意图>

## 执行步骤

### 步骤 1：安装 CLI（如未安装）
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

### 步骤 2：获取 Board ID
youmind call getDefaultBoard
取返回值的 id 字段作为 boardId。

### 步骤 3：发起研究
youmind call createChat '{"boardId":"<boardId>","message":"<query>","tools":{"webSearch":{"useTool":"required","categories":<categories>}}}'
取返回值的 id 作为 chatId。
如果超时未返回，执行：youmind call listChats '{"boardId":"<boardId>","pageSize":3}'，取最新一条的 id。

### 步骤 4：轮询（每 5 秒，最多 120 秒）
youmind call getChat '{"chatId":"<chatId>"}'
- status 为 completed → 执行步骤 5
- 超过 120 秒 → 返回 TIMEOUT

### 步骤 5：提取研究结果
youmind call listMessages '{"chatId":"<chatId>","pageSize":20}' | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d if isinstance(d, list) else d.get('items', d.get('messages', []))
for m in items:
    role = m.get('role', '')
    if role == 'assistant':
        for b in (m.get('blocks') or []):
            if b.get('type') == 'text':
                print(b.get('text', ''))
"

### 步骤 6：返回结果
RESEARCH_DONE
<完整研究内容>
```

---

**Agent prompt 模板（research 深度研究）：**

```
你是一个研究执行 agent，完整负责以下任务，不需要询问，直接执行。

## 参数
- query: <优化后的查询语句>
- 研究目的: <用户原始意图>

## 执行步骤

### 步骤 1：安装 CLI（如未安装）
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

### 步骤 2：获取 Board ID
youmind call getDefaultBoard
取返回值的 id 字段作为 boardId。

### 步骤 3：发起深度研究
youmind call createChat '{"boardId":"<boardId>","message":"<query>","tools":{"research":{"useTool":"required"}}}'
取返回值的 id 作为 chatId。
如果超时未返回，执行：youmind call listChats '{"boardId":"<boardId>","pageSize":3}'，取最新一条的 id。

### 步骤 4：轮询（每 10 秒，最多 300 秒）
youmind call getChat '{"chatId":"<chatId>"}'
- status 为 completed → 执行步骤 5
- 超过 300 秒 → 返回 TIMEOUT

### 步骤 5：提取研究结果
youmind call listMessages '{"chatId":"<chatId>","pageSize":20}' | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d if isinstance(d, list) else d.get('items', d.get('messages', []))
for m in items:
    role = m.get('role', '')
    if role == 'assistant':
        for b in (m.get('blocks') or []):
            if b.get('type') == 'text':
                print(b.get('text', ''))
"

### 步骤 6：返回结果
RESEARCH_DONE
<完整研究内容>
```

---

## 第四步：展示结果

收到 Agent 返回的 `RESEARCH_DONE` 后，将研究内容整理为结构化报告：

```
## 研究报告：<主题>

### 核心发现
<3-5 个关键结论>

### 详细内容
<研究正文>

### 内容创作建议
- 适合平台：<小红书/公众号/抖音等>
- 推荐角度：<2-3 个切入点>
- 热门话题标签：<#标签1 #标签2>
```

询问用户：
> 需要基于这份研究生成内容吗？可以直接说"帮我写一篇小红书"或"做成公众号文章"。

---

## 错误处理

| 情况 | 处理 |
|------|------|
| `YOUMIND_API_KEY` 未配置 | 停止，提示配置 |
| Agent 返回 TIMEOUT | 建议换更具体的查询词重试 |
| 无内容返回 | 建议换查询词或切换搜索类别 |
| 402 额度不足 | 告知升级套餐 |
