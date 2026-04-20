# Changelog

All notable changes to Taozi Plugin are documented here.

---

## [5.0.2] - 2026-04-20

### Fixed

- **小红书 skill 图片路径冲突**：同一天生成多篇笔记时，第二篇会覆盖第一篇的配图。将图片目录由 `images/<YYYYMMDD>/` 改为 `images/<YYYYMMDD>-<title_slug>/`，每篇笔记使用独立目录，互不干扰。

---

## [5.0.1] - 2026-04-20

### Fixed

- **微信公众号 skill 图片路径冲突**：同一天生成多篇文章时，第二篇会覆盖第一篇的章节配图。将图片目录由 `images/<YYYYMMDD>/` 改为 `images/<YYYYMMDD>-<slug>/`，每篇文章使用独立目录，互不干扰。

---

## [5.0.0] - 2026-04-19

### Added

- **全栈语言覆盖 — 9 门语言三件套完整支持**：taozi 从 TypeScript 单语言扩展为真正的全栈工具，覆盖 TypeScript/Python/Go/Java/Rust/Kotlin/C++/C#/Flutter 共 9 门语言，每门语言提供 reviewer（专项审查）、build-resolver（构建修复）、patterns（惯用法 skill）三件套。
- **新增 13 个语言专项 agent**：
  - `python-build-resolver`：ModuleNotFoundError、pip/uv/poetry 冲突、mypy、虚拟环境
  - `go-build-resolver`：undefined/类型不匹配、module 路径不一致、CGO 编译
  - `java-build-resolver`：cannot find symbol、dependency hell、Spring Bean 注入失败
  - `rust-reviewer`：unsafe 合规、所有权/借用/生命周期、async 阻塞（CRITICAL/HIGH/MEDIUM 分级）
  - `rust-build-resolver`：生命周期标注缺失、借用冲突、trait 未实现、feature flag
  - `kotlin-reviewer`：GlobalScope 协程泄漏、`!!` 滥用、Java 互操作陷阱、Compose 性能
  - `kotlin-build-resolver`：Gradle、kapt 注解处理失败、Compose 编译器版本不匹配
  - `cpp-reviewer`：内存安全（raw pointer/UAF/double-free）、UB、RAII 违反
  - `cpp-build-resolver`：头文件缺失、链接错误（undefined reference）、模板实例化、CMake
  - `csharp-reviewer`：async/await 死锁（.Result/.Wait()）、IDisposable 泄漏、LINQ 延迟求值
  - `csharp-build-resolver`：NuGet 依赖冲突（NU1107）、TFM 不兼容、EF migrations 不同步
  - `flutter-reviewer`：BuildContext 跨 async gap（mounted 检查）、setState 生命周期、Widget 重建性能
  - `flutter-build-resolver`：pubspec 版本冲突、native plugin 编译失败（Android/iOS）、Dart SDK 不兼容
- **新增 5 个 patterns skill**：`rust-patterns`、`kotlin-patterns`、`cpp-patterns`、`csharp-patterns`、`flutter-patterns`，每个覆盖该语言 3-5 个核心惯用法，含 ❌/✅ 对比示例。

### Changed

- **`build-error-resolver` 描述明确化**：description 更新为"TypeScript/Node.js 构建错误修复专家"，避免误导其他语言用户使用错误 agent。
- **`fullstack-developer` 覆盖范围扩展**：后端章节新增 Go/Java/Kotlin/Rust/C#；新增"移动端开发"节（Flutter/Dart）；相关 Skills 节补充 5 个新 patterns 引用。

---

## [4.6.0] - 2026-04-19

### Added

- **`/taozi:lark` 飞书万能链接助手（新 skill）**：给任意飞书链接（文档 `/docx/`、知识库 `/wiki/`、电子表格 `/sheets/`、多维表格 `/base/`），自动读取内容、分析结构、输出编号建议清单，逐步确认后写回。支持在项目目录下放 `.taozi/platforms/lark.yaml` 绑定默认知识库，无需每次提供链接。
- **setup 新增飞书平台选项**：第四步平台列表加入"飞书知识库（无需在此配置凭据，使用 `lark-cli auth login` 认证）"，引导用户创建 `.taozi/platforms/lark.yaml` 绑定项目。
- **xiaohongshu 项目配置层**：在 `~/.taozi/` 全局检查之后新增非阻断项目配置检查；`.taozi/platforms/xiaohongshu.yaml` 可覆盖 `image_count`、`ratio`、`strategy` 等格式参数；缺失时软提示（不阻断继续执行）。

### Changed

- **配置体系重构（3 层平铺 + 多账号）**：
  - 全局凭据集中存 `~/.taozi/config.yaml`（`wechat.accounts.<name>.appid/secret/author`，支持多账号）
  - 平台格式偏好改为平铺文件 `~/.taozi/platforms/<平台>.yaml`（去除旧子目录 `platforms/wechat/style.yaml`）
  - 项目绑定存 `.taozi/platforms/<平台>.yaml`，可指定 `account: <名称>` 引用多账号
  - 三级优先级：全局 config.yaml → 全局 platforms/wechat.yaml → 项目 .taozi/platforms/wechat.yaml
- **wechat 硬停改软引导**：`~/.taozi/platforms/wechat.yaml` 不存在时不再直接停止，改为 ⚠️ 软引导（初始化 / 跳过用环境变量），保持 `~/.taozi/` 目录缺失时仍硬停。
- **`wechat_publish.py` 配置加载升级**：`load_taozi_config()` 由四级合并改为三级合并（平铺路径）；`load_config()` 新增多账号提取逻辑（`wechat.accounts.<account_name>`），兼容旧版扁平格式（`wechat.appid/secret` 直接存放）。
- **setup config.yaml 格式升级**：生成模板改为多账号结构，注释说明 `wechat.accounts.default` 格式。

### Fixed

- **wechat_publish.py 配置路径与 SKILL.md 不一致**：原脚本读旧子目录路径 `platforms/wechat/style.yaml`，导致 SKILL.md 引导的新路径配置被静默忽略；已同步升级为 3 层平铺路径。
- **`pipeline.md` 旧路径文档残留**：Step 1 路径链和字段说明已更新至新架构（`wechat.accounts.default.appid`）。
- **lark skill `allowed-tools` 路径格式**：`find` 命令补全引号，`cat` 命令移除尾部通配符，修正 prefix 匹配错误。

---

## [4.5.0] - 2026-04-18

### Added

- **`skills/infographic/` 独立 skill**：从 wechat/xiaohongshu 两份重复定义合并而来，14 种布局（新增 iceberg / bridge / winding-roadmap / circular-flow）× 15 种风格（新增 xhs 独有 warm / minimal / notion / study-notes / screen-print），统一路径 `skills/infographic/references/`
- **image skill Context Mode**：新增内容感知配图中枢；wechat/xiaohongshu 传入结构化 context（platform / article_type / image_role / section_type / character / compatible_styles / palette），image skill 自主决策风格、角色注入、尺寸，不再需要用户确认风格
- **角色锚点注入规则**：封面图有 character.md → 必须注入角色锚点；body infographic → 不注入角色；body illustration + character → 注入；compatible_styles 为空时默认 `[warm, vector-illustration, flat design]`
- **wechat sub-agent C 品牌配置读取**：Step 0 读取 `character.md`（角色 + compatible_styles）+ `style.yaml`（palette），palette 注入封面和 illustration 类型 prompt
- **setup skill `compatible_styles` 字段**：character.md 模板新增 `compatible_styles` 字段，引导用户约束 image skill 可选风格范围
- **三层测试体系**（新增 29 个测试，总计 643 个）：
  - Layer 1 规则回归：`tests/skills/image-rules.test.js`（19 条）
  - Layer 2 Python3 集成：`tests/integration/brand-reader.test.js`（4 条）
  - Layer 3 Mock CLI：`tests/fixtures/mock-youmind.js` + `tests/integration/image-pipeline.test.js`（3 条）
  - Layer 4 E2E 框架：`tests/e2e/youmind-api.test.js`（3 条，无 API key 自动跳过）

### Fixed

- **xiaohongshu `--ref cover_url` 无效代码**：YouMind createChat API 无 ref 参数，改用 Style Anchor 文字注入实现系列视觉一致性
- **xiaohongshu 用户手动选风格**：移除 A/B/C 确认步骤，由 image skill Context Mode 自主决策
- **xiaohongshu infographic Style Anchor 冲突**：infographic 类型有独立 layout+style 指令，不再叠加 Style Anchor，避免风格矛盾
- **`dashboard-dark` 不存在风格名**：styles.md 推荐表次选项改为正确名称 `corporate-memphis-dark`
- **compatible_styles 默认值三处不一致**：image / wechat / xiaohongshu 统一为 `[warm, vector-illustration, flat design]`
- **setup 默认主题 `simple`**：改为 `newspaper`，与 wechat skill 的 fallback 默认值对齐
- **layouts.md 多方对比路由缺失**：新增"含多方对比（3+ 方）→ dashboard/bento-grid"条目，修复 5 款工具横评错误路由到 `binary-comparison`
- **wechat-key-check / youmind-key-check 仅检查 env**：改为优先读 `~/.taozi/` YAML 配置并解析 `$VAR` 引用，匹配 Python 脚本的实际读取逻辑
- **evaluate-session.js 永久死代码**：Stop 事件从不提供 `turn_count`，移除 `turnCount < 5` 判断门，改为每次 Stop 均写 learned 记录

### Changed

- **wechat 配图流程重构**：sub-agent B 改为输出 `article_type` + `SECTION_IMAGE_META_N`（含 section_type 和内容摘要），sub-agent C 读取品牌配置后应用 Context Mode 规则生图，封面 `aspectRatio: 16:9`（900×383），正文 `aspectRatio: 16:9`（800px 宽）
- **xiaohongshu 配图流程重构**：封面 `aspectRatio: 3:4`（1242×1660），正文 `aspectRatio: 1:1`（1080×1080），illustration 注入 Style Anchor，infographic 独立走 layouts/styles 推荐表
- **旧引用文件迁移**：`skills/xiaohongshu/references/xhs-card-styles.md` 和 `skills/wechat/references/infographic-styles.md` 已删除，内容并入 `skills/infographic/references/`

---

## [4.4.1] - 2026-04-18

### Fixed

- **wechat 图片占位符残留**：Agent C 子 Agent 改为输出 `SAVED: <path>` 确认，`--images` 参数改为 glob 收集（`ls wechat/images/YYYYMMDD/section-*.jpg`），发布前校验所有文件存在，防止 `[Image #1]` 占位符出现在正文
- **wechat 多轮漂移**：在 `skills/wechat/SKILL.md` 顶部注入 Iron Law + 逃逸借口表，无论对话进行多少轮 Claude 必须从第一步执行完整流程
- **sync Codex 适配层**：同步上述 wechat skill 变更到 `.agents/skills/`

---

## [4.4.0] - 2026-04-18

### Added

- **场景自动触发规则**：CLAUDE.md 新增 7 条场景 → skill 映射表，Claude Agent 在感知到需求描述、代码提交、发版等场景时主动触发对应 skill，无需用户手动输入指令
- **Agent 反模式警告**：CLAUDE.md 新增历史高频错误列表（忘跑 sync-codex、非法 .md 路径、frontmatter 嵌套、PostToolUse exit(2) 无效、发版漏更新版本号）
- **`code-review` Spec 对照阶段**：在 6 步质量审查前插入第 0 步，先对照需求来源验证"做了正确的事"，报告新增 Spec 对照节
- **`skill-create` TDD 验证**：创建 skill 后自动运行测试验证 frontmatter 格式合法，并 sync-codex 同步到 Codex 侧
- **`.claude/skills/` 纳入版本控制**：release、new-hook、run-tests、sync-codex 四个项目级 skill 现在跟随仓库分发
- **`/release` skill 增强**：新增 README 检查步骤（步骤 4），发版完成后询问是否推送远程（步骤 10）

### Fixed

- **sync-codex 健壮性**：agent 文件无/坏 frontmatter 时 skip+warn 不崩溃；skill 目录缺 SKILL.md 时跳过而非静默写入空目录
- **no-verify-guard 误拦截**：commit message 引号内包含 `--no-verify` 文字时不再被误拦截（剥离 `-m "..."` 内容后再检测 flag）
- **evaluate-session 垃圾记录**：Stop 事件 payload 无 `turn_count`/`conversation` 时 fallback 由 10 改为 0，不再写无效 learned 记录
- **wechat-key-check 覆盖缺口**：matcher 扩展覆盖 `wechat_publish.py` 直调场景（原仅匹配 curl 调用）
- **wechat_publish.py multipart boundary**：固定字符串改为 `uuid.uuid4()` 随机生成，消除二进制内容碰撞风险
- **block-random-md 冗余条目**：移除 allowedDirs 中无效的 `'README'` 条目

### Changed

- **CLAUDE.md 措辞修正**：`block-random-md` 描述从"拦截"更正为"输出警告"（PostToolUse 不具备拦截能力）
- **测试覆盖**：新增 7 个边界场景测试（共 609 个，0 失败）

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
