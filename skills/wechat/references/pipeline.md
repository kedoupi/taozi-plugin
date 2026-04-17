# 执行流水线

> 子 Agent 执行时按此文件指导，每步有 fallback，单步失败不中断整体流程。

---

## Step 1：加载配置

读取 `wechat-articles/style.yaml`，解析凭据（`$VAR_NAME` 展开为 env var）。
检查必填字段：wechat.appid、wechat.secret、youmind.api_key、name、tone、voice。

---

## Step 2：热点抓取

```bash
python3 skills/wechat-article/scripts/fetch_hotspots.py --limit 30
```

输出 JSON 热点列表，结合 `wechat-articles/history.yaml` 过滤近 7 天已发布的话题。

**Fallback：** 脚本失败 → YouMind webSearch 搜"今日热点新闻" → 再失败则请用户提供主题。

---

## Step 3：选题生成

基于热点列表和 style.yaml 的 topics/target_audience，生成 10 个候选选题。

每个选题包含：
- 标题（20-28 字）
- 核心洞察（1 句话，读者会在饭桌上转述的那个观点）
- 热度分（1-10）
- 与目标读者的相关性（1-10）

**自动模式（默认）：** 选最高分自动继续。
**交互模式（用户说"让我选"）：** 展示全部 10 个等待选择。

---

## Step 4：文章写作

读取 `references/writing-guide.md` 和 `wechat-articles/playbook.md`（如存在）。

执行要求：
- 写前完成思维框架（原子洞察 + 情感弧 + 核心张力）
- 字数：1500-2500 字
- H1 标题：20-28 字
- 禁用 style.yaml 的 blacklist 词汇
- playbook.md 优先级 > writing-guide.md（客户专属风格）

**Fallback：** playbook.md 不存在 → 仅用 writing-guide.md。

---

## Step 5：SEO + de-AI 优化

- 生成摘要（≤54 汉字，≤120 UTF-8 字节）
- 检查关键词密度
- 运行 de-AI 协议（见 writing-guide.md）

---

## Step 6：封面图生成

```bash
# 安装 YouMind CLI（如未安装）
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

# 获取 Board ID
youmind call getDefaultBoard

# 检测 character.md 是否有实际角色内容（排除注释、空行、blockquote、HTML 注释）
HAS_CHAR=$(grep -v '^#' wechat-articles/character.md 2>/dev/null \
  | grep -v '^[[:space:]]*$' \
  | grep -v '^>' \
  | grep -v '^<!--' \
  | grep -v '^-->' \
  | grep -v '^\-\-\-' \
  | grep -v '^##')
# $HAS_CHAR 非空 → 有角色；为空 → 无角色，AI 自由发挥

# 生成封面图（海报风格，含大字标题）
# - 读 references/cover-image-prompt.md 构建 prompt
# - 若有角色：读 wechat-articles/character.md 提炼描述，追加到 prompt（见 cover-image-prompt.md 第 6 节）
# - quality 使用 "medium"，上传时自动裁切到 900×383
youmind call createChat '{"boardId":"<id>","message":"<海报风格 prompt，含大字标题[+ 角色描述（如有）]>","tools":{"imageGenerate":{"useTool":"required","aspectRatio":"16:9","quality":"medium","model":"gemini-3-pro-image-preview"}}}'

# 轮询（每 5 秒，最多 120 秒）
youmind call getChat '{"chatId":"<chatId>"}'

# 提取图片 URL
youmind call listMessages '{"chatId":"<chatId>","pageSize":20}' | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d if isinstance(d, list) else d.get('items', d.get('messages', []))
for m in items:
    for b in (m.get('blocks') or []):
        tr = b.get('toolResult') or {}
        urls = tr.get('original_image_urls') or tr.get('image_urls') or []
        if urls: print(urls[0]); break
"

# 下载封面图
curl -s "<image_url>" -o /tmp/wechat_cover.jpg
```

**Fallback：** YouMind 生图失败 → 用纯文字封面（通过 generateWebpage 生成）→ 再失败 → 不带封面图推送（thumb_media_id 留空）。

---

## Step 7：发布到微信草稿箱

```bash
python3 skills/wechat-article/scripts/wechat_publish.py \
  --publish \
  --title "<标题>" \
  --content /tmp/article.md \
  --cover /tmp/wechat_cover.jpg
```

输出 JSON：`{"media_id": "xxx", "title": "标题"}`

**错误码处理：**
- `40001`：token 失效 → 重新获取，重试一次
- `40164`：IP 不在白名单 → 提示用户配置白名单或设置 WECHAT_PROXY
- `43019`：未开通草稿箱 → 提示用户在公众号后台开通
- `45009`：超日限额 → 提示明天再试

---

## Step 7.5：更新发布历史

```bash
python3 skills/wechat-article/scripts/wechat_publish.py \
  --update-history \
  --media-id "<media_id>" \
  --title "<标题>" \
  --keywords "<关键词1,关键词2>"
```

---

## Step 8：汇报结果

返回格式：
```
WECHAT_DRAFT_DONE
title: <标题>
media_id: <id>
cover: <封面图 URL>
digest: <摘要>
```
