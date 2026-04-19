# Taozi 配置体系重设计

**日期：** 2026-04-19  
**状态：** 待审阅  
**范围：** 配置层级重构 + lark skill 新增 + setup/wechat/xiaohongshu 迁移

---

## 背景与问题

当前配置体系存在以下问题：

1. **路径不一致**：全局平台配置用子目录 `platforms/wechat/style.yaml`，设计上应改为平铺文件
2. **四级合并过重**：`wechat/style.yaml` 作为第 4 层覆盖，增加了认知负担，实际使用场景少
3. **凭据和偏好混放**：`~/.taozi/platforms/wechat/style.yaml` 同时存 appid/secret 和 theme/length，多账号场景无法支持
4. **无多账号支持**：同一台机器无法在不同目录使用不同微信号
5. **lark skill 用了独立的 `.lark.json`**：完全脱离现有体系
6. **skill 配置缺失时硬停**：报错而不是软引导
7. **setup 没有飞书入口**

---

## 设计目标

1. 全局只存"我是谁"（凭据 + 品牌身份）
2. 项目只存"这次做什么"（目标账号 + 格式偏好）
3. 路径全部平铺，去掉多余层级
4. 合并链从 4 层简化为 3 层
5. 多目录 × 多平台 × 多账号全部覆盖
6. skill 配置缺失时软引导而非硬停

---

## 配置层级设计

### 层级一：全局配置 `~/.taozi/`

**存什么：** 凭据 + 品牌身份。跨所有项目不变。**不提交 git。**

```
~/.taozi/
├── config.yaml              ← 所有平台凭据 + YouMind API Key
├── platforms/
│   ├── wechat.yaml          ← 微信全局默认格式偏好（不含凭据）
│   └── xiaohongshu.yaml     ← 小红书全局默认格式偏好（未来扩展）
└── brand/
    ├── voice.md             ← 品牌人设（账号名、行业、受众、语气、禁用词）
    ├── playbook.md          ← 通用写作规范
    └── character.md         ← 封面角色设定（可选）
```

**`~/.taozi/config.yaml` 格式（新）：**

```yaml
youmind:
  api_key: $YOUMIND_API_KEY

wechat:
  accounts:
    personal:
      appid: $WX_PERSONAL_APPID
      secret: $WX_PERSONAL_SECRET
      author: "元哥"
    company:
      appid: $WX_COMPANY_APPID
      secret: $WX_COMPANY_SECRET
      author: "公司账号"
  proxy: $KDP_WECHAT_PROXY      # 全局代理（可被项目层覆盖）

lark:
  # 飞书使用 lark-cli 统一认证，无需存 token
  # lark-cli auth login 已处理
```

**`~/.taozi/platforms/wechat.yaml` 格式（全局默认格式）：**

```yaml
format:
  length: "1200-2500"
  theme: newspaper
  digest_limit: 54
  cover_ratio: "16:9"
```

---

### 层级二：项目配置 `.taozi/`

**存什么：** 当前项目用哪个账号、格式偏好、目标知识库。**可提交 git（不含凭据）。**

```
.taozi/
├── platforms/
│   ├── wechat.yaml          ← 这个项目用哪个公众号 + 格式覆盖
│   ├── lark.yaml            ← 这个项目对应哪个飞书知识库
│   └── xiaohongshu.yaml     ← 小红书（未来扩展）
└── brand/                   ← 可选，覆盖全局品牌配置
    ├── voice.md
    └── character.md
```

**`.taozi/platforms/wechat.yaml` 格式：**

```yaml
account: personal            # 引用 ~/.taozi/config.yaml 中的账号名
proxy: $PROJECT_PROXY        # 可选，覆盖全局 proxy
format:
  length: "800-1200"         # 可选，覆盖全局格式
  theme: simple
```

**`.taozi/platforms/lark.yaml` 格式：**

```yaml
wiki_url: https://xxx.feishu.cn/wiki/SpaceXXX
description: 技术博客知识库   # 可选备注
```

---

### 层级三：输出目录 `./wechat/`、`./lark/` 等

**存什么：** 生成的内容产物。纯输出，不参与配置合并。

```
./wechat/
├── drafts/          ← 文章草稿
├── images/          ← 配图
└── history.yaml     ← 发布历史

./lark/
└── history.yaml     ← 操作历史（可选）
```

---

## 配置合并规则（3 层，由低到高）

```
层 1：~/.taozi/config.yaml + ~/.taozi/platforms/<平台>.yaml   （全局凭据 + 全局格式默认）
层 2：.taozi/platforms/<平台>.yaml                            （项目级账号选择 + 格式覆盖）
层 3：品牌文件 .taozi/brand/ 优先，回落 ~/.taozi/brand/        （品牌身份，跨层独立）
```

**移除的层：** ~~`wechat/style.yaml`~~ 第 4 层覆盖（简化，不再支持）

---

## 多目录 × 多账号覆盖示例

```
项目 A（个人博客）/
└── .taozi/platforms/
    ├── wechat.yaml   → account: personal
    └── lark.yaml     → wiki: 个人技术博客知识库

项目 B（公司运营）/
└── .taozi/platforms/
    ├── wechat.yaml   → account: company
    └── lark.yaml     → wiki: 公司产品文档知识库
```

两个目录各自独立，全局凭据统一管理，互不干扰。

---

## Skill 行为规范（统一）

所有平台 skill 统一遵守：

```
Step 1：读取项目层 .taozi/platforms/<平台>.yaml
  → 存在：读取并合并全局配置
  → 不存在：软引导（"未检测到项目配置，是否现在初始化？[Y/跳过]"）
             Y → 内联 2-3 个问题完成初始化，继续执行
             跳过 → 仅使用全局默认值继续（如有）

Step 2：读取全局凭据 ~/.taozi/config.yaml
  → 凭据缺失：提示运行 /taozi:setup

Step 3：读取品牌文件
  → .taozi/brand/ 优先，回落 ~/.taozi/brand/
```

---

## 各 Skill 改动详情

### setup/SKILL.md

| 项目 | 改动 |
|------|------|
| 新增飞书平台选项 | 选择飞书时提示：凭据通过 `lark-cli auth login` 处理，setup 不写 lark 凭据 |
| config.yaml 格式升级 | 写入新的多账号结构（`wechat.accounts.personal/company`） |
| 全局平台格式配置路径 | 从 `platforms/wechat/style.yaml`（子目录）改为 `platforms/wechat.yaml`（平铺） |
| 向下兼容 | 旧路径 `platforms/wechat/style.yaml` 读取时仍作为兜底 |

### wechat/SKILL.md

| 项目 | 改动 |
|------|------|
| 合并链从 4 层改为 3 层 | 移除 `wechat/style.yaml` 覆盖层 |
| 凭据读取路径 | 从 `platforms/wechat/style.yaml` → `config.yaml` 的 accounts 结构 |
| 项目层路径 | `.taozi/platforms/wechat/style.yaml` → `.taozi/platforms/wechat.yaml` |
| 全局格式默认路径 | `platforms/wechat/style.yaml` → `platforms/wechat.yaml` |
| 硬停改软引导 | 配置缺失时内联引导 |

### xiaohongshu/SKILL.md

| 项目 | 改动 |
|------|------|
| 项目层路径 | 新增读取 `.taozi/platforms/xiaohongshu.yaml` |
| 硬停改软引导 | 配置缺失时内联引导 |

### lark/SKILL.md（新增）

| 项目 | 内容 |
|------|------|
| 配置读取 | `.taozi/platforms/lark.yaml`（项目层） |
| 无全局凭据 | 飞书认证由 lark-cli 统一处理 |
| 软引导 | 配置缺失时引导创建 `.taozi/platforms/lark.yaml` |

---

## 向下兼容策略

| 旧路径 | 处理方式 |
|--------|---------|
| `~/.taozi/platforms/wechat/style.yaml` | 继续支持，作为低优先级兜底；提示用户迁移到新路径 |
| `wechat/style.yaml` | 不再读取；存量用户文件无害，直接忽略 |

---

## 需要改动的文件清单

| 文件 | 操作 |
|------|------|
| `skills/lark/SKILL.md` | 修改：配置路径改为 `.taozi/platforms/lark.yaml`，加软引导 |
| `skills/setup/SKILL.md` | 修改：新增飞书入口，config.yaml 多账号结构，路径平铺 |
| `skills/wechat/SKILL.md` | 修改：3 层合并，新路径，软引导 |
| `skills/xiaohongshu/SKILL.md` | 修改：新增项目层读取，软引导 |

---

## 验证方式

1. 新建目录，创建 `.taozi/platforms/lark.yaml`，触发 `/taozi:lark` → 自动读取 wiki_url
2. 两个目录各配不同 `account`，触发 `/taozi:wechat` → 各自使用对应的 appid
3. 不创建项目配置，触发任意平台 skill → 软引导而非报错
4. 旧路径 `~/.taozi/platforms/wechat/style.yaml` 存在时，wechat skill 仍然工作（兼容）
5. `node tests/run-all.js` 全部通过
