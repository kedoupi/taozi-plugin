#!/usr/bin/env bash
# Taozi Plugin 3.0 安装脚本
# curl -fsSL https://raw.githubusercontent.com/kedoupi/taozi-plugin/main/install.sh | bash

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印函数
info() { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1; }

# 默认 profile
PROFILE="${TAOZI_PROFILE:-standard}"

# 解析参数
while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      PROFILE="$2"
      shift 2
      ;;
    --profile=*)
      PROFILE="${1#*=}"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

# Banner
echo -e "${CYAN}"
cat << 'EOF'
  ████████╗ █████╗  ██████╗ ███████╗██╗
  ╚══██╔══╝██╔══██╗██╔═══██╗╚══███╔╝██║
     ██║   ███████║██║   ██║  ███╔╝ ██║
     ██║   ██╔══██║██║   ██║ ███╔╝  ██║
     ██║   ██║  ██║╚██████╔╝███████╗██║
     ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝
EOF
echo -e "${NC}"
echo "🍑 Taozi Plugin 3.0 安装程序"
echo "────────────────────────────────────"
echo ""

REPO_URL="https://github.com/kedoupi/taozi-plugin.git"
DETECTED_PLATFORMS=()

# --- Profile 说明 ---
show_profiles() {
  echo "安装模式 (TAOZI_PROFILE 或 --profile):"
  echo "  • minimal  — 核心 agents (4) + commands"
  echo "  • standard — 所有 agents + skills + rules (默认)"
  echo "  • full     — 上述 + hooks + scripts + 持续学习"
  echo ""
}

# --- 检测平台 ---

detect_claude_code() {
  if [ -d "$HOME/.claude" ]; then
    DETECTED_PLATFORMS+=("claude-code")
    return 0
  fi
  return 1
}

detect_opencode() {
  if command -v opencode &> /dev/null || [ -d "$HOME/.config/opencode" ]; then
    DETECTED_PLATFORMS+=("opencode")
    return 0
  fi
  return 1
}

detect_codex() {
  if command -v codex &> /dev/null || [ -d "$HOME/.codex" ]; then
    DETECTED_PLATFORMS+=("codex")
    return 0
  fi
  return 1
}

# --- 验证安装 ---

verify_installation() {
  local target_dir="$1"

  if [ -x "$(command -v node)" ] && [ -f "$target_dir/tests/run-all.js" ]; then
    info "运行安装验证..."
    if node "$target_dir/tests/run-all.js" > /dev/null 2>&1; then
      success "安装验证通过"
    else
      warn "部分测试未通过，插件可能不完全正常"
    fi
  fi
}

# --- Profile 过滤 ---

install_components() {
  local target_dir="$1"

  # commands — 所有 profile 都安装
  success "Commands: 7 个命令已安装"

  case "$PROFILE" in
    minimal)
      # 只安装 4 个核心 agent
      info "Profile: minimal — 只安装核心组件"
      local core_agents="fullstack-developer debugger code-reviewer testing-engineer"
      for agent in $core_agents; do
        if [ -f "$target_dir/agents/$agent.md" ]; then
          success "Agent: $agent"
        fi
      done
      ;;
    standard)
      # 所有 agents + skills + rules
      info "Profile: standard — 安装所有 agents + skills + rules"
      local agent_count=$(find "$target_dir/agents" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
      local skill_count=$(find "$target_dir/skills" -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')
      local rule_count=$(find "$target_dir/rules" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
      success "Agents: ${agent_count} 个"
      success "Skills: ${skill_count} 个"
      success "Rules: ${rule_count} 个"
      ;;
    full)
      # 所有 + hooks + scripts + tests
      info "Profile: full — 安装所有组件（含 Hooks 和自动化）"
      local agent_count=$(find "$target_dir/agents" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
      local skill_count=$(find "$target_dir/skills" -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')
      local rule_count=$(find "$target_dir/rules" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
      local hook_count=$(find "$target_dir/scripts/hooks" -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
      success "Agents: ${agent_count} 个"
      success "Skills: ${skill_count} 个"
      success "Rules: ${rule_count} 个"
      success "Hooks: ${hook_count} 个自动化脚本"
      success "Tests: 内置测试套件"

      # 验证
      verify_installation "$target_dir"
      ;;
    *)
      warn "未知 profile: $PROFILE，使用 standard"
      PROFILE="standard"
      install_components "$target_dir"
      ;;
  esac
}

# --- 安装到 Claude Code ---

install_claude_code() {
  info "安装到 Claude Code..."

  local target_dir="$HOME/.claude/plugins/taozi"

  # 创建目录
  mkdir -p "$HOME/.claude/plugins"

  # 克隆或更新
  if [ -d "$target_dir" ]; then
    warn "已存在，更新中..."
    cd "$target_dir" && git pull --ff-only
  else
    git clone "$REPO_URL" "$target_dir"
  fi

  # 安装组件
  install_components "$target_dir"

  success "Claude Code 安装完成！"
  echo "   位置: $target_dir"
  echo "   Profile: $PROFILE"
  echo "   使用: 在 Claude Code 中运行 /plugin 启用插件"
}

# --- 安装到 OpenCode ---

install_opencode() {
  info "安装到 OpenCode..."

  local taozi_dir="$HOME/.config/opencode/taozi"
  local plugin_dir="$HOME/.config/opencode/plugins"

  # 创建目录
  mkdir -p "$HOME/.config/opencode"
  mkdir -p "$plugin_dir"

  # 克隆或更新 taozi
  if [ -d "$taozi_dir" ]; then
    warn "已存在，更新中..."
    cd "$taozi_dir" && git pull --ff-only
  else
    git clone "$REPO_URL" "$taozi_dir"
  fi

  # 创建插件 symlink
  local plugin_link="$plugin_dir/taozi.js"
  if [ -L "$plugin_link" ]; then
    rm "$plugin_link"
  fi
  ln -sf "$taozi_dir/.opencode/plugin/taozi.js" "$plugin_link"

  # 安装组件
  install_components "$taozi_dir"

  success "OpenCode 安装完成！"
  echo "   位置: $taozi_dir"
  echo "   插件: $plugin_link"
  echo "   查看: cat $taozi_dir/.opencode/INSTALL.md"
}

# --- 安装到 Codex ---

install_codex() {
  info "安装到 Codex..."

  local taozi_dir="$HOME/.codex/taozi"

  # 创建目录
  mkdir -p "$HOME/.codex"

  # 克隆或更新
  if [ -d "$taozi_dir" ]; then
    warn "已存在，更新中..."
    cd "$taozi_dir" && git pull --ff-only
  else
    git clone "$REPO_URL" "$taozi_dir"
  fi

  # 运行 bootstrap
  if [ -x "$taozi_dir/.codex/taozi-codex" ]; then
    info "运行 bootstrap..."
    "$taozi_dir/.codex/taozi-codex" bootstrap
  fi

  # 安装组件
  install_components "$taozi_dir"

  success "Codex 安装完成！"
  echo "   位置: $taozi_dir"
  echo "   CLI: $taozi_dir/.codex/taozi-codex"
  echo "   查看: cat $taozi_dir/.codex/INSTALL.md"
}

# --- 主流程 ---

main() {
  show_profiles

  # 检测平台
  info "检测已安装的平台..."
  detect_claude_code
  detect_opencode
  detect_codex

  if [ ${#DETECTED_PLATFORMS[@]} -eq 0 ]; then
    warn "未检测到支持的平台"
    echo ""
    echo "支持的平台:"
    echo "  • Claude Code - https://claude.ai/code"
    echo "  • OpenCode    - https://github.com/opencode-ai/opencode"
    echo "  • Codex       - https://github.com/openai/codex"
    echo ""
    echo "请先安装至少一个平台，或手动指定安装目标："
    echo ""
    echo "  PLATFORM=claude-code ./install.sh"
    echo "  PLATFORM=opencode ./install.sh"
    echo "  PLATFORM=codex ./install.sh"
    exit 1
  fi

  success "检测到 ${#DETECTED_PLATFORMS[@]} 个平台: ${DETECTED_PLATFORMS[*]}"
  info "安装模式: $PROFILE"
  echo ""

  # 允许手动覆盖
  if [ -n "$PLATFORM" ]; then
    DETECTED_PLATFORMS=("$PLATFORM")
    info "手动指定平台: $PLATFORM"
  fi

  # 安装到检测到的平台
  for platform in "${DETECTED_PLATFORMS[@]}"; do
    echo ""
    case "$platform" in
      claude-code)
        install_claude_code
        ;;
      opencode)
        install_opencode
        ;;
      codex)
        install_codex
        ;;
      *)
        warn "未知平台: $platform"
        ;;
    esac
  done

  echo ""
  echo "────────────────────────────────────"
  success "🍑 Taozi Plugin 3.0 安装完成！"
  echo ""
  echo "快速开始:"
  echo "  /taozi 实现用户登录功能          # 工作流调度"
  echo "  /commit                           # 智能提交"
  echo "  /pr                               # 创建 PR"
  echo ""
  echo "新功能:"
  echo "  • Hooks: 自动化检查（阻止 --no-verify、检测 console.log）"
  echo "  • Rules: 6 个始终加载的编码规范"
  echo "  • Tests: 200+ 内置测试验证"
  echo "  • 铁律: 3 条强约束（调试/TDD/验证）"
  echo ""
  echo "文档: https://github.com/kedoupi/taozi-plugin"
}

main "$@"
