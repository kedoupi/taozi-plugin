#!/usr/bin/env python3
"""
微信公众号发布脚本
用法：
  # 转换 Markdown 为微信 HTML（不发布）
  python3 wechat_publish.py --convert --input article.md --output /tmp/article.html

  # 完整发布（转换 + 上传封面 + 推草稿）
  python3 wechat_publish.py --publish --title "文章标题" --content article.md --cover cover.jpg

  # 仅更新 history.yaml（发布成功后）
  python3 wechat_publish.py --update-history --media-id "xxx" --title "标题" --keywords "kw1,kw2"

输出：JSON（stdout）
踩坑记录（继承自 sync_wechat.py）：
- Content-Type 必须加 charset=utf-8，否则中文标题报 45003
- digest 按字节算（不是字符），中文控制在 120 字节内
- 图片必须先 uploadimg 拿到 mmbiz.qpic.cn URL，本地路径无效
- 微信 API 必须走代理（白名单 IP 限制）
- 标题 emoji 必须清理，长度 ≤ 64 字符
"""

import json, os, sys, re, argparse, urllib.request, uuid
from datetime import datetime
from pathlib import Path


# ── 极简 YAML 解析（不依赖 PyYAML）──────────────────────
def _parse_simple_yaml(text):
    """两层嵌套 key: value 解析器，支持 style.yaml 格式。
    不支持列表、多行值、锚点等高级特性。
    """
    result = {}
    current_parent = None  # reason: 跟踪当前嵌套父级
    for line in text.splitlines():
        # 跳过空行和注释
        if not line.strip() or line.strip().startswith("#"):
            continue
        is_indented = line.startswith(" ") or line.startswith("\t")
        if is_indented and current_parent is not None:
            stripped = line.strip()
            if ":" not in stripped:
                continue
            key, _, val = stripped.partition(":")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if isinstance(result.get(current_parent), dict):
                result[current_parent][key] = val
        elif not is_indented and ":" in line:
            key, _, val = line.partition(":")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if val == "":
                result[key] = {}
                current_parent = key
            else:
                result[key] = val
                current_parent = None
        else:
            current_parent = None
    return result


# ── 配置加载（~/.taozi/ 三级合并）────────────────────────────────────
def _load_yaml_file(path):
    """读取 YAML 文件，PyYAML 不可用时降级到简单解析器。"""
    if not os.path.exists(path):
        return {}
    try:
        import yaml
        with open(path, encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    except Exception:
        try:
            with open(path, encoding="utf-8") as f:
                return _parse_simple_yaml(f.read())
        except Exception:
            return {}


def _deep_merge(base, override):
    """override 字段覆盖 base，dict 类型递归合并。"""
    result = dict(base)
    for key, val in override.items():
        if isinstance(val, dict) and isinstance(result.get(key), dict):
            result[key] = _deep_merge(result[key], val)
        else:
            result[key] = val
    return result


def load_taozi_config(platform: str, cwd: str = ".") -> dict:
    """按优先级从低到高三级合并：
    ~/.taozi/config.yaml
    → ~/.taozi/platforms/<p>.yaml
    → ./.taozi/platforms/<p>.yaml
    """
    HOME  = os.path.expanduser("~")
    TAOZI = os.path.join(HOME, ".taozi")
    cfg = {}
    cfg = _deep_merge(cfg, _load_yaml_file(os.path.join(TAOZI, "config.yaml")))
    cfg = _deep_merge(cfg, _load_yaml_file(
        os.path.join(TAOZI, "platforms", f"{platform}.yaml")))
    cfg = _deep_merge(cfg, _load_yaml_file(
        os.path.join(cwd, ".taozi", "platforms", f"{platform}.yaml")))
    return cfg


def load_brand_file(filename: str, cwd: str = ".") -> str:
    """读取品牌文件，优先级：./.taozi/brand/ > ~/.taozi/brand/"""
    HOME = os.path.expanduser("~")
    for path in (
        os.path.join(cwd, ".taozi", "brand", filename),
        os.path.join(HOME, ".taozi", "brand", filename),
    ):
        if os.path.exists(path):
            try:
                with open(path, encoding="utf-8") as f:
                    return f.read()
            except Exception:
                pass
    return ""


def load_config():
    """从 ~/.taozi/ 三级配置合并读取，多账号支持，环境变量兜底。"""
    def resolve(val):
        if isinstance(val, str) and val.startswith("$"):
            return os.environ.get(val[1:], "")
        return val or ""

    raw = load_taozi_config("wechat", os.getcwd())

    config = {}
    wechat      = raw.get("wechat", {}) or {}
    accounts    = wechat.get("accounts", {}) or {}
    account_name = raw.get("account", "default")
    account     = accounts.get(account_name, {}) or wechat  # 兼容旧格式（直接存 appid/secret）
    config["appid"]  = resolve(account.get("appid",  "$WECHAT_APPID"))
    config["secret"] = resolve(account.get("secret", "$WECHAT_APPSECRET"))
    config["author"] = account.get("author", "") or ""
    config["proxy"]  = resolve(wechat.get("proxy", raw.get("proxy", "$WECHAT_PROXY")))
    fmt = raw.get("format", {}) or {}
    config["theme"]  = fmt.get("theme", raw.get("theme", "newspaper")) or "newspaper"
    ct = raw.get("cover_text", {}) or {}
    config["cover_text"] = {
        "enabled":            ct.get("enabled", "true") not in ("false", "0", False),
        "font_size":          int(ct.get("font_size", 52) or 52),
        "color":              ct.get("color", "#FFFFFF") or "#FFFFFF",
        "shadow":             ct.get("shadow", "true") not in ("false", "0", False),
        "position":           ct.get("position", "bottom") or "bottom",
        "max_chars_per_line": int(ct.get("max_chars_per_line", 14) or 14),
    }

    # 环境变量兜底
    if not config.get("appid"):
        config["appid"]  = os.environ.get("WECHAT_APPID") or os.environ.get("WECHAT_APP_ID", "")
    if not config.get("secret"):
        config["secret"] = os.environ.get("WECHAT_APPSECRET") or os.environ.get("WECHAT_APP_SECRET", "")
    return config


CONFIG           = load_config()
WECHAT_APPID     = CONFIG["appid"]
WECHAT_APPSECRET = CONFIG["secret"]
WECHAT_PROXY     = CONFIG["proxy"]
WECHAT_AUTHOR    = CONFIG["author"] or "作者"
COVER_TEXT_CFG   = CONFIG.get("cover_text", {})
DEFAULT_THEME    = CONFIG.get("theme", "newspaper")
PRIMARY          = "#576b95"


# ── 微信 API ──────────────────────────────────────────
_token_cache = {"token": None, "expires_at": 0}


def wx_api(path, data=None, method="GET"):
    """调用微信 API（通过代理），中文请求必须用 charset=utf-8"""
    url = f"{WECHAT_PROXY}{path}" if WECHAT_PROXY else f"https://api.weixin.qq.com{path}"
    if data and method == "POST":
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(
            url, data=body,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )
    else:
        req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def get_access_token():
    """获取微信 access_token（带缓存）"""
    import time
    if _token_cache["token"] and time.time() < _token_cache["expires_at"]:
        return _token_cache["token"]
    data = wx_api(
        f"/cgi-bin/token?grant_type=client_credential"
        f"&appid={WECHAT_APPID}&secret={WECHAT_APPSECRET}"
    )
    if "access_token" not in data:
        raise Exception(f"获取token失败: {json.dumps(data, ensure_ascii=False)}")
    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = time.time() + 7000
    return data["access_token"]


def upload_image(token, image_path, retries=3):
    """上传文章内图片到微信CDN，返回 mmbiz.qpic.cn URL（带重试）"""
    import time as _time
    boundary = f"----FormBoundary{uuid.uuid4().hex}"
    filename = os.path.basename(image_path)
    with open(image_path, "rb") as f:
        file_data = f.read()
    ct = "image/jpeg" if image_path.lower().endswith((".jpg", ".jpeg")) else "image/png"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="media"; filename="{filename}"\r\n'
        f"Content-Type: {ct}\r\n\r\n"
    ).encode() + file_data + f"\r\n--{boundary}--\r\n".encode()
    base = WECHAT_PROXY if WECHAT_PROXY else "https://api.weixin.qq.com"
    url = f"{base}/cgi-bin/media/uploadimg?access_token={token}"
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url, data=body,
                headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            )
            with urllib.request.urlopen(req, timeout=60) as r:
                result = json.loads(r.read())
            if "url" not in result:
                raise Exception(f"上传图片失败: {json.dumps(result, ensure_ascii=False)}")
            return result["url"]
        except Exception as e:
            if attempt < retries - 1:
                print(f"  [重试 {attempt+1}/{retries}] {filename}: {e}", file=sys.stderr)
                _time.sleep(5)
            else:
                raise


def _resize_cover(image_path):
    """自动裁切封面图到微信要求的 900×383，返回 JPEG bytes。"""
    try:
        from PIL import Image as _Image
        img = _Image.open(image_path).convert("RGB")
        tw, th = 900, 383
        ratio = tw / img.width
        new_h = int(img.height * ratio)
        img = img.resize((tw, new_h), _Image.LANCZOS)
        top = max(0, (new_h - th) // 2)
        img = img.crop((0, top, tw, top + th))
        import io
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=90)
        return buf.getvalue(), "cover_wx.jpg", "image/jpeg"
    except ImportError:
        with open(image_path, "rb") as f:
            data = f.read()
        fname = os.path.basename(image_path)
        ct = "image/jpeg" if image_path.lower().endswith((".jpg", ".jpeg")) else "image/png"
        return data, fname, ct


def _find_cjk_font():
    """按优先级查找可用的 CJK 字体，返回路径或 None。"""
    candidates = [
        "/System/Library/Fonts/Supplemental/PingFang.ttc",  # macOS 13+
        "/System/Library/Fonts/PingFang.ttc",               # macOS 12 及以下
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",    # Linux
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
        "/Windows/Fonts/msyh.ttc",                          # Windows
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    # fc-list fallback（Linux 通用）
    try:
        import subprocess
        out = subprocess.check_output(
            ["fc-list", ":lang=zh", "--format=%{file}\n"],
            stderr=subprocess.DEVNULL, timeout=3,
        ).decode()
        for line in out.splitlines():
            line = line.strip()
            if line and os.path.exists(line):
                return line
    except Exception:
        pass
    return None


def _hex_to_rgb(hex_color):
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def overlay_title_on_cover(img_bytes, title, cfg=None):
    """在封面图上叠加标题文字，返回新的 JPEG bytes。
    cfg 从 style.yaml cover_text 段读取。Pillow 不可用时原样返回。
    """
    if cfg is None:
        cfg = COVER_TEXT_CFG
    if not cfg.get("enabled", True):
        return img_bytes

    try:
        from PIL import Image, ImageDraw, ImageFont
        import io, textwrap
    except ImportError:
        return img_bytes

    img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    W, H = img.size

    font_size     = cfg.get("font_size", 52)
    text_color    = _hex_to_rgb(cfg.get("color", "#FFFFFF"))
    use_shadow    = cfg.get("shadow", True)
    position      = cfg.get("position", "bottom")  # top/center/bottom
    max_chars     = cfg.get("max_chars_per_line", 14)

    # 加载字体
    font_path = _find_cjk_font()
    try:
        font = ImageFont.truetype(font_path, font_size) if font_path else ImageFont.load_default()
    except Exception:
        font = ImageFont.load_default()

    # 文字换行
    lines = textwrap.wrap(title, width=max_chars) or [title]
    line_h = font_size + 10
    text_block_h = len(lines) * line_h
    pad = 40  # 文字区边距

    # 确定文字区 Y 起点
    if position == "top":
        text_y_start = pad
    elif position == "center":
        text_y_start = (H - text_block_h) // 2
    else:  # bottom
        text_y_start = H - text_block_h - pad * 2

    # 半透明渐变遮罩（底部区域）
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw_overlay = ImageDraw.Draw(overlay)
    grad_top = max(0, text_y_start - pad)
    for y in range(grad_top, H):
        alpha = int(160 * (y - grad_top) / max(1, H - grad_top))
        draw_overlay.line([(0, y), (W, y)], fill=(0, 0, 0, min(alpha, 160)))
    img = Image.alpha_composite(img, overlay)

    # 绘制文字
    draw = ImageDraw.Draw(img)
    for i, line in enumerate(lines):
        try:
            bbox = font.getbbox(line)
            tw = bbox[2] - bbox[0]
        except AttributeError:
            tw = len(line) * font_size * 0.6
        x = (W - tw) // 2
        y = text_y_start + i * line_h

        if use_shadow:
            for dx, dy in [(2, 2), (2, -2), (-2, 2), (-2, -2)]:
                draw.text((x + dx, y + dy), line, font=font, fill=(0, 0, 0, 180))
        draw.text((x, y), line, font=font, fill=(*text_color, 255))

    # 转回 JPEG bytes
    out = io.BytesIO()
    img.convert("RGB").save(out, "JPEG", quality=92)
    return out.getvalue()


def upload_thumb(token, image_path, title=None, retries=3):
    """上传封面图，返回 thumb_media_id（带重试）。自动裁切到 900×383，可叠标题文字。"""
    import time as _time
    boundary = f"----FormBoundary{uuid.uuid4().hex}"
    file_data, filename, ct = _resize_cover(image_path)
    if title:
        file_data = overlay_title_on_cover(file_data, title)
        filename = "cover_titled.jpg"
        ct = "image/jpeg"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="media"; filename="{filename}"\r\n'
        f"Content-Type: {ct}\r\n\r\n"
    ).encode() + file_data + f"\r\n--{boundary}--\r\n".encode()
    base = WECHAT_PROXY if WECHAT_PROXY else "https://api.weixin.qq.com"
    url = f"{base}/cgi-bin/material/add_material?access_token={token}&type=image"
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url, data=body,
                headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            )
            with urllib.request.urlopen(req, timeout=60) as r:
                result = json.loads(r.read())
            if "media_id" not in result:
                raise Exception(f"上传封面失败: {json.dumps(result, ensure_ascii=False)}")
            return result["media_id"]
        except Exception as e:
            if attempt < retries - 1:
                print(f"  [重试 {attempt+1}/{retries}] 封面上传: {e}", file=sys.stderr)
                _time.sleep(5)
            else:
                raise


# ── Markdown → 公众号 HTML ──────────────────────────────
def inline_format(text, primary=None):
    """处理内联格式：加粗、斜体、行内代码、链接→span"""
    p = primary or PRIMARY
    text = re.sub(
        r"`([^`]+)`",
        r'<code style="background:#f6f6f6;padding:2px 6px;border-radius:3px;'
        r'font-size:90%;color:#d14;">\1</code>',
        text,
    )
    text = re.sub(
        r"\*\*([^*]+)\*\*",
        f'<strong style="color:{p};font-weight:bold;">\\1</strong>',
        text,
    )
    text = re.sub(r"\*([^*]+)\*", '<em style="font-style:italic;color:#555;">\\1</em>', text)
    text = re.sub(
        r"\[([^\]]+)\]\([^)]+\)",
        f'<span style="color:{p};font-weight:500;">\\1</span>',
        text,
    )
    return text


def _load_theme_colors(theme_name):
    """从 toolkit/loader.py 加载主题颜色，不可用时返回 None（使用全局 PRIMARY）。"""
    try:
        import sys as _sys
        toolkit_dir = os.path.join(os.path.dirname(__file__), "..", "toolkit")
        if toolkit_dir not in _sys.path:
            _sys.path.insert(0, toolkit_dir)
        from loader import load_theme as _load_theme
        return _load_theme(theme_name or "simple")
    except Exception:
        return None


def md_to_wx_html(md, theme=None):
    """Markdown → 公众号 HTML（内联样式）。
    支持 toolkit/themes/*.yaml 主题（PyYAML 可用时生效）。
    不依赖 BeautifulSoup/cssutils，降级为当前简单转换器。
    """
    tc = _load_theme_colors(theme or DEFAULT_THEME)
    p = tc.primary if tc else PRIMARY
    code_bg = tc.code_bg if tc else "#f6f6f6"
    quote_border = tc.quote_border if tc else p
    quote_bg = tc.quote_bg if tc else "#f7f7f7"

    def fmt(text):
        return inline_format(text, primary=p)

    html_parts = []
    lines = md.split("\n")
    in_code_block = False
    code_content = []
    in_list = False
    list_type = None
    list_items = []
    in_table = False
    table_rows = []

    def flush_list():
        nonlocal in_list, list_items, list_type
        if in_list and list_items:
            tag = "ol" if list_type == "ol" else "ul"
            items_html = "".join(list_items)
            style = (
                "padding-left:1.5em;margin:0.5em 8px;"
                f"list-style-type:{'decimal' if list_type == 'ol' else 'disc'};"
            )
            html_parts.append(f'<{tag} style="{style}">{items_html}</{tag}>')
            list_items.clear()
            in_list = False

    def flush_table():
        nonlocal in_table, table_rows
        if in_table and table_rows:
            html = '<table style="width:100%;border-collapse:collapse;margin:1.5em 8px;font-size:14px;">'
            for i, row_cells in enumerate(table_rows):
                tag = "th" if i == 0 else "td"
                bg = (
                    f"background:{p};color:#fff;"
                    if i == 0
                    else ("background:#f9f9f9;" if i % 2 == 0 else "")
                )
                html += "<tr>"
                for cell in row_cells:
                    cell_text = fmt(cell.strip())
                    html += (
                        f'<{tag} style="border:1px solid #e8e8e8;padding:8px 12px;'
                        f'text-align:left;{bg}">{cell_text}</{tag}>'
                    )
                html += "</tr>"
            html += "</table>"
            html_parts.append(html)
            table_rows.clear()
            in_table = False

    for line in lines:
        if line.strip().startswith("```"):
            if in_code_block:
                code_text = "\n".join(code_content)
                html_parts.append(
                    f'<pre style="background:{code_bg};padding:16px;border-radius:6px;'
                    f'overflow-x:auto;font-size:13px;line-height:1.6;color:#333;'
                    f'font-family:Menlo,Consolas,monospace;">{code_text}</pre>'
                )
                code_content.clear()
                in_code_block = False
            else:
                flush_list()
                in_code_block = True
            continue
        if in_code_block:
            code_content.append(line)
            continue

        stripped = line.strip()
        if not stripped:
            flush_list()
            flush_table()
            continue

        # Markdown table
        if stripped.startswith("|") and stripped.endswith("|"):
            flush_list()
            if re.match(r"^\|[\s\-:|]+\|$", stripped):
                continue  # 跳过分隔行
            cells = [c.strip() for c in stripped.strip("|").split("|")]
            if not in_table:
                in_table = True
            table_rows.append(cells)
            continue
        elif in_table:
            flush_table()

        if stripped.startswith("### "):
            flush_list()
            html_parts.append(
                f'<h3 style="font-size:16px;font-weight:bold;color:#333;'
                f'padding-left:10px;border-left:3px solid {p};'
                f'margin:2em 8px 0.8em 0;line-height:1.3;">'
                f'{fmt(stripped[4:])}</h3>'
            )
        elif stripped.startswith("## "):
            flush_list()
            html_parts.append(
                f'<h2 style="font-size:18px;font-weight:bold;color:#fff;'
                f'background:{p};display:table;padding:4px 16px;'
                f'margin:2.5em auto 1.2em;text-align:center;border-radius:4px;">'
                f'{fmt(stripped[3:])}</h2>'
            )
        elif stripped.startswith("# "):
            flush_list()
            html_parts.append(
                f'<h1 style="font-size:22px;font-weight:bold;color:#333;'
                f'text-align:center;margin:1.5em 8px 1.2em;'
                f'padding-bottom:10px;border-bottom:2px solid {p};">'
                f'{fmt(stripped[2:])}</h1>'
            )
        elif stripped.startswith("> "):
            flush_list()
            html_parts.append(
                f'<blockquote style="border-left:4px solid {quote_border};'
                f'padding:1em 1em 1em 1.5em;margin:1.5em 8px;color:#666;'
                f'background:{quote_bg};border-radius:0 6px 6px 0;font-size:14px;">'
                f'{fmt(stripped[2:])}</blockquote>'
            )
        elif stripped.startswith("---"):
            flush_list()
            html_parts.append(
                '<hr style="border:none;margin:2.5em 0;height:1px;'
                'background:linear-gradient(to right,rgba(0,0,0,0),'
                'rgba(0,0,0,0.1),rgba(0,0,0,0));" />'
            )
        elif re.match(r"^\d+\.\s", stripped):
            if not in_list or list_type != "ol":
                flush_list()
                in_list = True
                list_type = "ol"
            ol_text = re.sub(r"^\d+\.\s", "", stripped)
            list_items.append(
                f'<li style="margin:0.2em 0;color:#333;letter-spacing:0.1em;line-height:1.8;">'
                f'{fmt(ol_text)}</li>'
            )
        elif stripped.startswith("- ") or stripped.startswith("* "):
            if not in_list or list_type != "ul":
                flush_list()
                in_list = True
                list_type = "ul"
            list_items.append(
                f'<li style="margin:0.2em 0;color:#333;letter-spacing:0.1em;line-height:1.8;">'
                f'{fmt(stripped[2:])}</li>'
            )
        elif stripped.startswith("!["):
            flush_list()
            m = re.match(r"!\[([^\]]*)\]\(([^)]+)\)", stripped)
            if m:
                html_parts.append(
                    f'<img src="{m.group(2)}" alt="{m.group(1)}" '
                    f'style="max-width:100%;border-radius:8px;margin:1.5em auto;display:block;" />'
                )
        else:
            flush_list()
            html_parts.append(
                f'<p style="margin:1.5em 8px;letter-spacing:0.1em;color:#333;">'
                f'{fmt(stripped)}</p>'
            )

    flush_list()
    flush_table()
    body = "".join(html_parts)
    return (
        '<section style="font-family:-apple-system,BlinkMacSystemFont,'
        "'Helvetica Neue','PingFang SC','Hiragino Sans GB','Microsoft YaHei',"
        'sans-serif;font-size:15px;line-height:1.8;color:#333;'
        f'letter-spacing:0.1em;padding:16px;">{body}</section>'
    )


def clean_title(title):
    """清理标题 emoji + 截断 64 字符"""
    title = re.sub(
        r"[\U0001F000-\U0001FFFF\u2600-\u27BF\u2300-\u23FF"
        r"\u200B-\u200F\u2028-\u202F\u2060-\u206F\uFEFF]",
        "",
        title,
    )
    return title.strip()[:64]


def make_digest(md, max_bytes=120, max_chars=54):
    """生成摘要，同时限制字节数（微信120字节）和字符数（54汉字）。"""
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", md)
    text = re.sub(r"\[([^\]]*)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"[#*>`~_\-]", "", text)
    text = re.sub(r"\n+", " ", text).replace("  ", " ").strip()
    # 先按字符数截断
    if len(text) > max_chars:
        text = text[:max_chars]
    # 再按字节数截断（utf-8）
    while len(text.encode("utf-8")) > max_bytes:
        text = text[:-1]
    return text


# ── 主流程 ────────────────────────────────────────────
def sync(title, content_md, cover_path, image_paths=None, theme=None):
    """
    同步文章到公众号草稿箱（含图片上传）

    Args:
        title: 文章标题
        content_md: Markdown 正文
        cover_path: 封面图本地路径
        image_paths: 文章内图片路径列表
        theme: 排版主题名（默认 simple），Phase 2 接入 wewrite 后生效
    Returns:
        dict: {"media_id": "...", "title": "..."}
    """
    if not WECHAT_APPID or not WECHAT_APPSECRET:
        raise Exception("请设置 WECHAT_APPID 和 WECHAT_APPSECRET（环境变量或 ~/.taozi/config.yaml 的 wechat.accounts.default）")

    print(f"[同步] 开始: {title}", file=sys.stderr)
    token = get_access_token()
    print("[同步] token OK", file=sys.stderr)

    # 上传封面图（自动裁切到 900×383，叠标题文字）
    thumb_media_id = upload_thumb(token, cover_path, title=title)
    # 仅当正文内容引用了封面文件名时才额外上传为内嵌图
    cover_basename = os.path.basename(cover_path)
    if f"({cover_basename})" in content_md:
        cover_url = upload_image(token, cover_path)
        content_md = content_md.replace(f"({cover_basename})", f"({cover_url})")
    print(f"[同步] 封面图 OK thumb={thumb_media_id[:20]}...", file=sys.stderr)

    # 上传文章内图片并替换路径
    if image_paths:
        # 前置检查：所有图片文件必须存在，否则立即报错
        missing = [p for p in image_paths if not os.path.exists(p)]
        if missing:
            raise FileNotFoundError(
                f"以下图片文件不存在，发布中止：{missing}\n"
                f"请确认图片已成功下载后再执行发布"
            )
        for img_path in image_paths:
            filename = os.path.basename(img_path)
            wx_url = upload_image(token, img_path)
            content_md = content_md.replace(f"({filename})", f"({wx_url})")
            print(f"[同步] 配图 OK {filename}", file=sys.stderr)

    # 替换完成后，检查是否还有未替换的本地图片占位符
    remaining = re.findall(r'!\[[^\]]*\]\((?!https?://)([^)]+)\)', content_md)
    if remaining:
        raise Exception(
            f"以下图片占位符未被替换（文件名与 --images 参数不匹配）：{remaining}\n"
            f"请确保 --images 传入的文件名与 markdown 中 ![](...) 括号内完全一致"
        )

    # 去掉 Markdown 标题行（公众号标题单独设置）
    content_body = re.sub(r"^#\s+.*\n", "", content_md)

    html = md_to_wx_html(content_body, theme=theme or DEFAULT_THEME)
    if len(html.encode("utf-8")) > 1024 * 1024:
        raise Exception("内容超过1MB，请精简")

    clean = clean_title(title)
    digest = make_digest(content_body)

    draft = {
        "articles": [{
            "title": clean,
            "author": WECHAT_AUTHOR,
            "digest": digest,
            "content": html,
            "thumb_media_id": thumb_media_id,
            "need_open_comment": 1,
            "only_fans_can_comment": 0,
            "pic_crop_235_1": "0_0_1_1",
            "pic_crop_1_1": "0.287_0_0.713_1",
        }]
    }

    # draft/add 带重试（代理 502 workaround）
    result = None
    for attempt in range(1, 4):
        try:
            result = wx_api(
                f"/cgi-bin/draft/add?access_token={token}",
                data=draft,
                method="POST",
            )
            if "media_id" in result:
                break
            raise Exception(f"No media_id: {json.dumps(result, ensure_ascii=False)}")
        except Exception as e:
            if attempt < 3:
                print(f"  [重试 {attempt}/3] 草稿创建: {e}", file=sys.stderr)
                import time; time.sleep(3)
            else:
                raise Exception(f"创建草稿失败（3次重试后）: {e}")

    if not result or "media_id" not in result:
        raise Exception(f"创建草稿失败: {json.dumps(result, ensure_ascii=False)}")

    print(f"[同步] 草稿 OK media_id={result['media_id']}", file=sys.stderr)
    return {"media_id": result["media_id"], "title": clean}


# ── history.yaml 更新 ─────────────────────────────────
def update_history(media_id, title, keywords=None, visual_anchors=None,
                   framework=None, section_images=0):
    """追加发布记录到 wechat/history.yaml（safe YAML read-modify-write）。"""
    history_dir = os.path.join(os.getcwd(), "wechat")
    os.makedirs(history_dir, exist_ok=True)
    history_path = os.path.join(history_dir, "history.yaml")

    # 读取现有内容
    data = {"articles": []}
    if os.path.exists(history_path):
        try:
            import yaml as _yaml
            with open(history_path, encoding="utf-8") as f:
                loaded = _yaml.safe_load(f)
            if isinstance(loaded, dict) and "articles" in loaded:
                data = loaded
            elif isinstance(loaded, list):
                data = {"articles": loaded}
        except Exception:
            pass  # 文件损坏时重建

    record = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "title": title,
        "media_id": media_id,
        "topic_keywords": [k.strip() for k in keywords] if keywords else [],
        "framework": framework or "",
        "visual_anchors": [a.strip() for a in visual_anchors] if visual_anchors else [],
        "section_images": int(section_images),
        "quality": {"hkr_pass": True, "notes": ""},
        "stats": {"reads": 0, "likes": 0},
    }
    if not isinstance(data.get("articles"), list):
        data["articles"] = []
    data["articles"].append(record)

    import yaml as _yaml
    with open(history_path, "w", encoding="utf-8") as f:
        _yaml.dump(data, f, allow_unicode=True, sort_keys=False, default_flow_style=False)

    print(f"[history] 已写入 {history_path}", file=sys.stderr)
    return {"status": "ok", "history_path": history_path}


# ── CLI 入口 ──────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="微信公众号发布工具")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--convert",        action="store_true", help="仅转换 Markdown → 微信 HTML")
    mode.add_argument("--publish",        action="store_true", help="完整发布（转换+上传+推草稿）")
    mode.add_argument("--update-history", action="store_true", help="仅更新 history.yaml")

    # --convert 参数
    parser.add_argument("--input",   help="输入 Markdown 文件路径")
    parser.add_argument("--output",  help="输出 HTML 文件路径（--convert 用）")

    # --publish 参数
    parser.add_argument("--title",   help="文章标题")
    parser.add_argument("--content", help="Markdown 文件路径（--publish 用）")
    parser.add_argument("--cover",   help="封面图路径")
    parser.add_argument("--images",  nargs="*", default=[], help="文章内图片路径列表")
    parser.add_argument("--theme",   default=DEFAULT_THEME, help="排版主题（默认 newspaper）")

    # --update-history 参数
    parser.add_argument("--media-id",       help="已发布的 media_id")
    parser.add_argument("--keywords",       help="关键词，逗号分隔")
    parser.add_argument("--visual-anchors", help="视觉锚点关键词，逗号分隔")
    parser.add_argument("--framework",      help="文章结构描述")
    parser.add_argument("--section-images", type=int, default=0, help="章节配图数量")

    args = parser.parse_args()

    if args.convert:
        if not args.input:
            parser.error("--convert 需要 --input")
        with open(args.input, encoding="utf-8") as f:
            md = f.read()
        html = md_to_wx_html(md, theme=args.theme)
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(html)
            print(json.dumps({"status": "ok", "output": args.output}, ensure_ascii=False))
        else:
            print(html)

    elif args.publish:
        for required_arg, name in [(args.title, "--title"), (args.content, "--content"), (args.cover, "--cover")]:
            if not required_arg:
                parser.error(f"--publish 需要 {name}")
        with open(args.content, encoding="utf-8") as f:
            content_md = f.read()
        result = sync(args.title, content_md, args.cover, args.images or [], theme=args.theme)
        print(json.dumps(result, ensure_ascii=False))

    elif args.update_history:
        for required_arg, name in [(args.media_id, "--media-id"), (args.title, "--title")]:
            if not required_arg:
                parser.error(f"--update-history 需要 {name}")
        keywords       = args.keywords.split(",")       if args.keywords       else None
        visual_anchors = args.visual_anchors.split(",") if args.visual_anchors else None
        result = update_history(
            args.media_id, args.title,
            keywords=keywords,
            visual_anchors=visual_anchors,
            framework=args.framework,
            section_images=args.section_images,
        )
        print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import sys
        print(f"[ERROR] {e}", file=sys.stderr)
        sys.exit(1)
