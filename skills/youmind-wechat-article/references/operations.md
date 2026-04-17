# 运营操作

> 本文件描述用户在日常运营中可执行的增强操作。这些操作不在主流水线中，用户主动触发。

---

## 操作 1：改稿学习

**触发方式：** 用户手动修改了草稿箱中的文章，说"学习我的修改" 或 "分析我刚才改的内容"。

**场景：** 用户对 AI 写出来的文章做了修改（改了标题、改了某段话的语气、删掉了某个段落），希望 AI 记住这次偏好，未来自动应用。

### 执行步骤

```
Step A：获取原始版本
  读取 wechat-articles/history.yaml 中最近一篇记录
  → 确认对应的原始文章内容（若 history.yaml 中有 content_hash，可对比）

Step B：用户提供修改版本
  → 请用户粘贴修改后的版本，或提供微信草稿箱中的最新文字

Step C：提取 diff 和规律
  对比两个版本，提取：
  - 标题改动：改了什么？方向是什么（更短？更具体？更口语？）
  - 段落改动：哪些段落被删？哪些被加？加的内容有什么共同特征？
  - 用词改动：哪些词被替换？新词有什么风格特征？
  - 结构改动：段落顺序有调整吗？小节数量变化了吗？

Step D：写入 lessons 文件
  生成文件：wechat-articles/lessons/YYYY-MM-DD-<文章主题关键词>.md
  格式：
```

```markdown
# 改稿学习记录 YYYY-MM-DD

原文标题：__________
修改后标题：__________

## 标题规律
- ……

## 内容规律
- ……

## 用词偏好
- 倾向于用 XX 代替 XX
- 不喜欢 XX 风格的句子

## 结构偏好
- ……
```

```
Step E：检查是否触发 playbook 更新
  读取 wechat-articles/lessons/ 目录的文件数量
  若 ≥ 5 篇（或用户主动说"更新我的写作手册"）→ 执行操作 2 的 Step C
```

---

## 操作 2：喂语料（生成写作手册）

**触发方式：** 用户说"生成我的写作手册" 或 "分析我的历史文章"。

**前提：** `wechat-articles/corpus/` 目录下有 1 篇以上历史文章（txt 或 md 格式，粘贴进去即可）。

**建议语料量：** 20 篇以上效果最佳，5 篇以上可出初版。

### 执行步骤

```
Step A：扫描语料
  列出 wechat-articles/corpus/ 下所有文件
  统计总字数、篇数，汇报给用户确认分析

Step B：逐篇分析（批量，每批 5 篇）
  对每篇文章提取：
  - 常用句式（开头方式、转折方式、结尾方式）
  - 典型用词（高频独特词汇，避开停用词）
  - 平均句长和段落节奏
  - 小标题风格
  - 情感基调（理性/感性/幽默/严肃）

Step C：汇总生成 playbook.md
  写入文件：wechat-articles/playbook.md
  格式参考：
```

```markdown
# 我的写作手册

> 由 AI 分析 <N> 篇历史文章自动生成，最后更新：YYYY-MM-DD
> 本文件优先级高于 references/writing-guide.md

## 声音特征
- 基调：__________（例：理性 + 偶尔自嘲）
- 人称：__________（例：多用"我"，偶尔"我们"）
- 句子风格：__________（例：短句为主，每 100 字有 1-2 个极短句）

## 开头偏好
- 常见开头方式：__________
- 不喜欢的开头：__________

## 标题偏好
- 常见结构：__________（例：数字 + 问题 + 场景）
- 惯用词汇：__________
- 禁用词汇：__________

## 段落结构偏好
- 平均段落长度：约 __ 字
- 小节数量：通常 __ 个
- 过渡方式：__________

## 高频词汇/短语（保持风格一致性）
- __________
- __________

## 情感弧偏好
- 通常从 __________ 情绪开始
- 结尾落在 __________ 情绪

## 从改稿记录提取的个人规则
- __________（从 lessons/ 汇总）
```

---

## 操作 3：性能分析

**触发方式：** 用户说"分析我的文章表现" 或 "哪类文章效果最好"。

**前提：** 用户已在 `wechat-articles/history.yaml` 中手动填入阅读量、点赞数等数据。

### history.yaml 数据结构

```yaml
articles:
  - date: "2025-01-15"
    title: "入职 3 年才明白的职场潜规则"
    media_id: "xxxx"
    keywords:
      - 职场
      - 成长
    reads: 8420          # 手动填写（微信后台查看）
    likes: 234
    shares: 89
    comments: 12
    theme: decoration
    cover_style: lifestyle
```

### 执行步骤

```
Step A：读取数据
  解析 history.yaml 所有有 reads 字段的记录

Step B：分析维度
  - 按话题分类：哪类话题平均阅读量最高？
  - 按标题结构：数字类标题 vs 反问类标题，谁的表现更好？
  - 按发布时间：哪个星期几/时间段的文章表现最好？
  - 按封面风格：哪种 cover_style 的点击率更高？
  - 相关性：点赞率（likes/reads）vs 分享率（shares/reads）的差异

Step C：输出建议
  给出 3-5 条可执行的策略建议：
  - 选题方向建议
  - 标题写法建议
  - 发布时间建议
  - 封面风格建议
```

---

## 操作 4：换排版主题

**触发方式：** 用户说"用 decoration 主题重新排版" 或 "换个 XX 风格"。

**作用：** 对最近一篇文章（或指定文章）重新生成 HTML，切换主题。

### 执行步骤

```
Step A：确认目标文章
  若用户未指定 → 默认为最近一次生成的文章
  读取对应的原始 Markdown 内容（从 /tmp/article.md 或 history.yaml 引用）

Step B：重跑排版
  执行 wechat_publish.py 的 md_to_wx_html() 函数，指定新主题
  保存新的 HTML 到 /tmp/article_<theme>.html

Step C：更新草稿
  调用微信 draft/update 接口（若文章已在草稿箱）
  或重新创建草稿（若原草稿已发布）

Step D：汇报
  返回新草稿的 media_id 和预览确认
```

**可用主题：** `simple` / `center` / `decoration` / `prominent`
（详见 `references/html-themes.md`）

---

## 操作 5：重新生成封面图

**触发方式：** 用户说"换个封面" 或 "重新生成封面，用科技感" 或 "封面不好看，换一张"。

### 执行步骤

```
Step A：获取文章信息
  读取最近一次生成的标题和 cover_style 配置

Step B：确定新风格
  若用户指定了风格 → 用指定风格
  若用户说"换一张" → 用相同风格但不同 seed（在 prompt 末尾追加 "seed: <random_int>"）

Step C：重跑 pipeline Step 6
  使用新 prompt 生成封面图
  下载到 /tmp/wechat_cover_v2.jpg

Step D：重新上传封面图
  调用 add_material 上传新封面，获取新的 thumb_media_id

Step E：更新草稿封面
  调用 draft/update 接口更新封面字段

Step F：汇报
  返回新封面的 URL，供用户预览确认
```

---

## 操作 6：手动触发发布（草稿 → 正式发布）

> **注意：** 正式群发（mass send）是不可撤销操作，必须用户明确确认后才能执行。

**触发方式：** 用户说"发布这篇文章" 或 "群发" 或 "推送给粉丝"。

```
Step A：确认
  展示标题、摘要、封面，询问："确认发布到粉丝？这是不可撤销的操作。"

Step B：等待用户输入 "确认发布" 或 "是"

Step C：调用群发接口
  POST https://api.weixin.qq.com/cgi-bin/message/mass/sendall?access_token=ACCESS_TOKEN
  {
    "filter": {"is_to_all": true},
    "mpnews": {"media_id": "<draft_media_id>"},
    "msgtype": "mpnews",
    "send_ignore_reprint": 1
  }

Step D：返回 msg_id，并提醒用户在公众号后台查看发送进度
```

**群发限额：** 每月 4 次（认证服务号），超出后接口返回 `45028`。
