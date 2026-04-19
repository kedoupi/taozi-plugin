---
name: lark
description: 飞书万能链接助手：给任意飞书链接（文档/知识库/表格/多维表格），自动读取内容、分析结构、逐步建议并在确认后写回。支持在项目目录下放 .taozi/platforms/lark.yaml 绑定默认知识库，后续操作无需每次提供链接。
triggers: "整理飞书,更新知识库,飞书文档,飞书链接,lark.cn,feishu.cn,飞书知识库,飞书整理"
allowed-tools:
  - Bash(lark-cli *)
  - Bash(find . -maxdepth 5 -name lark.yaml -path */.taozi/platforms/*)
  - Bash(cat .taozi/platforms/lark.yaml*)
  - Read
---

# 飞书万能链接助手

> **铁律（每次调用必读）**
> 无论对话进行了多少轮，**只要涉及飞书内容操作，必须从第一步开始**，不得跳过目标解析，不得直接开始写入。

**常见逃逸借口（全部无效）**：

| 借口 | 正确做法 |
|------|---------|
| "用户已经给过链接了" | 仍需 Step 1 验证链接类型 |
| "我知道是文档，直接写" | 必须先 read 确认内容再分析 |
| "用户说快点" | 可以跳过分析直接问用户要做什么，但不能跳过读取 |
| "目录下有 .taozi/platforms/lark.yaml 就直接操作" | 仍需展示将要操作的目标，让用户确认 |

主流程四步：**解析目标 → 读取内容 → 分析建议 → 逐步执行**。

---

## 第一步：解析目标

按优先级决定操作目标：

### 优先级 1：用户提供了显式飞书 URL

从用户消息中提取 URL，识别类型：

| URL 特征 | 类型 | 后续 CLI |
|---------|------|---------|
| `/docx/` 或 `/doc/` | 飞书文档 | `lark-cli docs +fetch` |
| `/wiki/` | 知识库节点 | 先 `lark-cli wiki spaces get_node`，再 `lark-cli docs +fetch` |
| `/sheets/` | 电子表格 | `lark-cli sheets` |
| `/base/` 或 `/bitable/` | 多维表格 | `lark-cli base records list` |

### 优先级 2：无 URL，查找项目配置

```bash
find . -maxdepth 5 -name "lark.yaml" -path "*/.taozi/platforms/*" 2>/dev/null | head -1
```

找到后读取内容：
```bash
cat .taozi/platforms/lark.yaml
```

`.taozi/platforms/lark.yaml` 格式：
```yaml
wiki_url: https://xxx.feishu.cn/wiki/SpaceXXX
description: 项目备注（可选）
```

找到配置后，**必须告知用户**：
```
📂 检测到项目配置：<description 或路径>
目标知识库：<wiki_url>
继续操作此知识库？(是/否/使用其他链接)
```

### 优先级 3：两者都没有

停止执行，提示：
```
❌ 未找到飞书目标。请：
1. 提供飞书链接（文档/知识库/表格/多维表格）
2. 或在当前目录创建 .taozi/platforms/lark.yaml 绑定默认知识库

.taozi/platforms/lark.yaml 格式：
  wiki_url: https://xxx.feishu.cn/wiki/SpaceXXX
  description: 项目名称
```

---

## 第二步：读取内容

根据第一步识别的类型，执行对应读取命令。

**CRITICAL**：wiki 链接必须先解析节点，不能直接用 URL 中的 token：
```bash
# wiki 链接专用：先拿真实 obj_token 和 obj_type
lark-cli wiki spaces get_node --params '{"token":"<wiki_token>"}'
# 再根据 obj_type 决定后续调用
```

读取后，将内容摘要展示给用户（不要原样粘贴全文，做结构性概述）：
```
📄 已读取：<文档标题>
类型：<文档/知识库节点/表格/多维表格>
内容摘要：
  - 章节数：X
  - 大致结构：...
  - 字数约：...
```

---

## 第三步：分析并输出建议清单

**如果用户已明确告知要做什么**（如"帮我重写第二章"），跳过分析，直接进入第四步。

**如果用户未指定**，基于读取内容生成编号建议清单：

```
📋 分析完成，发现以下可优化点：

[1] 结构调整：<描述>
    操作：lark-cli docs +update ...（预览）

[2] 内容补充：<描述>
    操作：lark-cli docs +update ...（预览）

[3] 格式规范：<描述>
    操作：lark-cli docs +update ...（预览）

共 X 条建议。从第 [1] 条开始逐步确认？(是/自选/取消)
```

---

## 第四步：逐步执行

每条操作单独展示，等用户确认后再执行：

```
────────────────────────────
建议 [N/总数]：<操作描述>

将执行：
  lark-cli <完整命令>

▶ 执行 | 跳过 | 查看详情 | 终止全部
────────────────────────────
```

- **执行**：运行命令，展示结果，自动进入下一条
- **跳过**：不执行，直接下一条
- **查看详情**：展示完整 CLI 命令参数和预期影响
- **终止全部**：停止，输出已完成/未完成的汇总

所有条目完成后输出摘要：
```
✅ 完成 X/Y 条操作
跳过：[列出跳过的条目]
飞书链接：<操作目标的原始 URL>
```

---

## 配置文件管理

### 初始化项目绑定

当用户说"绑定这个项目到飞书知识库"或"设置默认知识库"时，帮用户创建 `.taozi/platforms/lark.yaml`：

1. 询问知识库 URL
2. 询问描述（可选）
3. 创建目录并写入文件：
```bash
mkdir -p .taozi/platforms
```
写入 `.taozi/platforms/lark.yaml`，格式为 YAML

### 更新配置

用户说"换一个知识库"或"更新飞书配置"时，读取现有 `.taozi/platforms/lark.yaml` 展示后，允许修改 `wiki_url` 和 `description`。

---

## 注意事项

- 操作前**必须先读取**，禁止在未读取内容的情况下直接写入
- wiki 节点写入需要 `--as user` 身份（bot 权限有限），遇到权限错误优先尝试切换身份
- 表格/多维表格写入前，先确认列结构（`lark-cli sheets` / `lark-cli base` 查看字段）
- 单次对话中多次操作同一目标，不需要每次重新读取，但需要告知用户"使用缓存内容"
