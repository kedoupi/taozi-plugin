---
name: infographic
description: AI 信息图生成。14 种布局 × 15 种风格，支持独立调用或由 wechat/xiaohongshu skill 传入内容自动决策。需要 YOUMIND_API_KEY。
triggers: "信息图,infographic,数据图,可视化,信息可视化,make infographic,data visualization,知识图"
allowed-tools:
  - Bash(python3 *)
---

# AI 信息图生成

根据内容自动选择最优布局（Layout）× 风格（Style），生成专业信息图。

**两种触发方式：**
- 用户直接调用 `/taozi:infographic`：走三步交互流程
- 由 wechat / xiaohongshu skill 传入结构化 context：自动决策，直接生成

---

## 第一步：检查环境

```bash
python3 -c "
import os
key = os.environ.get('YOUMIND_API_KEY', '')
if not key:
    import os.path
    cfg = os.path.join(os.path.expanduser('~'), '.taozi', 'config.yaml')
    if os.path.exists(cfg):
        try:
            import yaml
            d = yaml.safe_load(open(cfg)) or {}
            v = (d.get('youmind') or {}).get('api_key', '')
            if v and not v.startswith('\$'):
                key = v
            elif v and v.startswith('\$'):
                key = os.environ.get(v[1:], '')
        except Exception:
            pass
print('OK' if key else 'MISSING')
"
```

如果输出 `MISSING`，提示运行 `/taozi:setup`，停止执行。

---

## 第二步：分析内容 → 自动选择 Layout × Style × Palette

读取两个参考文件：
- `skills/infographic/references/layouts.md`（14 种布局）
- `skills/infographic/references/styles.md`（15 种风格）

### 内容分析维度

从用户输入（或传入的 section_content）提取：

1. **结构特征**：是否含数据/数字、对比、流程、层级、分类、交叉概念、循环、旅程
2. **情绪调性**：理性分析型、感性生活型、科技硬核型、教育科普型
3. **输出平台**（如果由 wechat/xhs 传入则直接使用）：
   - wechat：横版 16:9（900×506 或 800px 宽自适应）
   - xiaohongshu：竖版 3:4（1242×1660）或方版 1:1（1080×1080）
   - 独立调用：询问用户，或默认 16:9

### 自动决策规则（参考 layouts.md 和 styles.md 的推荐表）

按以下顺序决策：
1. 根据内容结构特征 → 选 Layout
2. 根据情绪调性 + Layout → 选 Style
3. 根据平台/用户意图 → 确定比例

**不需要用户确认**（直接调用模式下），**除非**用户主动说"让我选"或"帮我推荐选项"。

---

## 第三步：组装 Prompt

使用以下模板，将 Layout 定义 + Style 定义 + 内容填入：

```
Create a professional infographic following these specifications:

## Image Specifications
- Type: Standalone infographic
- Layout: {LAYOUT_NAME}
- Style: {STYLE_NAME}
- Aspect Ratio: {RATIO}
- Language: Simplified Chinese (all labels and text in Chinese)

## Core Principles
- Follow the layout structure precisely for information architecture
- Apply style aesthetics consistently throughout
- Keep information concise, highlight keywords and core concepts
- Use ample whitespace for visual clarity
- Maintain clear visual hierarchy
- All text in Simplified Chinese

## Layout Guidelines
{LAYOUT_GUIDELINES — 从 layouts.md 对应 Layout 的完整定义复制}

## Style Guidelines
{STYLE_GUIDELINES — 从 styles.md 对应 Style 的完整定义复制}

---

Generate the infographic based on the content below:
{CONTENT — 核心数据/结构/观点，中文，100字以内}
```

---

## 第四步：派 Agent 生成

**⚠️ Prompt 组装完成后立刻派 Agent，不要自己调用 YouMind API。**

告知用户：
> 已开始生成信息图，1-3 分钟后告诉你结果。

用 Agent 工具，传入以下 prompt（替换实际值）：

---

**Agent prompt 模板：**

```
你是一个信息图生成执行 agent，完整负责以下任务，不需要询问，直接执行。

## 参数
- prompt: <组装好的完整信息图 prompt>
- aspectRatio: <16:9 | 3:4 | 1:1>
- quality: high
- model: gemini-3-pro-image-preview

## 执行步骤

### 步骤 1：安装 CLI（如未安装）
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

### 步骤 2：获取 Board ID
youmind call getDefaultBoard
取返回值的 id 字段作为 boardId。

### 步骤 3：发起生图
youmind call createChat '{"boardId":"<boardId>","message":"<prompt>","tools":{"imageGenerate":{"useTool":"required","aspectRatio":"<aspectRatio>","quality":"high","model":"gemini-3-pro-image-preview"}}}'
取返回值的 id 作为 chatId。

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
INFOGRAPHIC_DONE
layout: <layout_name>
style: <style_name>
尺寸: <width>x<height>
原图: <url>
```

---

## 第五步：展示结果

收到 `INFOGRAPHIC_DONE` 后：
- 展示图片链接
- 说明使用的 Layout + Style
- 询问：需要调整布局、换风格，还是用这张图？

---

## 错误处理

| 情况 | 处理 |
|------|------|
| `YOUMIND_API_KEY` 未配置 | 停止，提示配置 |
| Agent 返回 TIMEOUT | 告知用户去 YouMind Board 查看 |
| 无图片结果 | 建议换 Layout 或简化内容重试 |
| 402 额度不足 | 告知升级套餐 |
