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

import json, os, sys, re, argparse, urllib.request
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


# ── 配置加载（从 wechat-articles/style.yaml）────────────
def load_config():
    """读取 wechat-articles/style.yaml，$VAR_NAME 格式的值展开为 env var。
    文件不存在时回退到环境变量。
    """
    config = {}
    style_path = os.path.join(os.getcwd(), "wechat-articles", "style.yaml")
    if os.path.exists(style_path):
        with open(style_path, encoding="utf-8") as f:
            raw = _parse_simple_yaml(f.read())

        def resolve(val):
            if isinstance(val, str) and val.startswith("$"):
                return os.environ.get(val[1:], "")
            return val or ""

        wechat = raw.get("wechat", {}) or {}
        config["appid"]  = resolve(wechat.get("appid",  "$WECHAT_APPID"))
        config["secret"] = resolve(wechat.get("secret", "$WECHAT_APPSECRET"))
        config["author"] = wechat.get("author", "") or ""
        config["proxy"]  = resolve(raw.get("proxy", "$WECHAT_PROXY"))
    else:
        # 兼容 WECHAT_APPID 和 WECHAT_APP_ID 两种命名
        config["appid"]  = os.environ.get("WECHAT_APPID") or os.environ.get("WECHAT_APP_ID", "")
        config["secret"] = os.environ.get("WECHAT_APPSECRET") or os.environ.get("WECHAT_APP_SECRET", "")
        config["author"] = ""
        config["proxy"]  = os.environ.get("WECHAT_PROXY", "")
    # style.yaml 解析出的值也做兼容兜底
    if not config.get("appid"):
        config["appid"]  = os.environ.get("WECHAT_APPID") or os.environ.get("WECHAT_APP_ID", "")
    if not config.get("secret"):
        config["secret"] = os.environ.get("WECHAT_APPSECRET") or os.environ.get("WECHAT_APP_SECRET", "")
    return config


CONFIG          = load_config()
WECHAT_APPID    = CONFIG["appid"]
WECHAT_APPSECRET = CONFIG["secret"]
WECHAT_PROXY    = CONFIG["proxy"]
WECHAT_AUTHOR   = CONFIG["author"] or "作者"
PRIMARY         = "#576b95"


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
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    filename = os.path.basename(image_path)
    with open(image_path, "rb") as f:
        file_data = f.read()
    ct = "image/jpeg" if image_path.lower().endswith((".jpg", ".jpeg")) else "image/png"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="media"; filename="{filename}"\r\n'
        f"Content-Type: {ct}\r\n\r\n"
    ).encode() + file_data + f"\r\n--{boundary}--\r\n".encode()
    url = f"{WECHAT_PROXY}/cgi-bin/media/uploadimg?access_token={token}"
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


def upload_thumb(token, image_path, retries=3):
    """上传封面图，返回 thumb_media_id（带重试）。自动裁切到 900×383。"""
    import time as _time
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    file_data, filename, ct = _resize_cover(image_path)
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="media"; filename="{filename}"\r\n'
        f"Content-Type: {ct}\r\n\r\n"
    ).encode() + file_data + f"\r\n--{boundary}--\r\n".encode()
    url = f"{WECHAT_PROXY}/cgi-bin/material/add_material?access_token={token}&type=image"
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
def inline_format(text):
    """处理内联格式：加粗、斜体、行内代码、链接→span"""
    text = re.sub(
        r"`([^`]+)`",
        r'<code style="background:#f6f6f6;padding:2px 6px;border-radius:3px;'
        r'font-size:90%;color:#d14;">\1</code>',
        text,
    )
    text = re.sub(
        r"\*\*([^*]+)\*\*",
        f'<strong style="color:{PRIMARY};font-weight:bold;">\\1</strong>',
        text,
    )
    text = re.sub(r"\*([^*]+)\*", '<em style="font-style:italic;color:#555;">\\1</em>', text)
    text = re.sub(
        r"\[([^\]]+)\]\([^)]+\)",
        f'<span style="color:{PRIMARY};font-weight:500;">\\1</span>',
        text,
    )
    return text


def md_to_wx_html(md):
    """Markdown → 公众号 HTML（内联样式）。
    不依赖任何外部库，不调用飞书预处理。
    """
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
                    f"background:{PRIMARY};color:#fff;"
                    if i == 0
                    else ("background:#f9f9f9;" if i % 2 == 0 else "")
                )
                html += "<tr>"
                for cell in row_cells:
                    cell_text = inline_format(cell.strip())
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
                    f'<pre style="background:#f6f6f6;padding:16px;border-radius:6px;'
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
                f'padding-left:10px;border-left:3px solid {PRIMARY};'
                f'margin:2em 8px 0.8em 0;line-height:1.3;">'
                f'{inline_format(stripped[4:])}</h3>'
            )
        elif stripped.startswith("## "):
            flush_list()
            html_parts.append(
                f'<h2 style="font-size:18px;font-weight:bold;color:#fff;'
                f'background:{PRIMARY};display:table;padding:4px 16px;'
                f'margin:2.5em auto 1.2em;text-align:center;border-radius:4px;">'
                f'{inline_format(stripped[3:])}</h2>'
            )
        elif stripped.startswith("# "):
            flush_list()
            html_parts.append(
                f'<h1 style="font-size:22px;font-weight:bold;color:#333;'
                f'text-align:center;margin:1.5em 8px 1.2em;'
                f'padding-bottom:10px;border-bottom:2px solid {PRIMARY};">'
                f'{inline_format(stripped[2:])}</h1>'
            )
        elif stripped.startswith("> "):
            flush_list()
            html_parts.append(
                f'<blockquote style="border-left:4px solid {PRIMARY};'
                f'padding:1em 1em 1em 1.5em;margin:1.5em 8px;color:#666;'
                f'background:#f7f7f7;border-radius:0 6px 6px 0;font-size:14px;">'
                f'{inline_format(stripped[2:])}</blockquote>'
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
                f'{inline_format(ol_text)}</li>'
            )
        elif stripped.startswith("- ") or stripped.startswith("* "):
            if not in_list or list_type != "ul":
                flush_list()
                in_list = True
                list_type = "ul"
            list_items.append(
                f'<li style="margin:0.2em 0;color:#333;letter-spacing:0.1em;line-height:1.8;">'
                f'{inline_format(stripped[2:])}</li>'
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
                f'{inline_format(stripped)}</p>'
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


def make_digest(md, max_bytes=120):
    """生成摘要，按字节截断（微信限制120字节）"""
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", md)
    text = re.sub(r"\[([^\]]*)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"[#*>`~_\-]", "", text)
    text = re.sub(r"\n+", " ", text).replace("  ", " ").strip()
    while len(text.encode("utf-8")) > max_bytes:
        text = text[:-1]
    return text


# ── 主流程 ────────────────────────────────────────────
def sync(title, content_md, cover_path, image_paths=None):
    """
    同步文章到公众号草稿箱（含图片上传）

    Args:
        title: 文章标题
        content_md: Markdown 正文
        cover_path: 封面图本地路径
        image_paths: 文章内图片路径列表
    Returns:
        dict: {"media_id": "...", "title": "..."}
    """
    if not WECHAT_APPID or not WECHAT_APPSECRET:
        raise Exception("请设置 WECHAT_APPID 和 WECHAT_APPSECRET（环境变量或 wechat-articles/style.yaml）")

    print(f"[同步] 开始: {title}", file=sys.stderr)
    token = get_access_token()
    print("[同步] token OK", file=sys.stderr)

    # 上传封面图（自动裁切到 900×383）
    thumb_media_id = upload_thumb(token, cover_path)
    # 仅当正文内容引用了封面文件名时才额外上传为内嵌图
    cover_basename = os.path.basename(cover_path)
    if f"({cover_basename})" in content_md:
        cover_url = upload_image(token, cover_path)
        content_md = content_md.replace(f"({cover_basename})", f"({cover_url})")
    print(f"[同步] 封面图 OK thumb={thumb_media_id[:20]}...", file=sys.stderr)

    # 上传文章内图片并替换路径
    if image_paths:
        for img_path in image_paths:
            filename = os.path.basename(img_path)
            wx_url = upload_image(token, img_path)
            content_md = content_md.replace(f"({filename})", f"({wx_url})")
            print(f"[同步] 配图 OK {filename}", file=sys.stderr)

    # 去掉 Markdown 标题行（公众号标题单独设置）
    content_body = re.sub(r"^#\s+.*\n", "", content_md)

    html = md_to_wx_html(content_body)
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
def update_history(media_id, title, keywords=None):
    """追加发布记录到 wechat-articles/history.yaml。
    格式为简单的 YAML 列表，每条记录占若干行。
    """
    history_dir = os.path.join(os.getcwd(), "wechat-articles")
    os.makedirs(history_dir, exist_ok=True)
    history_path = os.path.join(history_dir, "history.yaml")

    kw_str = ""
    if keywords:
        kw_list = [f'"{k.strip()}"' for k in keywords]
        kw_str = f"\n  keywords: [{', '.join(kw_list)}]"

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = (
        f"\n- media_id: \"{media_id}\"\n"
        f"  title: \"{title}\"\n"
        f"  published_at: \"{now}\""
        f"{kw_str}\n"
    )

    with open(history_path, "a", encoding="utf-8") as f:
        f.write(entry)

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

    # --update-history 参数
    parser.add_argument("--media-id", help="已发布的 media_id")
    parser.add_argument("--keywords", help="关键词，逗号分隔")

    args = parser.parse_args()

    if args.convert:
        if not args.input:
            parser.error("--convert 需要 --input")
        with open(args.input, encoding="utf-8") as f:
            md = f.read()
        html = md_to_wx_html(md)
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
        result = sync(args.title, content_md, args.cover, args.images or [])
        print(json.dumps(result, ensure_ascii=False))

    elif args.update_history:
        for required_arg, name in [(args.media_id, "--media-id"), (args.title, "--title")]:
            if not required_arg:
                parser.error(f"--update-history 需要 {name}")
        keywords = [k for k in args.keywords.split(",")] if args.keywords else None
        result = update_history(args.media_id, args.title, keywords)
        print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import sys
        print(f"[ERROR] {e}", file=sys.stderr)
        sys.exit(1)
