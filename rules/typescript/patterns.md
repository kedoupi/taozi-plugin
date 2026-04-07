# TypeScript 设计模式

> 本文件扩展 [common/coding-style.md](../coding-style.md)

## React Hooks 规则

```typescript
// ✅ hooks 只在顶层调用，不在条件/循环中使用
function UserProfile({ userId }: { userId: string }) {
  const user = useUser(userId);
  const isLoading = user === null;
  // ...

// ❌ 条件中调用 hooks
function UserProfile({ userId }: { userId: string }) {
  if (userId) {
    const user = useUser(userId); // 规则违反
  }
}
```

## 错误边界

```typescript
import { Component, type ReactNode } from 'react';

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
```

## 组合优于继承

```typescript
// ✅ 用组合模式扩展功能
interface WithTimestamp {
  createdAt: Date;
  updatedAt: Date;
}

type Timestamped<T> = T & WithTimestamp;

// ✅ 用 HOC 或 render props 复用逻辑
function withAuth<P extends object>(
  Component: React.ComponentType<P>,
) {
  return (props: P) => {
    const { user, isLoading } = useAuth();
    if (isLoading) return <Spinner />;
    if (!user) return <Navigate to="/login" />;
    return <Component {...props} />;
  };
}
```

## 状态管理模式

```typescript
// 简单状态：useState / useReducer
// 跨组件共享：Zustand 或 Jotai（避免 Context 性能陷阱）
// 服务端状态：TanStack Query

// ✅ Zustand store 模式
import { create } from 'zustand';

interface BearStore {
  bears: number;
  increase: () => void;
}

const useBearStore = create<BearStore>((set) => ({
  bears: 0,
  increase: () => set((s) => ({ bears: s.bears + 1 })),
}));
```

## 自定义 Hooks 模式

```typescript
// ✅ 以 use 开头，封装可复用逻辑
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```
