#!/usr/bin/env python3
"""
热点抓取脚本 - 从微博热搜、今日头条、百度热搜获取热点
输出 JSON 格式的热点列表，纯 stdlib，无外部依赖。

用法：
  python3 fetch_hotspots.py [--limit 20] [--source all|wechat|weibo|toutiao|baidu]
"""

import json
import os
import re
import sys
import argparse
import urllib.request
import urllib.error
from datetime import datetime

# 通用请求头（模拟浏览器，避免被直接拒绝）
_DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/html, */*",
    "Accept-Language": "zh-CN,zh;q=0.9",
}

TIMEOUT = 15  # 每个来源超时秒数


def _get(url, extra_headers=None):
    """发起 GET 请求，返回响应文本。失败抛出异常。"""
    headers = {**_DEFAULT_HEADERS, **(extra_headers or {})}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        charset = "utf-8"
        ct = resp.headers.get("Content-Type", "")
        m = re.search(r"charset=([^\s;]+)", ct)
        if m:
            charset = m.group(1).lower()
        return resp.read().decode(charset, errors="replace")


# ── 来源 1：微博热搜 ────────────────────────────────────
def fetch_weibo(limit):
    """
    微博热搜公开接口。
    返回 list[dict]，字段：rank, title, heat, source, url
    """
    url = "https://weibo.com/ajax/side/hotSearch"
    text = _get(url, extra_headers={"Referer": "https://weibo.com/"})
    data = json.loads(text)

    # 响应结构：data.realtime 列表
    items = (
        data.get("data", {}).get("realtime", [])
        or data.get("data", {}).get("hotgov", [])
        or []
    )
    result = []
    for i, item in enumerate(items[:limit]):
        word = item.get("word") or item.get("note") or ""
        if not word:
            continue
        heat_raw = item.get("num", 0)
        heat = f"{int(heat_raw):,}" if heat_raw else ""
        result.append({
            "rank": i + 1,
            "title": word,
            "heat": heat,
            "source": "weibo",
            "url": f"https://s.weibo.com/weibo?q={urllib.request.quote(word)}",
        })
    return result


# ── 来源 2：今日头条热榜 ────────────────────────────────
def fetch_toutiao(limit):
    """
    今日头条热榜公开接口。
    返回 list[dict]
    """
    url = "https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc"
    text = _get(url, extra_headers={"Referer": "https://www.toutiao.com/"})
    data = json.loads(text)

    # 响应结构：data 列表
    items = data.get("data", []) or []
    result = []
    for i, item in enumerate(items[:limit]):
        title = item.get("Title") or item.get("title") or ""
        if not title:
            continue
        heat_raw = item.get("HotValue") or item.get("hot_value") or item.get("hotValue") or 0
        # 热度转为万/亿
        heat = _format_heat(heat_raw)
        article_url = item.get("Url") or item.get("url") or ""
        result.append({
            "rank": i + 1,
            "title": title,
            "heat": heat,
            "source": "toutiao",
            "url": article_url,
        })
    return result


# ── 来源 3：百度热搜 ─────────────────────────────────────
def fetch_baidu(limit):
    """
    百度实时热搜榜（解析网页 HTML）。
    返回 list[dict]
    """
    url = "https://top.baidu.com/board?tab=realtime"
    text = _get(url, extra_headers={"Referer": "https://www.baidu.com/"})

    # 从 script 标签中提取 JSON 数据
    # 百度热搜榜数据嵌在 window.__INITIAL_STATE__ 或类似变量中
    json_match = re.search(
        r'<!--s-data:(.*?)-->',
        text,
        re.DOTALL,
    )
    if not json_match:
        # 备用：尝试从 data-blade 或内联 JSON 提取
        json_match = re.search(
            r'"cards"\s*:\s*(\[.*?\])\s*[,}]',
            text,
            re.DOTALL,
        )
        if not json_match:
            raise ValueError("百度热搜：无法解析页面结构")
        raw_json = json_match.group(1)
        cards = json.loads(raw_json)
        content = cards[0].get("content", []) if cards else []
    else:
        raw_json = json_match.group(1)
        page_data = json.loads(raw_json)
        # 路径：data.cards[0].content
        cards = page_data.get("data", {}).get("cards", [])
        content = cards[0].get("content", []) if cards else []

    result = []
    for i, item in enumerate(content[:limit]):
        title = item.get("word") or item.get("title") or ""
        if not title:
            continue
        heat_raw = item.get("hotScore") or item.get("heat") or 0
        heat = _format_heat(heat_raw)
        item_url = item.get("url") or f"https://www.baidu.com/s?wd={urllib.request.quote(title)}"
        result.append({
            "rank": i + 1,
            "title": title,
            "heat": heat,
            "source": "baidu",
            "url": item_url,
        })
    return result


# ── 工具函数 ─────────────────────────────────────────────
def _format_heat(value):
    """将数值热度格式化为易读字符串（万/亿）"""
    try:
        v = int(value)
    except (TypeError, ValueError):
        return str(value) if value else ""
    if v >= 100_000_000:
        return f"{v / 100_000_000:.1f}亿"
    if v >= 10_000:
        return f"{v / 10_000:.0f}万"
    return str(v)


def _rerank(hotspots):
    """对汇总列表重新按来源内排名排序，不打乱来源间顺序。"""
    return hotspots  # 已按来源顺序追加，rank 由各来源自己保证


# ── 主抓取逻辑 ────────────────────────────────────────────
SOURCE_MAP = {
    "weibo":   fetch_weibo,
    "toutiao": fetch_toutiao,
    "baidu":   fetch_baidu,
}

# reason: wechat 公开热榜 API 需登录，暂不实现，保留占位
_UNSUPPORTED_SOURCES = {"wechat"}


def fetch_all(sources, limit):
    """
    抓取指定来源的热点，某个来源失败不影响其他来源。
    Returns:
        hotspots: list[dict]
        succeeded: list[str]  成功的来源名
        errors: dict[str, str]  失败的来源及错误信息
    """
    hotspots = []
    succeeded = []
    errors = {}

    for source in sources:
        if source in _UNSUPPORTED_SOURCES:
            errors[source] = "该来源暂不支持（需要登录态）"
            continue
        fn = SOURCE_MAP.get(source)
        if fn is None:
            errors[source] = f"未知来源: {source}"
            continue
        try:
            items = fn(limit)
            hotspots.extend(items)
            succeeded.append(source)
            print(f"[fetch] {source} OK，获取 {len(items)} 条", file=sys.stderr)
        except Exception as e:
            errors[source] = str(e)
            print(f"[fetch] {source} 失败: {e}", file=sys.stderr)

    return hotspots, succeeded, errors


def main():
    parser = argparse.ArgumentParser(description="抓取热点榜单，输出 JSON")
    parser.add_argument("--limit",  type=int, default=20, help="每个来源抓取条数（默认20）")
    parser.add_argument(
        "--source",
        default="all",
        help="来源：all | weibo | toutiao | baidu（逗号分隔多选，默认 all）",
    )
    args = parser.parse_args()

    # 解析来源列表
    if args.source.strip().lower() == "all":
        sources = list(SOURCE_MAP.keys())
    else:
        sources = [s.strip().lower() for s in args.source.split(",") if s.strip()]

    hotspots, succeeded, errors = fetch_all(sources, args.limit)

    output = {
        "hotspots": hotspots,
        "fetched_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "sources": succeeded,
    }

    if errors:
        output["errors"] = errors

    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
