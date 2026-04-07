# TypeScript 测试规范

> 本文件扩展 [common/testing.md](../testing.md)

## 框架选择

- 单元/集成测试：Vitest（优先）或 Jest
- React 组件：React Testing Library + jsdom
- API Mock：MSW (Mock Service Worker)
- 覆盖率：`vitest --coverage` 或 `jest --coverage`

## Vitest 配置模板

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/types/**'],
      thresholds: { lines: 80, branches: 70 },
    },
  },
});
```

## React 组件测试模式

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('应在提交有效数据后调用 onSubmit', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('邮箱'), 'test@example.com');
    await user.type(screen.getByLabelText('密码'), 'secret123');
    await user.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'secret123',
      });
    });
  });
});
```

## MSW Mock 模式

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const server = setupServer(
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({ id: params.id, name: 'Test User' });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## 测试文件命名

- 单元测试：`*.test.ts`
- 组件测试：`*.test.tsx`
- 集成测试：`*.integration.test.ts`
- E2E 测试：放 `e2e/` 目录，命名 `*.spec.ts`
