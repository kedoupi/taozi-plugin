---
name: create
description: 内容全链路 — 一句话触发：热点研究 → 确定选题 → 生成多平台内容 → 配图建议。需要 YOUMIND_API_KEY。
argument-hint: <内容主题，如"做一个关于AI工具的小红书内容，要有数据支撑">
allowed-tools:
  - Bash(python3 *)
  - Bash([ -d "$HOME/.taozi" ]*)
---

# Create

根据 `$ARGUMENTS` 完成从研究到内容的完整流程。

## 何时使用

- 需要一站式完成"选题 → 研究 → 内容 → 配图"
- 用户明确要求"一条龙"、"全链路"产出
- 输入是一个主题 + 可选平台/风格要求

## 流程

```
研究热点 → 确定选题 → 生成内容 → 配图建议 → （可选）生图
```

## 第一步：环境检查 + 品牌读取

```bash
python3 -c "
import os
key = os.environ.get('YOUMIND_API_KEY', '')
if not key:
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

如果输出 `MISSING`，提示用户运行 `/taozi:setup` 配置 YouMind API Key，停止执行。

同时读取品牌文件（后续步骤使用）：

```bash
python3 -c "
import os
HOME = os.path.expanduser('~')

def read_brand(filename):
    for base in ('.taozi/brand', os.path.join(HOME, '.taozi', 'brand')):
        p = os.path.join(base, filename)
        if os.path.exists(p):
            with open(p) as f: return f.read()
    return ''

voice = read_brand('voice.md')
print('VOICE_FOUND:' + ('yes' if voice else 'no'))
"
```

将 `voice.md` 内容（若存在）作为写作人设上下文传入第三步。

## 第二步：解析完整意图

从 `$ARGUMENTS` 中提取：

| 参数 | 说明 |
|------|------|
| 核心主题 | 要创作的话题/产品/事件 |
| 目标平台 | 小红书/公众号/抖音/X/全平台（未说明默认小红书） |
| 是否需要数据 | "有数据"、"有依据" → 开启 research；否则 webSearch |
| 内容风格 | 种草/干货/日常（未说明按平台自动匹配） |

## 第三步：并行执行

**研究 + 内容构思同步开始，不串行等待。**

### 任务 A：派研究 Agent（后台）

告知用户：
> 正在研究相关热点，1-2 分钟后整合进内容，可以继续告诉我更多要求。

参考 `skills/research/` 中的 Agent prompt 模板派发研究任务。

### 任务 B：基于主题先起草内容框架

等待研究结果期间，先生成内容骨架（标题候选 + 内容大纲），收到研究结果后填充数据和热点角度。

## 第四步：整合输出

```markdown
## 研究摘要
<3条关键发现>

---

## 内容正文（<平台>版）
<完整可发布内容>

---

## 配图建议
风格：<日式插画/写实摄影/数据图表等>
画面：<具体描述>
比例：<3:4/16:9 等>

需要直接生图吗？说"帮我生图"即可调用 /taozi:image。
```

## 错误处理

| 情况 | 处理 |
|------|------|
| API Key 未配置 | 停止并提示配置 |
| 研究超时 | 跳过研究，仅基于主题生成内容，说明未含最新数据 |
| 402 额度不足 | 告知升级套餐 |
