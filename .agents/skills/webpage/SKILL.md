---
name: webpage
description: AI 网页生成。输入主题或内容，自动生成可分享的美观网页，直接返回可访问的 URL。需要 YOUMIND_API_KEY 环境变量。
triggers: "做个网页,生成网页,做个页面,做个展示页,做个介绍页,生成落地页,转成网页,文章转网页,做个链接分享,make webpage,create webpage,generate page"
allowed-tools:
  - Bash([ -n "$YOUMIND_API_KEY" ]*)
---

# AI 网页生成

主 agent 只负责三件事：**环境检查 → 理解意图 → 派 Agent**。
所有 YouMind API 调用全部在子 Agent 内完成。

---

## 第一步：检查环境

```bash
[ -n "$YOUMIND_API_KEY" ] && echo "已配置" || echo "未配置"
```

未配置时告知用户设置 `YOUMIND_API_KEY=sk-ym-xxx`，停止执行。

---

## 第二步：理解意图

从用户描述中提取：

### 网页类型与 prompt

根据用户意图组织描述，让 AI 清楚网页的目标和内容：

| 场景 | prompt 构建方式 |
|------|--------------|
| 项目/产品介绍 | "生成一个关于「XX」的产品介绍页，包含功能亮点、使用场景、核心价值" |
| 文章/内容转网页 | "将以下内容转成一个美观的网页：[内容]" |
| 个人/团队展示 | "生成一个个人主页，展示：[信息]" |
| 活动/课程介绍 | "生成一个活动介绍页，包含主题、时间、亮点、报名信息" |
| 报告/研究展示 | "将以下研究报告做成可分享的网页：[内容]" |

### 风格要求（从描述中提取，未说明则不强制）

- 简约清爽、商务专业、创意个性、深色科技感等
- 颜色偏好（如"蓝色系"、"暖色调"）

---

## 第三步：立刻派 Agent

**⚠️ 参数确认后立刻派 Agent，不要自己调用任何 YouMind API。**

告知用户：
> 已开始生成网页，约 2-3 分钟后告诉你结果，生成后会给你一个可直接访问的链接。

用 Agent 工具，传入以下 prompt（替换实际值）：

---

**Agent prompt 模板：**

```
你是一个网页生成执行 agent，完整负责以下任务，不需要询问，直接执行。

## 参数
- prompt: <网页内容描述>

## 执行步骤

### 步骤 1：安装 CLI（如未安装）
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

### 步骤 2：获取 Board ID
youmind call getDefaultBoard
取返回值的 id 字段作为 boardId。

### 步骤 3：发起网页生成
youmind call createChat '{"boardId":"<boardId>","message":"<prompt>","tools":{"generateWebpage":{"useTool":"required"}}}'

取返回值的 id 作为 chatId。
如果超时未返回，执行：youmind call listChats '{"boardId":"<boardId>","pageSize":3}'，取最新一条的 id。

### 步骤 4：轮询（每 5 秒，最多 180 秒）
youmind call getChat '{"chatId":"<chatId>"}'
- status 为 completed → 执行步骤 5
- 超过 180 秒 → 返回 TIMEOUT

### 步骤 5：提取结果
youmind call listMessages '{"chatId":"<chatId>","pageSize":20}' | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d if isinstance(d, list) else d.get('items', d.get('messages', []))
for m in items:
    for b in (m.get('blocks') or []):
        tr = b.get('toolResult') or {}
        tname = b.get('toolName', '')
        if tname == 'generate_webpage':
            cdn_url = tr.get('cdn_url', '')
            wp = tr.get('webpage') or {}
            print(f'url: {cdn_url}')
            print(f'webpageId: {wp.get(\"id\",\"\")}')
            print(f'title: {wp.get(\"title\",\"\")}')
"

### 步骤 6：返回结果
WEBPAGE_DONE
url: <cdn_url>
title: <网页标题>
webpageId: <id>
```

---

## 第四步：展示结果

收到 Agent 返回的 `WEBPAGE_DONE` 后：

```
✅ 网页生成完成

🔗 访问链接：<url>

网页已生成，可直接分享给他人访问。

需要调整内容、换配色风格，还是基于同样内容生成 PPT 或小红书文章？
```

---

## 错误处理

| 情况 | 处理 |
|------|------|
| `YOUMIND_API_KEY` 未配置 | 停止，提示配置 |
| Agent 返回 TIMEOUT | 告知用户稍后重试或简化描述 |
| 生成失败 | 建议换更简洁的描述重试 |
| 402 额度不足 | 告知升级套餐 |
