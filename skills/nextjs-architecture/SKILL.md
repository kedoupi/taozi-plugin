---
name: nextjs-architecture
description: Next.js App Router 架构模式和最佳实践。处理 Next.js 架构决策、Server Components、数据获取策略时使用。
---

# Next.js 架构模式

## 何时使用

- App Router 架构设计
- Server/Client Components 决策
- 数据获取策略选择
- 性能优化

## App Router 结构

```
app/
├── (auth)/                 # 路由组
│   ├── login/page.tsx
│   └── register/page.tsx
├── dashboard/
│   ├── layout.tsx          # 嵌套布局
│   ├── page.tsx
│   └── settings/page.tsx
├── api/
│   └── users/route.ts      # API 端点
├── layout.tsx              # 根布局
└── page.tsx
```

## 渲染策略决策

| 场景 | 策略 | 示例 |
|------|------|------|
| 已知内容 | Static | 营销页面、博客 |
| 动态内容 | Server | 用户仪表盘 |
| 交互功能 | Client | 表单、实时更新 |

## Server vs Client Components

**Server Components（默认）**
- 直接数据库访问
- 零客户端 JS
- SEO 友好

**Client Components（'use client'）**
- 需要 useState/useEffect
- 浏览器 API
- 用户交互

## 数据获取模式

```typescript
// Server Component - 直接获取
async function Page() {
  const data = await fetchData();
  return <Component data={data} />;
}

// 使用 Suspense 流式传输
<Suspense fallback={<Loading />}>
  <SlowComponent />
</Suspense>
```

## 性能优化

- `generateStaticParams` - 静态生成动态路由
- `revalidate` - ISR 重新验证
- Streaming - 慢查询流式传输

## 详细参考

- App Router 详细配置：见 [references/app-router.md](references/app-router.md)
