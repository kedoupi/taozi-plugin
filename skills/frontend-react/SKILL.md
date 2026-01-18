---
name: frontend-react
description: React 前端开发知识库 - 组件设计、状态管理、Hooks、性能优化。当进行 React 开发、组件设计、状态管理选型时自动引用。
---

# React 前端开发知识

React 应用开发的最佳实践和常用模式。

## 组件设计原则

### 组件分类
- **容器组件**: 处理数据和逻辑，不关心 UI
- **展示组件**: 只关心 UI 渲染，通过 props 接收数据
- **组合组件**: 使用 children 或 render props 组合

### 组件结构
```typescript
// 推荐的组件文件结构
components/
├── Button/
│   ├── index.tsx       // 导出
│   ├── Button.tsx      // 组件实现
│   ├── Button.test.tsx // 测试
│   └── Button.module.css // 样式
```

## 状态管理

### 选择原则
```
本地 UI 状态 → useState
跨组件共享 → Context / Zustand
服务器状态 → React Query / SWR
复杂全局 → Redux Toolkit
```

### React Query 模式
```typescript
// 数据获取
const { data, isLoading, error } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 5 * 60 * 1000,
});

// 数据变更
const mutation = useMutation({
  mutationFn: updateUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

### Zustand 模式
```typescript
const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

## Hooks 最佳实践

### 自定义 Hook 模式
```typescript
// useAsync - 处理异步操作
function useAsync<T>(asyncFunction: () => Promise<T>) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({ data: null, loading: false, error: null });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, [asyncFunction]);

  return { ...state, execute };
}
```

### 常见陷阱
```typescript
// 依赖数组缺失
useEffect(() => {
  fetchData(id);
}, []); // 缺少 id

// 正确
useEffect(() => {
  fetchData(id);
}, [id]);

// 对象/数组作为依赖
useEffect(() => {
  doSomething(options);
}, [options]); // 每次渲染都是新对象

// 使用 useMemo 或解构
const { page, limit } = options;
useEffect(() => {
  doSomething({ page, limit });
}, [page, limit]);
```

## 性能优化

### 避免不必要的渲染
```typescript
// React.memo - 浅比较 props
const MemoizedComponent = React.memo(Component);

// useMemo - 缓存计算结果
const expensiveValue = useMemo(() =>
  computeExpensiveValue(data),
  [data]
);

// useCallback - 缓存函数引用
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

### 懒加载
```typescript
// 组件懒加载
const LazyComponent = lazy(() => import('./LazyComponent'));

// 使用 Suspense
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

### 虚拟列表
```typescript
// 使用 react-virtual 或 react-window
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });
  // ...
}
```

## 表单处理

### React Hook Form
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    // 处理表单
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      {/* ... */}
    </form>
  );
}
```

## 样式方案

### Tailwind CSS
```typescript
// 使用 clsx 或 cn 处理条件样式
import { cn } from '@/lib/utils';

<button
  className={cn(
    'px-4 py-2 rounded',
    variant === 'primary' && 'bg-blue-500 text-white',
    variant === 'secondary' && 'bg-gray-200 text-gray-800',
    disabled && 'opacity-50 cursor-not-allowed'
  )}
/>
```

### CSS Modules
```typescript
import styles from './Button.module.css';

<button className={styles.button} />
```

## 测试

### 组件测试
```typescript
import { render, screen, fireEvent } from '@testing-library/react';

test('button click increments counter', () => {
  render(<Counter />);

  const button = screen.getByRole('button', { name: /increment/i });
  fireEvent.click(button);

  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### Hook 测试
```typescript
import { renderHook, act } from '@testing-library/react';

test('useCounter increments', () => {
  const { result } = renderHook(() => useCounter());

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```
