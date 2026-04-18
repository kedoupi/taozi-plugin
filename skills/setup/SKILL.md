---
name: setup
description: Taozi 配置向导：交互式引导创建 ~/.taozi/ 全局配置（YouMind key、品牌人设、平台凭据），一次配置，所有内容 skill 共享。新设备或新账号配置时使用。
triggers: "配置taozi,taozi配置,setup,初始化配置,配置微信,配置YouMind"
allowed-tools:
  - Bash([ -d "$HOME/.taozi" ]*)
  - Bash([ -f "$HOME/.taozi/config.yaml" ]*)
  - Bash([ -f "$HOME/.taozi/brand/voice.md" ]*)
  - Bash([ -d "$HOME/.taozi/platforms" ]*)
  - Bash(mkdir -p *)
  - Bash(python3 *)
---

# Taozi 配置向导

交互式引导创建 `~/.taozi/` 全局配置。一次配置，`/taozi:wechat`、`/taozi:xiaohongshu`、`/taozi:content` 等所有内容 skill 共享品牌信息和凭据。

---

## 第一步：检查现有配置

```bash
python3 -c "
import os, json
HOME = os.path.expanduser('~')
TAOZI = os.path.join(HOME, '.taozi')
files = {
    'config.yaml':              os.path.join(TAOZI, 'config.yaml'),
    'brand/voice.md':           os.path.join(TAOZI, 'brand', 'voice.md'),
    'brand/playbook.md':        os.path.join(TAOZI, 'brand', 'playbook.md'),
    'brand/character.md':       os.path.join(TAOZI, 'brand', 'character.md'),
    'platforms/wechat/style.yaml': os.path.join(TAOZI, 'platforms', 'wechat', 'style.yaml'),
}
status = {k: os.path.exists(v) for k, v in files.items()}
print(json.dumps(status))
"
```

向用户展示现有配置状态（✅已有 / ❌缺失），说明本次向导会创建或更新缺失的部分。

---

## 第二步：YouMind API Key

询问用户：
> YouMind API Key 是多少？（获取地址：https://youmind.com/settings/api-keys）
> 已有环境变量 `YOUMIND_API_KEY` 则可直接回车跳过。

获取回答后（若用户输入了 key），写入 `~/.taozi/config.yaml`：

```bash
mkdir -p "$HOME/.taozi"
```

**`~/.taozi/config.yaml` 内容**（写入时将 `<API_KEY>` 替换为用户输入，若跳过则写 `$YOUMIND_API_KEY`）：

```yaml
# Taozi 共享凭据 — 由 /taozi:setup 自动生成
# 所有内容 skill 共享，填写一次全局生效

youmind:
  api_key: <API_KEY>    # 获取：https://youmind.com/settings/api-keys
```

---

## 第三步：品牌人设

询问用户以下信息（可一次性问完，也可逐条确认）：

1. **账号名称**：公众号/账号叫什么？（如：硅星人）
2. **行业**：主要聚焦哪个领域？（如：AI/开发工具）
3. **目标读者**：主要受众是谁？（如：使用 Claude Code 的独立开发者）
4. **语气（tone）**：用一句话描述写作语气？（如：技术向，直接，不废话，像同行之间聊天）
5. **人设（voice）**：用一句话描述你的写作视角？（如：第一人称，Claude Code 深度用户，分享实用工具和工作流）
6. **禁用词**（可选）：有哪些词绝对不能出现？（如：颠覆、赋能、生态）

AI 可根据用户的描述推断建议并请用户确认，再写入文件。

写入 `~/.taozi/brand/voice.md`：

```bash
mkdir -p "$HOME/.taozi/brand"
```

**`~/.taozi/brand/voice.md` 内容**（填入用户提供的信息）：

```markdown
# 品牌人设（跨平台共享）
> 此文件被所有内容 skill 读取。修改后立即生效。

## 账号名称
<name>

## 行业
<industry>

## 目标读者
<target_audience>

## 语气（tone）
<tone>

## 人设（voice）
<voice>

## 禁用词
<blacklist 或留空>

## 参考账号风格
<!-- 可选，如：硅星人、AI产品手册 -->
```

同时写入 `~/.taozi/brand/playbook.md`（若已存在则跳过）：

```markdown
# 通用写作规范（跨平台）
> 平台特定规范（字数、格式）在各平台 style.yaml 中定义。

## 通用原则
- 开头不废话，第一句必须抓住读者
- 每段控制在 3-5 句，移动端适合短段落
- 用具体例子代替抽象描述
- 结尾有明确的行动点或思考问题

## 标题规范
- 禁用"最全"、"颠覆"、"赋能"等过度营销词
- 优先：数字 + 具体场景

## 内容结构
- 适合用"问题 → 分析 → 方案 → 行动"四段式
- 或"背景 → 核心观点 → 论据 → 结论"学术型

## 摘要要求
- 54 个汉字以内（微信限制）
- 是文章价值的浓缩，不是标题的重复

## 风格禁忌
- 不写 AI 味道的排比句
- 不写"首先…其次…最后…"的流水账
- 不写没有具体数据支撑的大词
```

同时写入 `~/.taozi/brand/character.md`（若已存在则跳过）：

````markdown
# 封面角色设定（跨平台共享）

> 填写下方角色描述后，每张封面图都会自动包含此角色。
> 保持空白（只有注释和示例）时，AI 会自由发挥封面视觉，不出现固定角色。
>
> 不确定如何写？直接告诉 AI：
> "帮我生成一个[科技感/可爱卡通/商务]风格的封面角色，写成 character.md 格式"

---

<!-- 示例（仅供参考，不影响生成）

外形：戴圆框眼镜的卡通熊猫，圆润体型，穿黑色卫衣，手持平板电脑
风格：卡通扁平插画，2D，线条干净
位置：封面右下角，半身像，不遮挡主标题文字
禁止：不出现真实人脸，不遮挡大字标题

-->

---

## 我的角色

<!-- 在这里填写你的角色。删除此注释并按示例格式描述即可。 -->

---

## compatible_styles

<!-- image skill 加角色时只从此列表选 Style，避免角色与风格冲突。
     留空时默认使用：[warm, vector-illustration, flat design]
     示例：[warm, hand-drawn, vector-illustration, watercolor]
-->

compatible_styles: []

---

## 封面图用法（16:9）

```
<!-- 填写封面图 prompt 模板。AI 会以此为基础追加场景描述。示例：
Magazine-style WeChat cover, 16:9 landscape.
Character: <你的角色英文描述>.
<背景和风格描述>.
-->
```

## 章节配图用法（16:9）

```
<!-- 填写章节配图 prompt 模板。AI 会替换 Scene: 部分为章节内容。示例：
WeChat article section illustration, 16:9 landscape.
Character: <你的角色英文描述>.
<背景和风格描述>.
-->
```
````

---

## 第四步：询问要配置哪些平台

询问用户：
> 要配置哪些发布平台？（可多选）
> 1. 微信公众号
> 2. 小红书（无需凭据，确认格式偏好）
> 3. 抖音（无需凭据，确认格式偏好）

---

## 第五步：平台凭据配置

### 微信公众号（若选择）

依次询问：
1. AppID（微信公众平台 → 设置与开发 → 基本配置）
2. AppSecret
3. 作者名（文章底部显示）
4. 代理地址（可选，没有代理则需配置微信 IP 白名单）

写入 `~/.taozi/platforms/wechat/style.yaml`：

```bash
mkdir -p "$HOME/.taozi/platforms/wechat"
```

**`~/.taozi/platforms/wechat/style.yaml` 内容**：

```yaml
# 微信公众号平台配置 — 由 /taozi:setup 自动生成
# 继承 ~/.taozi/brand/voice.md 的人设，只写微信特有内容

# 【必填】API 凭据
wechat:
  appid: <APPID>
  secret: <APPSECRET>
  author: "<AUTHOR>"

# 【可选】代理（绕过微信 IP 白名单）
proxy: <PROXY 或 $WECHAT_PROXY>

# 微信特有格式
format:
  length: "1200-2500"
  digest_limit: 54
  cover_ratio: "16:9"
  theme: "newspaper"    # simple | sspai | minimal | tech-modern | github | newspaper

# 【可选】配色方案（影响封面和配图的颜色风格；留空则由 image skill 根据风格自动决定）
# palette: "warm orange, cream white, soft coral"

# 封面叠字（可选）
# cover_text:
#   enabled: true
#   font_size: 52
#   color: "#FFFFFF"
#   shadow: true
#   position: "bottom"
#   max_chars_per_line: 14
```

### 小红书（若选择）

写入 `~/.taozi/platforms/xiaohongshu/style.yaml`（模板，无需凭据）。

### 抖音（若选择）

写入 `~/.taozi/platforms/douyin/style.yaml`（模板，无需凭据）。

---

## 第六步：完成报告

展示配置汇总：

```
✅ ~/.taozi/ 配置完成！

已配置：
  ~/.taozi/config.yaml           ← YouMind API Key
  ~/.taozi/brand/voice.md        ← 品牌人设
  ~/.taozi/brand/playbook.md     ← 通用写作规范
  ~/.taozi/brand/character.md    ← 封面角色（可选填写）
  ~/.taozi/platforms/wechat/style.yaml  ← 微信公众号配置

可选后续操作：
  📎 填写 ~/.taozi/brand/character.md 中的「我的角色」→ 封面图出现固定角色
  📎 可在任意项目建 ./.taozi/brand/voice.md 覆盖全局人设

现在可以运行：/taozi:wechat · /taozi:xiaohongshu
```

若选择了微信并配置了真实 AppID/Secret，额外提示 IP 白名单：

```
⚠️  微信 IP 白名单提醒：
若未配置代理，需将本机公网 IP 加入白名单，否则发布失败。
1. 运行 `curl -s https://ifconfig.me` 获取本机公网 IP
2. 登录微信公众平台 → 设置与开发 → 基本配置 → IP 白名单 → 编辑
```
