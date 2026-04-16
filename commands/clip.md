---
name: clip
description: 内容采集与分析 — 输入 URL，导入 YouMind 并深度分析内容结构、核心观点和可借鉴点
argument-hint: <URL，支持 YouTube 视频、微信公众号文章、公开网页>
allowed-tools:
  - Bash([ -n "$YOUMIND_API_KEY" ]*)
---

# 内容采集与分析

根据 `$ARGUMENTS` 中的 URL 导入并分析内容。

## 第一步：环境检查

```bash
[ -n "$YOUMIND_API_KEY" ] && echo "ok" || echo "missing"
```

未配置时告知用户设置 `YOUMIND_API_KEY=sk-ym-xxx`，停止执行。

---

## 第二步：解析参数

从 `$ARGUMENTS` 中提取：

- **URL**：用户提供的链接
- **分析目的**（可选，从描述中推断）：
  - 有"拆解"、"套路"、"学" → 结构分析
  - 有"借鉴"、"做一篇类似的"、"改写" → 内容借鉴
  - 未说明 → 全面分析

已知支持：YouTube、微信公众号（mp.weixin.qq.com）、普通公开网页
已知不支持：知乎、小红书、需登录的内容（遇到请告知用户）

---

## 第三步：派 Agent

**⚠️ 立刻派 Agent，不要自己调用 YouMind API。**

告知用户：
> 正在导入并分析，1-2 分钟后告诉你结果。

每个 URL 对应一个独立 Agent，传入以下 prompt：

```
你是内容采集分析 agent，直接执行以下任务，无需询问。

url: <URL>
分析目的: <结构分析 / 内容借鉴 / 全面分析>

步骤：

1. 安装检查
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

2. 获取 Board ID
youmind call getDefaultBoard
取 id 字段。

3. 导入 URL
youmind call createMaterialByUrl '{"url":"<url>","boardId":"<id>"}'
取返回 id 作为 materialId。
如失败（fetch-failed 等），返回 CLIP_FAIL + 原因。

4. 等待解析（每 5 秒，最多 60 秒）
youmind call getMaterial '{"id":"<materialId>","includeBlocks":true}'
type 不为 null/unknown-webpage 时视为完成，继续步骤 5。
记录 title 字段作为 materialTitle。

5. 分析（message 必须以素材标题开头，避免与 Board 其他素材混淆）
youmind call createChat '{"boardId":"<id>","message":"<分析提示词>","atReferences":[{"$class":"AtReferenceMaterialDto","id":"<materialId>"}]}'

分析提示词（每条都以「标题为《<materialTitle>》的内容」开头）：
- 结构分析：标题为《<materialTitle>》的内容，请深度分析：1. 标题用了什么技巧？2. 内容结构套路？3. 开头/中间/结尾怎么写的？4. 可直接复用的写作手法？
- 内容借鉴：标题为《<materialTitle>》的内容，请分析：1. 核心观点和论据 2. 内容框架和逻辑 3. 差异化角度 4. 给我3个可以做的选题方向
- 全面分析：标题为《<materialTitle>》的内容，请全面分析：1. 主题和核心观点 2. 内容结构和套路 3. 标题和钩子技巧 4. 数据和案例亮点 5. 对内容创作者最有价值的借鉴点

取返回 id 作为 chatId。

6. 提取结果
youmind call listMessages '{"chatId":"<chatId>","pageSize":20}' | python3 -c "
import sys,json
d=json.load(sys.stdin)
items=d if isinstance(d,list) else d.get('items',d.get('messages',[]))
for m in items:
  if m.get('role')=='assistant':
    for b in (m.get('blocks') or []):
      if b.get('type')=='text': print(b.get('text',''))
"

7. 返回
CLIP_DONE
素材类型: <video/article/webpage>
标题: <标题>
分析报告:
<完整分析内容>
```

---

## 第四步：汇总展示

收到 `CLIP_DONE` 后展示：

```
## 内容分析：<标题>

<分析报告>

---
接下来：说"帮我写一篇类似的小红书"、"做成公众号文章"或"帮我生一张配图"。
```

---

## 错误处理

| 情况 | 处理 |
|------|------|
| API Key 未配置 | 停止并提示配置 |
| URL 需登录（知乎/小红书） | 告知不支持，建议换公开 URL |
| CLIP_FAIL | 告知 URL 无法解析，建议换一个 |
| 402 额度不足 | 告知升级套餐 |
