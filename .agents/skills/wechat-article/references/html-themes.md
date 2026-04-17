# HTML 排版主题

> 本文件供 `wechat_publish.py` 的 `md_to_wx_html()` 函数参考，定义 4 种内置 HTML 排版主题的视觉风格和 CSS 特征。
>
> 用法：在 `style.yaml` 中设置 `theme: <主题名>`，或运行时说"用 XX 主题重新排版"。

---

## 主题概览

| 主题名 | 适用场景 | 视觉特征 |
|--------|----------|----------|
| `simple` | 通用，信息密度高的长文 | 简洁，正文黑色，H2 蓝色 inline |
| `center` | 短篇、金句型文章 | 居中排版，大量留白 |
| `decoration` | 有品牌调性的公众号 | 装饰线条，H2 左侧色块 |
| `prominent` | 深度长文，观点类文章 | 大标题，深色背景 H2，强视觉层级 |

---

## 主题 1：simple（简洁）

**设计理念：** 降低视觉噪音，让内容本身说话。字体大小、行距、间距均遵循微信公众号阅读习惯的最优值。

**CSS 特征：**

```css
/* 全局容器 */
.wx-article {
  font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 16px;
  line-height: 1.8;
  color: #333333;
  padding: 0 16px;
}

/* 正文段落 */
.wx-article p {
  margin: 0 0 16px 0;
  color: #333333;
}

/* H2 小标题 —— inline 蓝色，不独占一行 */
.wx-article h2 {
  font-size: 18px;
  font-weight: bold;
  color: #1a73e8;
  margin: 24px 0 12px 0;
  padding: 0;
  border: none;
}

/* H3 */
.wx-article h3 {
  font-size: 16px;
  font-weight: bold;
  color: #444444;
  margin: 20px 0 10px 0;
}

/* 强调 */
.wx-article strong {
  color: #1a73e8;
  font-weight: bold;
}

/* 引用块 */
.wx-article blockquote {
  border-left: 3px solid #1a73e8;
  padding: 8px 16px;
  margin: 16px 0;
  background: #f0f7ff;
  color: #555555;
  border-radius: 0 4px 4px 0;
}

/* 图片 */
.wx-article img {
  max-width: 100%;
  border-radius: 4px;
  display: block;
  margin: 16px auto;
}

/* 无序列表 */
.wx-article ul {
  padding-left: 20px;
  color: #333333;
}

.wx-article li {
  margin-bottom: 8px;
  line-height: 1.7;
}
```

**极短句样式（单独 p + 特殊 class）：**
```css
.wx-article p.punch {
  font-size: 17px;
  font-weight: bold;
  color: #222222;
  margin: 24px 0;
}
```

---

## 主题 2：center（居中）

**设计理念：** 强调每一句话的分量。适合金句密度高、文字精炼的短篇。正文居中，大量留白，适配手机屏幕的"呼吸感"。

**CSS 特征：**

```css
/* 全局容器 */
.wx-article {
  font-family: "Georgia", "Noto Serif SC", "STSong", serif;
  font-size: 17px;
  line-height: 2;
  color: #2c2c2c;
  text-align: center;
  padding: 0 24px;
}

/* 正文段落 */
.wx-article p {
  margin: 0 0 28px 0;
  text-align: center;
}

/* H2 —— 居中，加上下留白 */
.wx-article h2 {
  font-size: 20px;
  font-weight: bold;
  color: #1a1a1a;
  text-align: center;
  margin: 40px 0 20px 0;
  letter-spacing: 2px;
}

/* 分割线 */
.wx-article hr {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 32px auto;
  width: 60%;
}

/* 引用块 —— 居中，斜体 */
.wx-article blockquote {
  font-style: italic;
  color: #888888;
  margin: 24px auto;
  padding: 0 20px;
  text-align: center;
  font-size: 16px;
}

/* 图片 */
.wx-article img {
  max-width: 85%;
  display: block;
  margin: 24px auto;
  border-radius: 4px;
}

/* 极短句 —— 字号放大，颜色加深 */
.wx-article p.punch {
  font-size: 20px;
  font-weight: bold;
  color: #111111;
  letter-spacing: 1px;
  margin: 36px 0;
}
```

---

## 主题 3：decoration（装饰线条）

**设计理念：** 通过视觉元素建立品牌感，适合有固定风格调性的公众号。H2 标题左侧色块是标志性特征，可通过修改 `--accent-color` 快速换色。

**CSS 特征：**

```css
/* 全局容器 */
.wx-article {
  font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 16px;
  line-height: 1.9;
  color: #333333;
  padding: 0 16px;
  --accent-color: #e84393;  /* 品牌主色，可由 style.yaml 的 accent_color 覆盖 */
}

/* 正文段落 */
.wx-article p {
  margin: 0 0 18px 0;
}

/* H2 —— 左侧色块 + 内边距 */
.wx-article h2 {
  font-size: 18px;
  font-weight: bold;
  color: #1a1a1a;
  margin: 32px 0 14px 0;
  padding: 6px 12px;
  border-left: 4px solid var(--accent-color);
  background: linear-gradient(to right, rgba(232,67,147,0.06), transparent);
  border-radius: 0 4px 4px 0;
}

/* H3 —— 带底部装饰线 */
.wx-article h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333333;
  margin: 24px 0 10px 0;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--accent-color);
}

/* 强调 */
.wx-article strong {
  color: var(--accent-color);
  font-weight: bold;
}

/* 引用块 —— 品牌色边框 */
.wx-article blockquote {
  border-left: 4px solid var(--accent-color);
  padding: 10px 16px;
  margin: 20px 0;
  background: #fff9fc;
  color: #555555;
  border-radius: 0 8px 8px 0;
  font-style: italic;
}

/* 图片 —— 带阴影 */
.wx-article img {
  max-width: 100%;
  display: block;
  margin: 20px auto;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.12);
}

/* 分割线 —— 品牌色渐变 */
.wx-article hr {
  border: none;
  height: 2px;
  background: linear-gradient(to right, transparent, var(--accent-color), transparent);
  margin: 28px 0;
}

/* 极短句 */
.wx-article p.punch {
  font-size: 18px;
  font-weight: bold;
  color: var(--accent-color);
  margin: 28px 0;
  padding: 12px 16px;
  background: rgba(232,67,147,0.05);
  border-radius: 4px;
}
```

---

## 主题 4：prominent（强调）

**设计理念：** 强视觉层级，H2 采用深色背景块，适合论点鲜明的长文、深度分析。每个小节的标题像"锚点"，帮助读者快速定位。

**CSS 特征：**

```css
/* 全局容器 */
.wx-article {
  font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 16px;
  line-height: 1.85;
  color: #333333;
  padding: 0 14px;
}

/* 正文段落 */
.wx-article p {
  margin: 0 0 18px 0;
}

/* H2 —— 深色背景，白色文字 */
.wx-article h2 {
  font-size: 17px;
  font-weight: bold;
  color: #ffffff;
  background: #1a1a2e;
  margin: 32px -14px 16px -14px;
  padding: 12px 14px;
  letter-spacing: 1px;
}

/* H3 —— 数字序号感 */
.wx-article h3 {
  font-size: 16px;
  font-weight: bold;
  color: #1a1a2e;
  margin: 22px 0 10px 0;
  padding-left: 10px;
  border-left: 3px solid #1a1a2e;
}

/* 强调 */
.wx-article strong {
  color: #1a1a2e;
  font-weight: bold;
  background: rgba(26,26,46,0.06);
  padding: 0 2px;
  border-radius: 2px;
}

/* 引用块 */
.wx-article blockquote {
  border-left: none;
  padding: 12px 16px;
  margin: 20px 0;
  background: #f5f5f5;
  color: #444444;
  border-radius: 4px;
  position: relative;
}

.wx-article blockquote::before {
  content: '"';
  font-size: 40px;
  color: #cccccc;
  position: absolute;
  top: -8px;
  left: 8px;
  font-family: Georgia, serif;
  line-height: 1;
}

/* 图片 */
.wx-article img {
  max-width: 100%;
  display: block;
  margin: 20px auto;
  border-radius: 2px;
}

/* 无序列表 */
.wx-article ul {
  padding-left: 0;
  list-style: none;
}

.wx-article li {
  margin-bottom: 10px;
  padding-left: 18px;
  position: relative;
}

.wx-article li::before {
  content: '▸';
  position: absolute;
  left: 0;
  color: #1a1a2e;
}

/* 极短句 */
.wx-article p.punch {
  font-size: 19px;
  font-weight: bold;
  color: #1a1a2e;
  text-align: center;
  margin: 32px 0;
  padding: 16px;
  border-top: 2px solid #1a1a2e;
  border-bottom: 2px solid #1a1a2e;
}
```

---

## 主题应用说明

### 如何在 style.yaml 中配置

```yaml
# 选择主题
theme: decoration

# decoration 主题专用：品牌主色（16 进制颜色）
accent_color: "#e84393"
```

### 在 md_to_wx_html() 中的实现逻辑

```python
THEMES = ["simple", "center", "decoration", "prominent"]

def md_to_wx_html(markdown_content: str, theme: str = "simple", accent_color: str = None) -> str:
    """
    将 Markdown 转换为微信公众号兼容的 HTML。
    theme: 主题名，见 html-themes.md
    accent_color: 仅 decoration 主题生效，覆盖默认品牌色
    """
    if theme not in THEMES:
        theme = "simple"
    # ...
```

### 主题切换触发词

用户说以下内容时，重跑 Step 5 换主题：
- "用 XX 主题"
- "换个 XX 风格排版"
- "重新排版"（无指定 → 询问用户选哪个）
