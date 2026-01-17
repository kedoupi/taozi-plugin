# Next.js App Router 详细配置

## 完整目录结构

```
app/
├── (auth)/                 # Route group for auth pages
│   ├── login/
│   │   └── page.tsx       # /login
│   └── register/
│       └── page.tsx       # /register
├── dashboard/
│   ├── layout.tsx         # Nested layout for dashboard
│   ├── page.tsx           # /dashboard
│   ├── analytics/
│   │   └── page.tsx       # /dashboard/analytics
│   └── settings/
│       └── page.tsx       # /dashboard/settings
├── api/
│   ├── auth/
│   │   └── route.ts       # API endpoint
│   └── users/
│       └── route.ts
├── globals.css
├── layout.tsx             # Root layout
└── page.tsx               # Home page
```

## Server Components 数据获取

```typescript
// Server Component - runs on server
async function UserDashboard({ userId }: { userId: string }) {
  // Direct database access in Server Components
  const user = await getUserById(userId);
  const posts = await getPostsByUser(userId);

  return (
    <div>
      <UserProfile user={user} />
      <PostList posts={posts} />
      <InteractiveWidget userId={userId} /> {/* Client Component */}
    </div>
  );
}

// Client Component boundary
'use client';
import { useState } from 'react';

function InteractiveWidget({ userId }: { userId: string }) {
  const [data, setData] = useState(null);

  // Client-side interactions and state
  return <div>Interactive content...</div>;
}
```

## 使用 Suspense 流式传输

```typescript
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsData />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <RecentPosts />
      </Suspense>
    </div>
  );
}

async function AnalyticsData() {
  const analytics = await fetchAnalytics(); // Slow query
  return <AnalyticsChart data={analytics} />;
}
```

## 静态生成与 ISR

```typescript
// Generate static params for dynamic routes
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Static generation with ISR
export const revalidate = 3600; // Revalidate every hour

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  return <PostContent post={post} />;
}
```

## 中间件配置

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
};
```

## 迁移策略

### 从 Pages Router 迁移

1. **渐进式迁移**: 同时使用两个路由
2. **布局转换**: 将 `_app.js` 转换为 `layout.tsx`
3. **API 路由**: 从 `pages/api/` 移动到 `app/api/*/route.ts`
4. **数据获取**: 将 `getServerSideProps` 转换为 Server Components
5. **Client Components**: 在需要的地方添加 'use client' 指令

### 数据获取迁移

```typescript
// Before (Pages Router)
export async function getServerSideProps(context) {
  const data = await fetchData(context.params.id);
  return { props: { data } };
}

// After (App Router)
async function Page({ params }: { params: { id: string } }) {
  const data = await fetchData(params.id);
  return <ComponentWithData data={data} />;
}
```

## 架构决策框架

### 渲染策略
- 静态: 已知内容，高性能需求
- 服务器: 动态内容，SEO 要求
- 客户端: 交互功能，实时更新

### 数据获取模式
- Server Components: 直接数据库访问
- Client Components: 使用 SWR/React Query 进行缓存
- API 路由: 外部 API 集成

### 性能要求
- 营销页面使用静态生成
- 频繁更改的内容使用 ISR
- 慢查询使用流式传输
