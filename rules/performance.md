# 性能规范

> 过早优化是万恶之源，但已知瓶颈必须解决。

## 模型选择策略

| 场景 | 推荐模型 | 原因 |
|------|---------|------|
| 日常编码、简单重构 | Sonnet | 速度快、成本低 |
| 架构设计、复杂调试 | Opus | 推理能力强 |
| 批量文件修改 | Sonnet | 并行处理即可 |
| 代码审查 | Opus | 需要深度理解 |

原则：默认 Sonnet，遇到困难再升级。不要用大炮打蚊子。

## 上下文窗口管理

```
推荐上限：
- MCP 连接数 < 10    （过多连接拖慢启动）
- 注册工具数 < 80    （工具描述占用 token）
- 单次对话轮次 < 30  （过长则应 compact 或重新开始）
```

- 对话过长时主动 compact，在逻辑断点处执行
- 无关上下文会降低输出质量，保持聚焦
- 大文件只传必要片段，不要整文件灌入

## 数据库查询优化

```javascript
// 避免：N+1 查询
const users = await User.findAll();
for (const user of users) {
  user.orders = await Order.findByUserId(user.id); // N 次！
}

// 推荐：批量查询
const users = await User.findAll();
const orders = await Order.findByUserIds(users.map(u => u.id));
// 在内存中关联
```

索引规则：
- WHERE 条件字段建索引
- JOIN 关联字段建索引
- 避免 `SELECT *`，只查需要的列
- 分页查询用游标而非 OFFSET（大数据量时）

## 前端性能

- **懒加载**：非首屏组件延迟加载（`React.lazy`、动态 import）
- **缓存策略**：
  - 静态资源：长期缓存 + 内容哈希文件名
  - API 数据：合理使用 SWR/React Query 缓存
  - 图片：使用 CDN + WebP 格式
- **渲染优化**：
  - 列表使用虚拟滚动（超过 100 项时）
  - 避免不必要的重渲染（`React.memo`、`useMemo`）
  - 图片懒加载（`loading="lazy"`）

## 压缩时机

在逻辑断点处手动 compact：
- 完成一个功能模块后
- 切换到新任务前
- 对话超过 30 轮时
- 感觉回答质量下降时

不要在以下时机 compact：
- 调试过程中（需要保留错误上下文）
- 代码审查过程中（需要完整 diff 上下文）
- 任务进行到一半时

## 禁止行为

- 不做性能测试就说"优化了性能"
- 为了微秒级优化牺牲代码可读性
- 在没有瓶颈证据时引入缓存层
- 过早引入消息队列、微服务等复杂架构
