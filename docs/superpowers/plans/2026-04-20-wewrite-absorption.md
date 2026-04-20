# wewrite 能力吸收 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 wewrite 在「写作骨架 / 内容增强 / 多平台热搜」三方向能力吸收进 `skills/wechat/`，不引入新依赖。

**Architecture:** 新增两份 references（frameworks.md / enhancements.md）作为 Sub-Agent B 写作前置参考；改造 Sub-Agent A 的 YouMind 调用为 3 路并行 + history dedup + 3 维打分；改造 Sub-Agent B 写作流程为「先选框架 → 注入增强指令 → 写作」。所有改动通过 `skills/wechat/SKILL.md` prompt 改写完成，不动 scripts/toolkit。

**Tech Stack:** Markdown skills + YouMind webSearch CLI + python3（已有 wechat_publish.py 维护 history.yaml）

**对应设计文档:** `docs/superpowers/specs/2026-04-20-wewrite-absorption-design.md`

---

## File Structure

| 文件 | 类型 | 责任 |
|------|------|------|
| `skills/wechat/references/frameworks.md` | 新增 | 7 框架库（适用/段落骨架/范例/避坑） |
| `skills/wechat/references/enhancements.md` | 新增 | 4 类增强 + 框架→增强映射表 |
| `skills/wechat/SKILL.md` | 修改 | Sub-Agent A 改 3 路调研+dedup+打分；Sub-Agent B 加框架选择+增强注入 |
| `tests/skills/wechat-frameworks.test.js` | 新增 | 验证 frameworks.md 含 7 框架 + 必填段 |
| `tests/skills/wechat-enhancements.test.js` | 新增 | 验证 enhancements.md 含 4 策略 + 映射表 7 行 |
| `tests/skills/wechat-history-dedup.test.js` | 新增 | 验证 SKILL.md 包含 history.yaml dedup 指令 |

执行顺序：Task 1–2 独立可并行；Task 3 改 Sub-Agent A；Task 4 改 Sub-Agent B；Task 5 跑 sync-codex + 全量测试。

---

## Task 1: 创建 frameworks.md（7 框架库）

**Files:**
- Create: `skills/wechat/references/frameworks.md`
- Test: `tests/skills/wechat-frameworks.test.js`

- [ ] **Step 1: 写测试 wechat-frameworks.test.js**

```js
// tests/skills/wechat-frameworks.test.js
const fs = require('fs');
const path = require('path');

const FRAMEWORKS_PATH = path.join(__dirname, '..', '..', 'skills', 'wechat', 'references', 'frameworks.md');

test('frameworks.md 文件存在', () => {
  assert.ok(fs.existsSync(FRAMEWORKS_PATH), 'frameworks.md 不存在');
});

test('frameworks.md 含 7 个框架小节', () => {
  const content = fs.readFileSync(FRAMEWORKS_PATH, 'utf8');
  const required = ['痛点型', '故事型', '清单型', '对比型', '热点解读型', '纯观点型', '复盘型'];
  required.forEach(name => {
    assert.ok(content.includes(`## ${name}`), `缺少框架: ${name}`);
  });
});

test('每个框架含"段落骨架"段', () => {
  const content = fs.readFileSync(FRAMEWORKS_PATH, 'utf8');
  const sections = content.split(/^## /m).slice(1);
  assert.strictEqual(sections.length, 7, '框架数量应为 7');
  sections.forEach(sec => {
    const name = sec.split('\n')[0];
    assert.ok(sec.includes('### 段落骨架'), `${name} 缺少"段落骨架"小节`);
  });
});

test('frameworks.md 含框架选择判断顺序段', () => {
  const content = fs.readFileSync(FRAMEWORKS_PATH, 'utf8');
  assert.ok(content.includes('## 框架选择判断顺序'), '缺少"框架选择判断顺序"段');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/run-all.js 2>&1 | grep -A2 wechat-frameworks`
Expected: FAIL，提示 frameworks.md 不存在

- [ ] **Step 3: 创建 frameworks.md**

写入 `skills/wechat/references/frameworks.md`：

```markdown
# 写作框架库

公众号文章按选题素材类型选择 1/7 框架。Sub-Agent B 写作前必读本文件，按"框架选择判断顺序"选定，注入段落骨架到 system prompt。

---

## 痛点型

### 适用
工具/方法/教程类。读者带具体问题来找答案。

### 段落骨架
1. 场景痛点（读者当下卡在哪）
2. 旧方案为什么不行（具体踩坑）
3. 新方案登场（一句话亮点）
4. 3 个用法（每用法 1 段，含具体案例）
5. 效果对比（数字/截图/前后差）
6. 行动召唤（一句话，引收藏/转发）

### 一句话范例
"3 小时压到 22 分钟——我用这个工具重写了周报流程"

### 反例避坑
- 不要堆功能列表（读者要的是用法不是说明书）
- 不要全程理论无实操

---

## 故事型

### 适用
人物/案例/经历叙述。

### 段落骨架
1. 反常识开头（一个让人想往下看的钩子）
2. 背景铺垫（人/时/地/起因）
3. 转折冲突（事情怎么走偏的）
4. 关键决策（主角做了什么不一样的事）
5. 结果（数据/转变/外界反应）
6. 抽象出方法论（这件事教我们什么，3 条以内）

### 一句话范例
"被裁的第 3 天，他做了一件让前公司想哭的事"

### 反例避坑
- 不要流水账（每段必须推进冲突或揭示信息）
- 不要在结尾强行升华到行业大趋势

---

## 清单型

### 适用
资源/工具/网站/书单盘点。

### 段落骨架
1. 痛点引入（为什么需要这份清单）
2. N 项总览（一句话列出所有，让读者预判价值）
3. 逐项展开（每项：用途 / 亮点 / 链接 或 截图）
4. 怎么挑（多选场景下的取舍建议）
5. 收藏行动（明确告诉读者怎么用这份清单）

### 一句话范例
"独立开发者必备的 12 个免费工具（2025 年版）"

### 反例避坑
- 数量虚标（说 20 个实际 8 个有用）
- 顺序随便（按使用频率/效果排序，不是想到啥写啥）

---

## 对比型

### 适用
工具选型 / 方案测评 / A vs B。

### 段落骨架
1. 共同问题（A 和 B 都想解决什么）
2. 维度定义（用哪些标准比，明示权重）
3. A 怎么做（含具体使用感受）
4. B 怎么做（同样格式）
5. 维度评分（表格直观，每维度打分 + 理由）
6. 推荐场景（什么人用 A，什么人用 B）

### 一句话范例
"Cursor vs Windsurf：我用了 30 天，给你 6 维度对比"

### 反例避坑
- 假装中立但偏向某一方（明示立场比假装客观更可信）
- 评分维度不一致（A 拿到的维度 B 必须也评）

---

## 热点解读型

### 适用
时事/新闻/行业事件。

### 段落骨架
1. 事件复述（30 秒内让没看过新闻的人懂发生了什么）
2. 主流解读（媒体/朋友圈在怎么说）
3. 我的角度（与主流不同的切入点，**强制反共识**）
4. 3 个被忽略的事实（具体数据/历史脉络/利益相关方）
5. 趋势预判（接下来 1–6 个月会发生什么）

### 一句话范例
"OpenAI 这次发布会，最重要的不是 GPT-5，是这个被忽略的 API"

### 反例避坑
- 复述新闻占一半篇幅（读者要的是你的视角）
- 强行预测但无依据

---

## 纯观点型

### 适用
行业洞察 / 趋势判断 / 经验总结。无具体素材，靠论证撑起来。

### 段落骨架
1. 反直觉论点（一句话，让读者想反驳）
2. 论据 1（具体案例 + 数据）
3. 论据 2（同上，不同维度）
4. 论据 3（同上，不同维度）
5. 反方质疑（最强的反对声音是什么）
6. 我的回应（化解或承认局限）
7. 落地建议（读者今天能做什么）

### 一句话范例
"我反对'独立开发者要做 SaaS'——这是 2025 最被高估的赛道"

### 反例避坑
- 论据全是个人感受（必须有外部验证）
- 不写反方质疑（显得思考不深）

---

## 复盘型

### 适用
项目/事件/产品周期回顾。

### 段落骨架
1. 起点（目标/约束/资源）
2. 关键节点（按时间或里程碑列 3–5 个）
3. 哪里赌对了（具体决策 + 后果）
4. 哪里翻车了（具体决策 + 损失，**不回避**）
5. 数据（核心指标的前后对比）
6. 下次会怎么做（3 条具体动作）

### 一句话范例
"做了 6 个月的产品下线了——20 万投入换来的 5 个教训"

### 反例避坑
- 全是赢的部分（翻车段是复盘文最值钱的）
- 没数据（"做得不错"vs"DAU 从 200 到 3500"差很多）

---

## 框架选择判断顺序

Sub-Agent B 按以下顺序判断（自上而下，第一个命中为准）：

1. 素材含完整项目周期（开始-中间-结束 + 数据） → **复盘型**
2. 素材含 5+ 项资源/工具/书 → **清单型**
3. 素材含明确评测/对比对象 → **对比型**
4. 素材含人物/经历/对话 → **故事型**
5. 选题与最近 7 天时事/新闻强关联 → **热点解读型**
6. 素材为纯思考/无具体外部数据 → **纯观点型**
7. 默认（教程/工具/方法类） → **痛点型**

输出格式：
```
SELECTED_FRAMEWORK: 痛点型
REASON: 用户素材是 Cursor 配置教程，符合"教程/工具"默认分类
```
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/run-all.js 2>&1 | grep -A2 wechat-frameworks`
Expected: 4 个测试全部 PASS

- [ ] **Step 5: 提交**

```bash
git add skills/wechat/references/frameworks.md tests/skills/wechat-frameworks.test.js
git commit -m "feat(wechat): 新增 7 类写作框架库 frameworks.md"
```

---

## Task 2: 创建 enhancements.md（4 类增强 + 映射）

**Files:**
- Create: `skills/wechat/references/enhancements.md`
- Test: `tests/skills/wechat-enhancements.test.js`

- [ ] **Step 1: 写测试 wechat-enhancements.test.js**

```js
// tests/skills/wechat-enhancements.test.js
const fs = require('fs');
const path = require('path');

const ENH_PATH = path.join(__dirname, '..', '..', 'skills', 'wechat', 'references', 'enhancements.md');

test('enhancements.md 文件存在', () => {
  assert.ok(fs.existsSync(ENH_PATH), 'enhancements.md 不存在');
});

test('enhancements.md 含 4 类增强策略', () => {
  const content = fs.readFileSync(ENH_PATH, 'utf8');
  ['角度发现', '密度强化', '细节锚定', '真实体感'].forEach(name => {
    assert.ok(content.includes(`## ${name}`), `缺少策略: ${name}`);
  });
});

test('enhancements.md 含 7 行映射表覆盖全部框架', () => {
  const content = fs.readFileSync(ENH_PATH, 'utf8');
  ['痛点型', '故事型', '清单型', '对比型', '热点解读型', '纯观点型', '复盘型'].forEach(fw => {
    assert.ok(content.includes(`| ${fw} `), `映射表缺少框架: ${fw}`);
  });
});

test('热点解读型和纯观点型必启用角度发现', () => {
  const content = fs.readFileSync(ENH_PATH, 'utf8');
  const lines = content.split('\n');
  const hotline = lines.find(l => l.startsWith('| 热点解读型'));
  const opinionline = lines.find(l => l.startsWith('| 纯观点型'));
  assert.ok(hotline && hotline.includes('角度发现'), '热点解读型应必启用角度发现');
  assert.ok(opinionline && opinionline.includes('角度发现'), '纯观点型应必启用角度发现');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/run-all.js 2>&1 | grep -A2 wechat-enhancements`
Expected: FAIL，提示 enhancements.md 不存在

- [ ] **Step 3: 创建 enhancements.md**

写入 `skills/wechat/references/enhancements.md`：

```markdown
# 写中主动增强策略

不是写后修补，而是写之前就被这些指令约束。Sub-Agent B 选完框架后从映射表查"必启用 + 推荐启用"，把对应策略展开成 prompt 指令注入写作 system prompt。

L1–L4 写后质检（playbook.md）继续作为兜底，二者互补。

---

## 角度发现

### 做什么
找到主流观点之外的第二/第三角度，至少给出 1 个反共识切入。

### 触发示例
- 主流："X 工具好用"
- 启用后："但 X 在 Y 场景反而比 Z 慢，因为它的索引策略不适合大文件"

### 注入指令模板
> 写作时刻意避开"大家都在说"的角度。文章中至少 1 个段落以"但是 / 不过 / 反过来看"起头，提供一个反共识但有数据/案例支撑的切入点。

---

## 密度强化

### 做什么
每 200 字至少 1 个具体数字/案例/引述。删掉抽象空话。

### 触发示例
- 抽象："这个方法能显著提升效率"
- 启用后："这个方法把我每周写周报的时间从 3 小时压到 22 分钟"

### 注入指令模板
> 写作时每 200 字必须有 1 个具体锚点（数字 / 案例 / 引述 / 对比）。检查每段：如果整段没有具体锚点，必须补一个或删掉这段。"显著 / 大幅 / 极大" 等模糊副词替换为数字。

---

## 细节锚定

### 做什么
用具体名字/时间/地点/产品代替泛指。

### 触发示例
- 泛指："某大厂去年做了一次重构"
- 启用后："字节 2024 Q3 把推荐系统从 Spark 迁到了 Flink"

### 注入指令模板
> 文章中禁止"某公司 / 某产品 / 某团队 / 某次"。所有指代必须落到具体名字、年份、产品版本号。无法落实的细节就删掉，不要保留模糊描述。

---

## 真实体感

### 做什么
用感官词、第一人称、对话还原现场。

### 触发示例
- 平淡："用起来感觉不错"
- 启用后："打开时我愣了 3 秒——左上角那个红点是新功能？点进去发现它把我半年没整理的 Tab 全分了类"

### 注入指令模板
> 关键节点（首次使用 / 转折时刻 / 决策瞬间）用第一人称 + 感官词（看到 / 听到 / 想到 / 卡顿了一下）还原现场。允许穿插对话或心理活动。避免"经过测试发现 / 经过调研得知"这类报告腔。

---

## 框架 → 增强映射表

| 框架 | 必启用 | 推荐启用 |
|------|--------|----------|
| 痛点型 | 密度强化 + 细节锚定 | 真实体感 |
| 故事型 | 真实体感 + 细节锚定 | — |
| 清单型 | 密度强化 | 细节锚定 |
| 对比型 | 密度强化 + 真实体感 | — |
| 热点解读型 | **角度发现** | 密度强化 |
| 纯观点型 | **角度发现** + 密度强化 | — |
| 复盘型 | 真实体感 + 密度强化 | 细节锚定 |

---

## 输出元信息格式

Sub-Agent B 在草稿末尾追加 HTML 注释行（不显示到正文）：

```html
<!-- 框架: 痛点型 | 增强: 密度强化+细节锚定+真实体感 -->
```
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/run-all.js 2>&1 | grep -A2 wechat-enhancements`
Expected: 4 个测试全部 PASS

- [ ] **Step 5: 提交**

```bash
git add skills/wechat/references/enhancements.md tests/skills/wechat-enhancements.test.js
git commit -m "feat(wechat): 新增 4 类内容增强策略 enhancements.md"
```

---

## Task 3: 改造 Sub-Agent A（3 路调研 + history dedup + 打分）

**Files:**
- Modify: `skills/wechat/SKILL.md`（Sub-Agent A 段，约 223–247 行）
- Test: `tests/skills/wechat-history-dedup.test.js`

- [ ] **Step 1: 写测试**

```js
// tests/skills/wechat-history-dedup.test.js
const fs = require('fs');
const path = require('path');

const SKILL_PATH = path.join(__dirname, '..', '..', 'skills', 'wechat', 'SKILL.md');

test('Sub-Agent A 含 history.yaml dedup 指令', () => {
  const content = fs.readFileSync(SKILL_PATH, 'utf8');
  assert.ok(/读取.*history\.yaml/.test(content), 'Sub-Agent A 缺少读取 history.yaml 的指令');
  assert.ok(/相似度.*70/.test(content) || /dedup|去重/.test(content), '缺少去重逻辑描述');
});

test('Sub-Agent A 含 3 路 YouMind 调研', () => {
  const content = fs.readFileSync(SKILL_PATH, 'utf8');
  assert.ok(content.includes('行业热点'), '缺少"行业热点"路');
  assert.ok(content.includes('破圈话题'), '缺少"破圈话题"路');
  assert.ok(content.includes('竞品对标'), '缺少"竞品对标"路');
});

test('Sub-Agent A 含 3 维打分', () => {
  const content = fs.readFileSync(SKILL_PATH, 'utf8');
  assert.ok(/热度.*0\.4|权重.*热度/.test(content), '缺少热度维度');
  assert.ok(/相关性.*0\.4|权重.*相关性/.test(content), '缺少相关性维度');
  assert.ok(/SEO.*0\.2|权重.*SEO/.test(content), '缺少 SEO 维度');
});

test('Sub-Agent A 输出 1 推荐 + 3 备选', () => {
  const content = fs.readFileSync(SKILL_PATH, 'utf8');
  assert.ok(/RECOMMENDED|推荐.*1/.test(content), '缺少推荐输出');
  assert.ok(/ALTERNATIVES|备选.*3|备选 3/.test(content), '缺少 3 备选输出');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/run-all.js 2>&1 | grep -A2 wechat-history`
Expected: FAIL（缺少 3 路调研 / dedup / 打分 / 备选 等内容）

- [ ] **Step 3: 修改 SKILL.md 中 Sub-Agent A 段**

把 SKILL.md 中"**子 Agent A — 热点研究 + 选题**"整段（约 223–247 行）替换为：

```
**子 Agent A — 热点研究 + 选题（多路调研 + 历史去重 + 打分）**

```
你是热点选题 agent，任务是从多路热点中筛出适合该公众号发布的选题。

## 品牌信息（来自 ~/.taozi/brand/voice.md）
<voice.md 内容，含行业/目标读者/内容方向/禁用词>

## 执行步骤

### 步骤 1：安装 YouMind CLI（如未安装）
youmind --help > /dev/null 2>&1 || npm install -g @youmind-ai/cli

### 步骤 2：读取历史选题（去重池）
读取 wechat/history.yaml，提取近 30 天 articles[].keywords 字段为去重池。
若文件不存在或为空，去重池为空集，继续后续步骤（不报错）。

### 步骤 3：3 路并行 YouMind 调研
从 voice.md 提取行业关键词 <INDUSTRY> 和领域关键词 <DOMAIN>，并行调用：

路 1（行业热点 — 模拟微博/知乎热榜）：
youmind call webSearch '{"query":"<INDUSTRY> 本周热点 trending 讨论度高","timeRange":"7d","limit":10}'

路 2（破圈话题 — 模拟抖音/小红书爆款）：
youmind call webSearch '{"query":"<INDUSTRY> 出圈 跨界 普通人也在聊","timeRange":"7d","limit":10}'

路 3（竞品对标 — 同行高赞）：
youmind call webSearch '{"query":"<DOMAIN> 头部公众号 近期高赞文章主题","timeRange":"14d","limit":10}'

3 路任一失败：用剩余路结果，最终输出标注"仅 N 路数据"。
3 路全失败：报错并提示用户检查 YouMind 配置，停止。

### 步骤 4：合并去重 + history 过滤
- 合并 3 路结果，按标题语义相似度合并重复项（同义不同表述算一条）
- 用步骤 2 的去重池过滤：候选与历史关键词相似度 >70% 直接淘汰
- 候选池为空 → 提示用户放宽时间窗口或换关键词，停止

### 步骤 5：3 维打分（每候选 0–10 分，加权汇总）
- 热度（权重 0.4）：出现路数（1 路=3，2 路=6，3 路=10）
- 相关性（权重 0.4）：与品牌定位语义匹配度（你自己评估）
- SEO（权重 0.2）：标题是否含搜索高频词（参考 YouMind 返回的搜索量提示）

汇总分 = 热度 × 0.4 + 相关性 × 0.4 + SEO × 0.2

取 top 10 候选 → 选汇总分最高 1 个为推荐 + 接下来 3 个为备选。

### 步骤 6：输出格式
TOPICS_DONE
RECOMMENDED: <标题1> | 热度<x>/相关性<y>/SEO<z> 汇总<总> | <一句话推荐理由>
ALTERNATIVES:
  1. <标题2> | 热度/相关性/SEO 汇总 | 理由
  2. <标题3> | 热度/相关性/SEO 汇总 | 理由
  3. <标题4> | 热度/相关性/SEO 汇总 | 理由
DATA_NOTE: <"3 路完整数据" 或 "仅 N 路数据 — 缺失原因">
```

收到选题后，**询问用户选择哪个**（或提供自己的主题），等待确认后再派写作 Agent。
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/run-all.js 2>&1 | grep -A2 wechat-history`
Expected: 4 个测试全部 PASS

- [ ] **Step 5: 提交**

```bash
git add skills/wechat/SKILL.md tests/skills/wechat-history-dedup.test.js
git commit -m "feat(wechat): Sub-Agent A 升级为 3 路调研 + history 去重 + 3 维打分"
```

---

## Task 4: 改造 Sub-Agent B（框架选择 + 增强注入）

**Files:**
- Modify: `skills/wechat/SKILL.md`（Sub-Agent B 段，约 251–290 行）

- [ ] **Step 1: 写测试（追加到现有测试文件）**

在 `tests/skills/wechat-history-dedup.test.js` 末尾追加：

```js
test('Sub-Agent B 含框架选择步骤', () => {
  const content = fs.readFileSync(SKILL_PATH, 'utf8');
  assert.ok(/Read.*frameworks\.md|references\/frameworks\.md/.test(content), 'Sub-Agent B 缺少 Read frameworks.md 指令');
  assert.ok(/SELECTED_FRAMEWORK/.test(content), '缺少框架选择输出标识');
});

test('Sub-Agent B 含增强策略注入步骤', () => {
  const content = fs.readFileSync(SKILL_PATH, 'utf8');
  assert.ok(/Read.*enhancements\.md|references\/enhancements\.md/.test(content), 'Sub-Agent B 缺少 Read enhancements.md 指令');
  assert.ok(/必启用|启用增强/.test(content), '缺少增强启用描述');
});

test('Sub-Agent B 输出元信息含框架名 + 增强项', () => {
  const content = fs.readFileSync(SKILL_PATH, 'utf8');
  assert.ok(/<!-- 框架:.*增强:/.test(content), '缺少草稿元信息格式');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/run-all.js 2>&1 | grep -A2 wechat-history`
Expected: 新增的 3 个测试 FAIL

- [ ] **Step 3: 修改 SKILL.md 中 Sub-Agent B 段**

在 Sub-Agent B 当前"### 步骤 1：YouMind 深度研究"**之前**插入新步骤 0（保留原有所有步骤，只加前置），具体改动：

把 Sub-Agent B 的步骤段从：
```
### 步骤 1：YouMind 深度研究
```

改为：
```
### 步骤 0：选择写作框架 + 准备增强指令

a) 读取 `skills/wechat/references/frameworks.md`，按"框架选择判断顺序"判定本文应使用的框架。
   输出（写到草稿元信息备用）：
   SELECTED_FRAMEWORK: <框架名>
   REASON: <一句话理由>

b) 读取 `skills/wechat/references/enhancements.md`，从"框架 → 增强映射表"查询本框架对应的"必启用"和"推荐启用"策略。

c) 把以下内容拼接进本 Agent 的写作 system prompt（在步骤 2 撰写前）：
   - 选定框架的"段落骨架"完整文本
   - 必启用策略的"注入指令模板"完整文本
   - 推荐启用策略的"注入指令模板"完整文本（如适用）

文件缺失处理：
- frameworks.md 缺失 → 警告"框架库缺失，回退原写作流程"，跳过 a/b/c，沿用旧流程
- enhancements.md 缺失 → 警告"增强库缺失，跳过增强注入"，仅按框架骨架写

### 步骤 1：YouMind 深度研究
```

并把原"### 步骤 4：插入章节配图占位符 + 保存草稿"末尾追加一行说明：

```
**草稿元信息**：在草稿末尾追加 HTML 注释行（位于全部内容最末，不影响显示）：
<!-- 框架: <SELECTED_FRAMEWORK> | 增强: <实际启用的增强项，+ 号连接> -->
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/run-all.js 2>&1 | grep -A2 wechat-history`
Expected: 全部测试 PASS（含 Task 3 的 4 个 + Task 4 新增的 3 个）

- [ ] **Step 5: 提交**

```bash
git add skills/wechat/SKILL.md tests/skills/wechat-history-dedup.test.js
git commit -m "feat(wechat): Sub-Agent B 加入框架选择 + 增强策略前置注入"
```

---

## Task 5: Sync Codex + 全量测试 + 文档同步

**Files:**
- Run: `scripts/sync-codex.js`
- Run: `tests/run-all.js`
- Modify (如需要): `CLAUDE.md`、`README.md`

- [ ] **Step 1: Sync Codex 适配层**

```bash
node scripts/sync-codex.js
```

Expected: 输出含 `Synced 36 agents and 72 skills for Codex.`（数字以实际为准）

- [ ] **Step 2: 全量测试**

```bash
node tests/run-all.js
```

Expected: `总计: N | ✓ 通过: N | ✗ 失败: 0`（N = 800 + 11 = 811 左右）

- [ ] **Step 3: 检查 CLAUDE.md 触发表是否需更新**

```bash
grep -n "wechat" /Users/echorenyuan/Coding/TaoZi/taozi-plugin/CLAUDE.md
```

如果触发表里 `/taozi:wechat` 的描述还是旧的"YouMind 一次搜索 + 单 Agent 写作"，更新为：
"3 路 YouMind 调研 + 历史去重 + 3 维打分选题；7 框架库 + 4 类增强主动注入"

否则跳过本步。

- [ ] **Step 4: 检查 README.md 描述是否需更新**

```bash
grep -n "/taozi:wechat" /Users/echorenyuan/Coding/TaoZi/taozi-plugin/README.md | head -5
```

如果 wechat skill 描述含"单源热点 / 单次 webSearch"等旧表述，更新为反映新能力的描述（多路调研 / 框架库 / 写中增强）。

否则跳过本步。

- [ ] **Step 5: 提交（若有改动）**

```bash
git add .codex/ .agents/ CLAUDE.md README.md
git commit -m "chore: sync-codex 同步 wewrite 吸收改动 + 更新触发描述"
```

如果 Step 3/4 没改动且 sync-codex 也无产物变化，本 Step 跳过。

- [ ] **Step 6: 最终全量测试再跑一次**

```bash
node tests/run-all.js
```

Expected: 全绿

---

## Self-Review

**1. Spec coverage**：
- 设计文档第 3 节（写作骨架） → Task 1 ✓
- 设计文档第 4 节（内容增强） → Task 2 + Task 4 步骤 3 ✓
- 设计文档第 5.1 节（history dedup） → Task 3 步骤 2/4 ✓
- 设计文档第 5.2 节（YouMind 三路 + 打分） → Task 3 步骤 3/5/6 ✓
- 设计文档第 6 节（错误处理） → 分散到 Task 3 步骤 3/4、Task 4 步骤 3"文件缺失处理"段 ✓
- 设计文档第 7 节（测试策略） → Task 1/2/3/4 各自的 Step 1（含全部所列测试文件）✓

**2. Placeholder scan**：
- 所有 `<INDUSTRY>` `<DOMAIN>` 标记是 prompt 模板占位符（运行时由 voice.md 解析填入），非"待实现"。
- 无 TBD/TODO/「待补充」等真正占位符。

**3. Type consistency**：
- `SELECTED_FRAMEWORK` / `REASON` / `RECOMMENDED` / `ALTERNATIVES` / `DATA_NOTE` 标识在 Task 3/4/test 三处一致。
- 元信息格式 `<!-- 框架: X | 增强: Y -->` 在 enhancements.md、Task 4 步骤 3、Task 4 测试三处一致。

无未解决问题。
