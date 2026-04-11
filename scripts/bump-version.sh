#!/usr/bin/env bash
# 用法: ./scripts/bump-version.sh [--dry-run] [--tag] <新版本号>
# 示例: ./scripts/bump-version.sh 3.3.0
#       ./scripts/bump-version.sh --dry-run 3.3.0   # 预览变更，不实际写入
#       ./scripts/bump-version.sh --tag 3.3.0        # 更新完成后自动打 git tag
#
# 同步以下所有版本号：
#   package.json                      → .version
#   .claude-plugin/plugin.json        → .version + .description
#   .claude-plugin/marketplace.json   → .plugins[0].version + .plugins[0].description
#   .codex-plugin/plugin.json         → .version + .description
#   README.md                         → 标题 "# Taozi Plugin X.Y.Z"

set -euo pipefail

DRY_RUN=0
AUTO_TAG=0
NEW_VERSION=""

# 解析参数
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --tag)     AUTO_TAG=1; shift ;;
    -*)        echo "未知选项: $1"; exit 1 ;;
    *)         NEW_VERSION="$1"; shift ;;
  esac
done

if [[ -z "$NEW_VERSION" ]]; then
  echo "用法: $0 [--dry-run] [--tag] <新版本号>"
  echo "示例: $0 3.3.0"
  exit 1
fi

# 校验版本号格式 (semver: X.Y.Z)
if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "错误：版本号格式不正确，必须为 X.Y.Z（如 3.3.0）"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

PACKAGE_JSON="$ROOT_DIR/package.json"
PLUGIN_JSON="$ROOT_DIR/.claude-plugin/plugin.json"
MARKETPLACE_JSON="$ROOT_DIR/.claude-plugin/marketplace.json"
CODEX_PLUGIN_JSON="$ROOT_DIR/.codex-plugin/plugin.json"
README="$ROOT_DIR/README.md"

# 获取当前版本
CURRENT_VERSION=$(python3 -c "import json; print(json.load(open('$PACKAGE_JSON'))['version'])")

echo "当前版本: $CURRENT_VERSION"
echo "新版本:   $NEW_VERSION"
[[ "$DRY_RUN" == "1" ]] && echo "[DRY-RUN 模式：不会写入任何文件]"
echo ""

# 校验版本号必须升序（防止误降版本）
python3 - <<PYEOF
from packaging.version import Version
import sys
cur = "$CURRENT_VERSION"
new = "$NEW_VERSION"
if Version(new) <= Version(cur):
    print(f"错误：新版本 {new} 必须大于当前版本 {cur}")
    sys.exit(1)
PYEOF

# 检查 git 工作区是否干净（dry-run 时跳过）
if [[ "$DRY_RUN" == "0" ]]; then
  if ! git -C "$ROOT_DIR" diff --quiet || ! git -C "$ROOT_DIR" diff --cached --quiet; then
    echo "错误：git 工作区有未提交的更改，请先 commit 或 stash 后再 bump 版本"
    git -C "$ROOT_DIR" status --short
    exit 1
  fi
fi

# 更新函数：dry-run 时只打印，否则实际写入
run_update() {
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[DRY-RUN] 将更新 $1"
  else
    python3 - "$2" "$NEW_VERSION" <<'PYEOF'
import json, re, sys

filepath, new_ver = sys.argv[1], sys.argv[2]

with open(filepath, "r") as f:
    data = json.load(f)

# package.json & plugin.json: 直接有 version 字段
if "version" in data:
    data["version"] = new_ver

# plugin.json: description 含版本号
if "description" in data and isinstance(data["description"], str):
    data["description"] = re.sub(r"Taozi \d+\.\d+\.\d+", f"Taozi {new_ver}", data["description"])

# marketplace.json: 嵌套在 plugins 数组
if "plugins" in data:
    for p in data["plugins"]:
        if p.get("name") == "taozi":
            p["version"] = new_ver
            p["description"] = re.sub(r"Taozi \d+\.\d+\.\d+", f"Taozi {new_ver}", p.get("description", ""))

with open(filepath, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")
PYEOF
    echo "✓ $1"
  fi
}

run_update "package.json"              "$PACKAGE_JSON"
run_update ".claude-plugin/plugin.json"       "$PLUGIN_JSON"
run_update ".claude-plugin/marketplace.json"  "$MARKETPLACE_JSON"
run_update ".codex-plugin/plugin.json"        "$CODEX_PLUGIN_JSON"

# README.md: 替换标题中的版本号
if [[ "$DRY_RUN" == "1" ]]; then
  echo "[DRY-RUN] 将更新 README.md"
else
  sed -i '' "s/# Taozi Plugin [0-9]\+\.[0-9]\+\(\.[0-9]\+\)\?/# Taozi Plugin $NEW_VERSION/" "$README"
  echo "✓ README.md"
fi

echo ""
echo "验证结果："
python3 - <<PYEOF
import json, re

def show(label, path, extractor):
    try:
        with open(path) as f:
            data = json.load(f)
        print(f"  {label}: {extractor(data)}")
    except Exception as e:
        print(f"  {label}: 读取失败 ({e})")

show("package.json",             "$PACKAGE_JSON",    lambda d: d["version"])
show("plugin.json .version",     "$PLUGIN_JSON",     lambda d: d["version"])
show("plugin.json .description", "$PLUGIN_JSON",     lambda d: d["description"])
show("marketplace version",      "$MARKETPLACE_JSON",lambda d: d["plugins"][0]["version"])
show("marketplace description",  "$MARKETPLACE_JSON",lambda d: d["plugins"][0]["description"])
show("codex plugin version",     "$CODEX_PLUGIN_JSON",lambda d: d["version"])
show("codex plugin description", "$CODEX_PLUGIN_JSON",lambda d: d["description"])
PYEOF

grep -m1 "# Taozi Plugin" "$README" || true

if [[ "$DRY_RUN" == "0" ]]; then
  echo ""
  echo "下一步建议："
  echo "  git add package.json .claude-plugin/ .codex-plugin/ README.md"
  echo "  git commit -m \"chore: bump version to $NEW_VERSION\""

  if [[ "$AUTO_TAG" == "1" ]]; then
    echo ""
    echo "正在打 git tag v$NEW_VERSION ..."
    git -C "$ROOT_DIR" tag -a "v$NEW_VERSION" -m "Release $NEW_VERSION"
    echo "✓ git tag v$NEW_VERSION 已创建"
    echo "  推送 tag: git push origin v$NEW_VERSION"
  else
    echo "  (可选) git tag -a \"v$NEW_VERSION\" -m \"Release $NEW_VERSION\""
  fi
fi
