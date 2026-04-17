# 微信 API 速查

> 本文件供 wechat_publish.py 和子 Agent 参考，记录公众号内容发布流程所需的全部接口。
> 官方文档：https://developers.weixin.qq.com/doc/offiaccount/

---

## 1. 获取 Access Token

使用 stable_token 接口（推荐，避免频繁换 token）。

**接口：**
```
POST https://api.weixin.qq.com/cgi-bin/stable_token
Content-Type: application/json
```

**请求体：**
```json
{
  "grant_type": "client_credential",
  "appid": "YOUR_APPID",
  "secret": "YOUR_SECRET",
  "force_refresh": false
}
```

**响应：**
```json
{
  "access_token": "ACCESS_TOKEN",
  "expires_in": 7200
}
```

**注意事项：**
- `force_refresh: false` 时，2 小时内重复调用返回同一 token（节省调用次数）
- `force_refresh: true` 时强制刷新，但会使旧 token 立即失效
- token 有效期 7200 秒，建议提前 5 分钟刷新
- **每日调用限额：** stable_token 每天最多 8000 次

---

## 2. 上传正文内图片

正文中嵌入的图片必须先上传到微信服务器，获取 URL 后在 HTML 中引用。

**接口：**
```
POST https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=ACCESS_TOKEN
Content-Type: multipart/form-data
```

**请求参数：**
- `media`：图片文件（jpg/png/gif/bmp，≤1MB）

**响应：**
```json
{
  "url": "http://mmbiz.qpic.cn/..."
}
```

**注意事项：**
- 返回的 URL 只能用于本公众号文章正文，不可直接分享
- 图片大小限制：≤1MB
- 支持格式：jpg、png、gif、bmp

---

## 3. 上传封面图（永久素材）

封面图必须上传为永久素材，获取 media_id 后在草稿接口中使用。

**接口：**
```
POST https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=ACCESS_TOKEN&type=image
Content-Type: multipart/form-data
```

**请求参数：**
- `media`：图片文件
- `description`（可选）：`{"title":"封面图标题","introduction":"简介"}`

**响应：**
```json
{
  "media_id": "MEDIA_ID",
  "url": "https://mmbiz.qpic.cn/..."
}
```

**注意事项：**
- 图片素材大小限制：≤10MB
- 封面图建议尺寸：900×500 像素（16:9）
- media_id 永久有效，可复用
- **素材数量限制：** 图片素材最多 5000 个

---

## 4. 新建草稿

**接口：**
```
POST https://api.weixin.qq.com/cgi-bin/draft/add?access_token=ACCESS_TOKEN
Content-Type: application/json
```

**请求体：**
```json
{
  "articles": [
    {
      "title": "文章标题（≤64 字）",
      "author": "作者名",
      "digest": "摘要（≤120 字节，≤54 汉字）",
      "content": "<p>HTML 格式正文</p>",
      "content_source_url": "原文链接（可选）",
      "thumb_media_id": "封面图 media_id",
      "need_open_comment": 1,
      "only_fans_can_comment": 0
    }
  ]
}
```

**响应：**
```json
{
  "media_id": "DRAFT_MEDIA_ID"
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 标题，≤64 字符 |
| author | string | 否 | 作者，≤8 字 |
| digest | string | 否 | 摘要，≤120 字节（UTF-8） |
| content | string | 是 | HTML 正文，≤20000 字 |
| content_source_url | string | 否 | 原文 URL |
| thumb_media_id | string | 是 | 封面图 media_id |
| need_open_comment | int | 否 | 1=开启评论，0=关闭 |
| only_fans_can_comment | int | 否 | 1=仅粉丝可评论 |

**注意事项：**
- `content` 必须是 HTML 格式，Markdown 需先转换
- 正文图片 URL 必须是通过 uploadimg 获取的微信域名图片
- `digest` 若不填，微信自动截取正文前 54 字

---

## 5. 常见错误码

| 错误码 | 含义 | 处理方案 |
|--------|------|----------|
| 40001 | access_token 无效或过期 | 重新获取 token，重试一次 |
| 40003 | openid 无效 | 检查 appid 配置 |
| 40007 | media_id 无效 | 重新上传封面图 |
| 40029 | code 无效 | 不适用于服务号场景 |
| 40164 | IP 不在白名单 | 在公众号后台「安全中心」添加服务器 IP；或设置 WECHAT_PROXY 环境变量走代理 |
| 41001 | 缺少 access_token | 检查请求参数 |
| 43019 | 未开通草稿箱 | 在公众号后台「功能」→「草稿箱」中开启 |
| 44016 | content 为空 | 检查文章内容 |
| 45009 | 超过当日调用次数 | 明天再试；检查是否有其他服务在消耗配额 |
| 45016 | 摘要超长 | digest 须 ≤120 UTF-8 字节 |
| 48001 | 接口权限未授权 | 服务号需申请相应接口权限 |

---

## 6. 调用限额表

| 接口 | 日限额 | 备注 |
|------|--------|------|
| stable_token | 8000 次/天 | force_refresh=false 时复用 token 不消耗 |
| uploadimg | 1000 次/天 | 正文图片上传 |
| add_material（图片） | 1000 次/天 | 永久素材上传 |
| draft/add | 不限次数 | 受正文长度和素材限制 |
| media/uploadnews | 不限次数 | 群发用（非草稿箱场景） |

---

## 7. HTML 内容规范

微信公众号对 HTML 有严格限制，非法标签和属性会被过滤。

**允许的标签：**
`<p>` `<br>` `<h1>`-`<h6>` `<strong>` `<em>` `<blockquote>` `<ul>` `<ol>` `<li>` `<img>` `<a>` `<table>` `<tr>` `<td>` `<section>` `<span>` `<div>`

**允许的样式属性（inline style）：**
`color` `font-size` `font-weight` `text-align` `line-height` `margin` `padding` `background-color` `border` `border-radius`

**禁止的内容：**
- JavaScript（`<script>` 标签）
- 外链 CSS（`<link rel="stylesheet">`）
- 非微信域名的图片 URL（会被过滤为空）
- `<iframe>` 嵌入

**图片规范：**
- 正文图片必须使用 uploadimg 返回的 `http://mmbiz.qpic.cn/` 域名
- 建议图片宽度 ≤677px（公众号正文显示宽度）
- 格式：jpg/png/gif，单张 ≤1MB
