# Changelog

All notable changes to Taozi Plugin are documented here.

---

## [4.3.0] - 2026-04-18

### Added

- **小红书配图风格库**：12 种视觉风格（cute/fresh/warm/bold/minimal/retro/pop/notion/chalkboard/study-notes/screen-print/sketch-notes）× 8 种布局（sparse/balanced/dense/list/comparison/flow/mindmap/quadrant）× 3 种配色（macaron/warm/neon），参考 baoyu-xhs-images 实现；写作完成后展示风格推荐，用户确认后后台生成，reference chain 保证视觉一致性
- **微信信息图支持**：章节配图自动识别数据/对比/流程/层级类内容，切换为专业信息图生成模式（10 种风格 × 10 种布局，参考 baoyu-infographic）；普通章节保持原有插画流程
- **`newspaper` 主题**：新增报纸编辑风排版主题（衬线字体、双线标题分割、奶油纸背景 `#faf8f4`），设为 wechat 默认主题

### Fixed

- **wechat 路径全量修复**：`SKILL.md` 和 5 个 reference 文档中残留的 `wechat-article`、`wechat-articles/` 旧路径全部更正，发布脚本路径 404 导致配图上传失败的 bug 彻底修复
- **图片占位符验证**：`wechat_publish.py` 发布前扫描未替换的本地图片占位符，文件名与 `--images` 参数不匹配时主动报错，不再静默成功
- **wechat-key-check.js 提示文字**：错误消息中的旧路径 `wechat-articles/style.yaml` 更正为 `~/.taozi/platforms/wechat/style.yaml`

### Changed

- **图片生成后台化**：wechat 子 Agent C 和 xiaohongshu 配图 sub-agent 均改为 `run_in_background: true`，写作完成后主对话立即解锁，图片生成和发布完成后 `PushNotification` 通知用户
- **图片生成并行化**：wechat 章节配图（最多 4 张）和 xiaohongshu 配图（最多 7 张）改为多 sub-agent 并行轮询，从串行最坏 17 分钟降至约 3-5 分钟

---

## [4.2.0] - 2026-04-18

### Added

- **`/taozi:xiaohongshu`**：小红书全链路 skill（热点选题 → YouMind 研究 → 正文/标题/话题标签 → AI 多图生成，视觉一致性通过封面图 --ref 机制保证）

### Changed

- **`wechat-article` → `wechat`**：skill 名与平台名对齐，触发改为 `/taozi:wechat`
- **删除 `create` skill**：全能式全链路入口不再维护，通用调度走 `/taozi`，平台专项走 `/taozi:wechat` / `/taozi:xiaohongshu`

---

## [4.1.0] - 2026-04-17

### Added

- **`/taozi:setup` 配置向导**：交互式向导，首次使用一键创建 `~/.taozi/` 完整目录结构（config.yaml、brand/voice.md、brand/playbook.md、brand/character.md、platforms/wechat/style.yaml）

### Changed

- **`~/.taozi/` 四层配置体系**：`~/.taozi/config.yaml` → `~/.taozi/platforms/<platform>/style.yaml` → `./.taozi/platforms/<platform>/style.yaml` → `./<platform>/style.yaml`，高层覆盖低层
- **`wechat-article` 路径迁移**：草稿保存至 `./wechat/drafts/`，发布历史写入 `./wechat/history.yaml`（原 `wechat-articles/` 废弃）
- **品牌人设 `voice.md` 全链路透传**：`content` + `create` skill 自动读取 `~/.taozi/brand/voice.md` 并注入写作风格
- **YouMind Key 统一读取**：`image`、`ppt`、`webpage`、`research`、`clip` 统一先读 `~/.taozi/config.yaml`，env var 作为 fallback
- **`wechat_publish.py` 配置重构**：`load_config()` 替换为 `load_taozi_config()` + `load_brand_file()`，支持四层合并、PyYAML 不可用时回退 stdlib 解析器

### Migration

从 4.0.0 升级：
1. 运行 `/taozi:setup` 创建 `~/.taozi/` 结构并迁移凭据
2. `mv wechat-articles/drafts wechat/drafts && mv wechat-articles/history.yaml wechat/history.yaml`
3. 旧 `wechat-articles/style.yaml` 凭据已迁至 `~/.taozi/platforms/wechat/style.yaml`，可删除旧目录

---

## [4.0.0] - 2026-04-17

### BREAKING CHANGES

- **commands/ 目录彻底废除**：官方 Claude Code "Custom commands have been merged into skills"，所有 `/taozi:xxx` 触发统一走 `skills/*/SKILL.md`
- **11 个 skill 去 `taozi-` 前缀**（插件命名空间 `taozi:` 已负责区分，前缀冗余）

  | 旧触发 | 新触发 |
  |---|---|
  | `/taozi:taozi-plan` | `/taozi:plan` |
  | `/taozi:taozi-verify` | `/taozi:verify` |
  | `/taozi:taozi-code-review` | `/taozi:code-review` |
  | `/taozi:taozi-quality-gate` | `/taozi:quality-gate` |
  | `/taozi:taozi-tdd` | `/taozi:tdd` |
  | `/taozi:taozi-model-route` | `/taozi:model-route` |
  | `/taozi:taozi-context-update` | `/taozi:update-context` |
  | `/taozi:taozi-router` | `/taozi:taozi` |
  | `/taozi:taozi-multi-agent` | `/taozi:multi-plan` |
  | `/taozi:taozi-git-workflow` | `/taozi:git-workflow` |
  | `/taozi:taozi-learning` | `/taozi:learning` |

### Changed

- **33 个 command 全量迁移至 skills**（分 3 个 PR 渐进）：
  - Phase 1：删除 7 个已薄包装 command（clip/content/images/ppt/research/webpage/wechat-article）
  - Phase 2：11 个 skill 去前缀 + 14 个 C 类 command 合并（plan/verify/code-review/quality-gate/tdd/model-route/update-context/taozi/multi-plan/learn/commit+pr+cleanup+worktree）
  - Phase 3：新建 12 个 D 类 skill（build-fix/checkpoint/create/evolve/harness-audit/instinct-{export,import,status}/multi-execute/security-scan/skill-create/ultra-think）
- `.claude-plugin/plugin.json` 移除 `"commands": "./commands"` 字段
- `scripts/hooks/block-random-md.js` allowedDirs 移除 `'commands'`
- 文档同步：CLAUDE.md / README.md / DEVELOPER.md / AGENTS.md / package.json

### 升级指南

用户只需在脑子里把 `/taozi:taozi-*` 读作 `/taozi:*` 即可（去掉多余的 `taozi-` 前缀）；`/taozi:taozi-router` 改成 `/taozi:taozi`。所有原功能保留，仅触发路径变更。

---

## [3.5.0] - 2026-04-17

### Changed

- **Skill 去厂商前缀**：7 个 `youmind-*` skill 重命名为纯能力名（`youmind-webpage` → `webpage`，`youmind-ppt` → `ppt`，`youmind-clip` → `clip`，`youmind-image` → `image`，`youmind-research` → `research`，`youmind-content` → `content`，`youmind-wechat-article` → `wechat-article`）——厂商是实现细节，不出现在名称里，便于未来换厂商或自研
- **Command 薄包装**：6 个与 skill 重复实现逻辑的 command（webpage / ppt / clip / images / research / content）改为委托模式，逻辑收归 skill 单一事实来源，净删除约 4700 行重复代码

---

## [3.4.0] - 2026-04-17

### Added

- **`youmind-wechat-article` skill**：微信公众号文章全链路
  - 热点抓取（`fetch_hotspots.py`）→ YouMind 深度研究 → AI 写作 → 封面图生成 → 草稿箱发布
  - 首次运行自动初始化 `wechat-articles/` 工作目录（style.yaml / history.yaml / playbook.md / character.md）
  - 凭据管理：style.yaml 直接填值，支持 `$VAR_NAME` 引用任意环境变量
  - `wechat_publish.py`：Markdown → 微信 HTML（内联样式）→ 上传封面 → 推草稿箱
- **`character.md` 封面角色支持**：项目初始化自动创建，有内容时每张封面自动包含固定 IP 角色
- **`wechat-key-check` hook**：执行微信 API 相关命令前自动检查 `WECHAT_APPID` / `WECHAT_APPSECRET` 配置
- **封面图海报风格**：大字中文标题 + 场景视觉，`quality: medium`（~2MB，避免超时）

### Fixed

- 修复 7 个 `youmind-*` skill 的 frontmatter 测试失败（`triggers` 多行 YAML → 逗号分隔字符串）
- 移除 `wechat_publish.py` 中硬编码的私有代理地址（`10.8.0.1:9527`），改为空默认值
- 微信封面图自动裁切到 900×383（修复错误码 53401"封面图片尺寸不合法"）

### Changed

- `wechat-articles/` 加入 `.gitignore`（含凭据，不应提交到版本控制）
- `**/__pycache__/`、`*.pyc`、`*.pyo` 加入 `.gitignore`
- 封面图 prompt 改为海报风格（之前模板包含"无文字"限制，现在明确要求大字标题）

---

## [3.3.0] - 2026-04-17

### Added

- `youmind-clip` skill：内容采集与分析（URL → AI 深度解读 → YouMind Board 归档）
- `youmind-content` skill：多平台内容创作（小红书 / 公众号 / 抖音 / X）
- `youmind-ppt` skill：AI PPT 生成（返回封面图预览 + Craft 编辑链接）
- `youmind-webpage` skill：网页生成（描述 → 可访问的 CDN 链接）
- 热点研究 + 多平台内容创作工作流

---

## [3.2.2] - 2026-04

### Added

- `youmind-image` skill：AI 图片生成（Gemini 多模型）
- `youmind-research` skill：热点研究与调研分析
