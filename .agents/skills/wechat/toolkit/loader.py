"""
轻量主题加载器 — 仅依赖 PyYAML（stdlib + yaml）。
从 themes/*.yaml 读取颜色令牌，供 wechat_publish.py 的简单转换器使用。

高级用法（完整 wewrite 排版引擎）：
  需额外安装：pip install markdown beautifulsoup4 cssutils pyyaml
  然后直接使用 wewrite 的 converter.py / theme.py。
"""

import os
from dataclasses import dataclass

THEMES_DIR = os.path.join(os.path.dirname(__file__), "themes")


@dataclass
class ThemeColors:
    primary: str = "#576b95"
    text: str = "#333333"
    text_light: str = "#666666"
    code_bg: str = "#f5f5f5"
    code_color: str = "#e83e8c"
    quote_border: str = "#576b95"
    quote_bg: str = "#f0f4fc"
    table_header_bg: str = "#576b95"
    table_header_fg: str = "#ffffff"


def load_theme(name: str) -> ThemeColors:
    """加载主题颜色，PyYAML 不可用时返回 simple 默认值。"""
    path = os.path.join(THEMES_DIR, f"{name}.yaml")
    if not os.path.exists(path):
        # 未知主题名 → 尝试 simple，还不存在则用硬编码默认值
        path = os.path.join(THEMES_DIR, "simple.yaml")
        if not os.path.exists(path):
            return ThemeColors()

    try:
        import yaml
        with open(path, encoding="utf-8") as f:
            data = yaml.safe_load(f)
        c = data.get("colors", {}) or {}
        return ThemeColors(
            primary=c.get("primary", "#576b95"),
            text=c.get("text", "#333333"),
            text_light=c.get("text_light", "#666666"),
            code_bg=c.get("code_bg", "#f5f5f5"),
            code_color=c.get("code_color", "#e83e8c"),
            quote_border=c.get("quote_border", c.get("primary", "#576b95")),
            quote_bg=c.get("quote_bg", "#f0f4fc"),
            table_header_bg=c.get("primary", "#576b95"),
            table_header_fg="#ffffff",
        )
    except Exception:
        return ThemeColors()


def list_themes() -> list:
    """返回可用主题名列表。"""
    if not os.path.isdir(THEMES_DIR):
        return ["simple"]
    return sorted(
        f.rsplit(".", 1)[0]
        for f in os.listdir(THEMES_DIR)
        if f.endswith((".yaml", ".yml"))
    )
