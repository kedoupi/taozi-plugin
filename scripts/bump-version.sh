#!/usr/bin/env bash
# 兼容 wrapper：内部转发到跨平台的 Node 实现。
# 保留 .sh 名称是为了不破坏既有文档 / 习惯；实现在 scripts/bump-version.js。
set -eu

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/bump-version.js" "$@"
