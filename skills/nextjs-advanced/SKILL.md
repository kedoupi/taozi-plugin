---
name: nextjs-advanced
description: Next.js 高级特性知识库 - App Router、Server Components、数据获取、性能优化。当进行 Next.js 开发、SSR/SSG、Server Actions 时自动引用。
---

# Next.js 高级特性

Next.js App Router 和高级优化技巧。

## App Router 架构

### 目录结构
```
app/
├── layout.tsx           # 根布局
├── page.tsx             # 首页
├── loading.tsx          # 加载状态
├── error.tsx            # 错误边界
├── not-found.tsx        # 404 页面
├── (auth)/              # 路由组（不影响 URL）
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── dashboard/
│   ├── layout.tsx       # 嵌套布局
│   ├── page.tsx
│   └── [id]/            # 动态路由
│       └── page.tsx
└── api/
    └── users/
        └── route.ts     # API 路由
```

### 特殊文件
```typescript
// layout.tsx - 共享布局
export default function Layout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

// loading.tsx - 流式加载
export default function Loading() {
  return <Skeleton />;
}

// error.tsx - 错误处理
'use client';
export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Server Components

### 服务端组件（默认）
```typescript
// 默认是 Server Component
// 可以直接使用 async/await
// 可以直接访问数据库、文件系统

async function UserList() {
  const users = await prisma.user.findMany();
  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

### 客户端组件
```typescript
'use client';

import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

### 组合模式
```typescript
// 服务端组件获取数据，传递给客户端组件
async function ProductPage({ id }) {
  const product = await getProduct(id);
  return (
    <div>
      <h1>{product.name}</h1>
      {/* 客户端交互组件 */}
      <AddToCartButton productId={id} />
    </div>
  );
}
```

## 数据获取

### Server Component 数据获取
```typescript
// 带缓存的数据获取
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 } // 1小时重新验证
  });
  return res.json();
}

// 不缓存
const res = await fetch(url, { cache: 'no-store' });

// 强制缓存
const res = await fetch(url, { cache: 'force-cache' });
```

### Server Actions
```typescript
// actions.ts
'use server';

export async function createUser(formData: FormData) {
  const name = formData.get('name');
  const email = formData.get('email');

  await prisma.user.create({
    data: { name, email }
  });

  revalidatePath('/users');
  redirect('/users');
}

// 在组件中使用
<form action={createUser}>
  <input name="name" />
  <input name="email" />
  <button type="submit">Create</button>
</form>
```

## 路由处理

### API Route Handlers
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page') || '1';

  const users = await prisma.user.findMany({
    skip: (parseInt(page) - 1) * 10,
    take: 10,
  });

  return NextResponse.json({ data: users });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await prisma.user.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}
```

### 动态路由
```typescript
// app/users/[id]/page.tsx
export default async function UserPage({
  params
}: {
  params: { id: string }
}) {
  const user = await getUser(params.id);
  return <UserProfile user={user} />;
}

// 生成静态路径
export async function generateStaticParams() {
  const users = await prisma.user.findMany();
  return users.map(user => ({ id: user.id }));
}
```

## 中间件

```typescript
// middleware.ts (根目录)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 认证检查
  const token = request.cookies.get('token');
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 添加请求头
  const response = NextResponse.next();
  response.headers.set('x-custom-header', 'value');
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

## 性能优化

### 图片优化
```typescript
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority        // 首屏图片
  placeholder="blur"
  blurDataURL="data:image/..."
/>
```

### 字体优化
```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export default function Layout({ children }) {
  return (
    <html className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

### 脚本优化
```typescript
import Script from 'next/script';

// 不同加载策略
<Script src="analytics.js" strategy="afterInteractive" />
<Script src="widget.js" strategy="lazyOnload" />
<Script id="inline" strategy="beforeInteractive">
  {`console.log('Hello')`}
</Script>
```

## 元数据

```typescript
// 静态元数据
export const metadata = {
  title: 'My App',
  description: 'Description',
  openGraph: {
    title: 'My App',
    images: ['/og.jpg'],
  },
};

// 动态元数据
export async function generateMetadata({ params }) {
  const product = await getProduct(params.id);
  return {
    title: product.name,
    description: product.description,
  };
}
```

## 缓存策略

### 数据缓存
```typescript
// 使用 unstable_cache
import { unstable_cache } from 'next/cache';

const getCachedUser = unstable_cache(
  async (id: string) => prisma.user.findUnique({ where: { id } }),
  ['user'],
  { revalidate: 3600, tags: ['user'] }
);

// 重新验证
import { revalidateTag, revalidatePath } from 'next/cache';

revalidateTag('user');
revalidatePath('/users');
```

### 路由缓存控制
```typescript
// 强制动态渲染
export const dynamic = 'force-dynamic';

// 强制静态渲染
export const dynamic = 'force-static';

// 重新验证时间
export const revalidate = 3600;
```

## 国际化

```typescript
// next.config.js
module.exports = {
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'en',
  },
};

// 在页面中使用
import { useRouter } from 'next/router';

function Page() {
  const { locale, locales } = useRouter();
  // ...
}
```
