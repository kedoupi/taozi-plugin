# Changelog

All notable changes to Taozi Plugin are documented here.

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
