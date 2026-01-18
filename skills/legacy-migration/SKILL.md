---
name: legacy-migration
description: 遗留代码迁移知识库 - 迁移策略、技术栈升级、数据库迁移。当进行代码现代化、技术栈升级、系统重构时自动引用。
---

# 遗留代码迁移

安全地迁移和现代化遗留代码的策略。

## 迁移策略

### 迁移模式选择
```
┌─────────────────────────────────────────────┐
│          遗留代码迁移策略                    │
├──────────────┬──────────────────────────────┤
│ 大爆炸重写   │ 风险高，一次性全部替换        │
│ 绞杀者模式   │ 渐进替换，新功能用新代码      │
│ 分支抽象     │ 抽象层隔离，逐步切换          │
│ 防腐层       │ 新旧系统间的适配层            │
└──────────────┴──────────────────────────────┘
```

### 绞杀者模式（Strangler Fig）
```typescript
// 旧代码
class LegacyUserService {
  getUser(id: string) {
    // 旧实现
  }
}

// 新代码
class ModernUserService {
  async getUser(id: string) {
    // 新实现
  }
}

// 代理层 - 渐进切换
class UserServiceProxy {
  private legacy = new LegacyUserService();
  private modern = new ModernUserService();

  async getUser(id: string) {
    if (featureFlags.useModernUserService) {
      return this.modern.getUser(id);
    }
    return this.legacy.getUser(id);
  }
}
```

### 防腐层（Anti-Corruption Layer）
```typescript
// 遗留系统的数据格式
interface LegacyUser {
  usr_id: string;
  usr_name: string;
  usr_email: string;
}

// 新系统的数据格式
interface User {
  id: string;
  name: string;
  email: string;
}

// 防腐层 - 转换数据格式
class UserAdapter {
  static fromLegacy(legacy: LegacyUser): User {
    return {
      id: legacy.usr_id,
      name: legacy.usr_name,
      email: legacy.usr_email,
    };
  }

  static toLegacy(user: User): LegacyUser {
    return {
      usr_id: user.id,
      usr_name: user.name,
      usr_email: user.email,
    };
  }
}
```

## 技术栈升级

### JavaScript → TypeScript

**步骤**:
1. 添加 tsconfig.json，设置 `allowJs: true`
2. 逐文件添加 `.d.ts` 类型声明
3. 将 `.js` 改为 `.ts`
4. 添加类型注解
5. 逐步提升 strict 模式

```json
// tsconfig.json - 渐进配置
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "strict": false,  // 初期关闭
    "noImplicitAny": false  // 逐步开启
  }
}
```

### Class Components → Hooks

```typescript
// 旧的 Class Component
class UserProfile extends React.Component {
  state = { user: null, loading: true };

  componentDidMount() {
    this.fetchUser();
  }

  fetchUser = async () => {
    const user = await api.getUser(this.props.id);
    this.setState({ user, loading: false });
  };

  render() {
    if (this.state.loading) return <Loading />;
    return <Profile user={this.state.user} />;
  }
}

// 新的 Function Component + Hooks
function UserProfile({ id }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.getUser(id),
  });

  if (isLoading) return <Loading />;
  return <Profile user={user} />;
}
```

### REST → GraphQL

```typescript
// 适配层 - 保持旧 API 兼容
class ApiAdapter {
  private graphqlClient: GraphQLClient;

  // 旧的 REST 接口
  async getUsers(): Promise<User[]> {
    const { data } = await this.graphqlClient.query({
      query: GET_USERS,
    });
    return data.users;
  }

  async getUser(id: string): Promise<User> {
    const { data } = await this.graphqlClient.query({
      query: GET_USER,
      variables: { id },
    });
    return data.user;
  }
}
```

## 数据库迁移

### Schema 迁移策略
```typescript
// 使用迁移工具 (Prisma, Knex, etc.)
// 每次迁移都是一个可回滚的步骤

// migration: add_email_verified_field
export async function up(db) {
  await db.schema.alterTable('users', (table) => {
    table.boolean('email_verified').defaultTo(false);
  });
}

export async function down(db) {
  await db.schema.alterTable('users', (table) => {
    table.dropColumn('email_verified');
  });
}
```

### 双写模式
```typescript
// 同时写入新旧系统，逐步切换读取
class UserRepository {
  async create(user: User) {
    // 写入旧系统
    await this.legacyDb.insert(user);
    // 写入新系统
    await this.newDb.insert(user);
  }

  async findById(id: string) {
    // 读取策略可配置
    if (config.readFromNewDb) {
      return this.newDb.findById(id);
    }
    return this.legacyDb.findById(id);
  }
}
```

## 测试策略

### 特性测试保护
```typescript
// 在重构前编写特性测试
describe('UserService', () => {
  it('should return user by id', async () => {
    const user = await userService.getUser('123');
    expect(user).toMatchObject({
      id: '123',
      name: expect.any(String),
      email: expect.any(String),
    });
  });
});
```

### 对比测试
```typescript
// 对比新旧实现结果
async function compareImplementations() {
  const testCases = getTestCases();

  for (const testCase of testCases) {
    const legacyResult = await legacy.process(testCase);
    const modernResult = await modern.process(testCase);

    if (!deepEqual(legacyResult, modernResult)) {
      console.error('Mismatch:', { testCase, legacyResult, modernResult });
    }
  }
}
```

## 迁移检查清单

### 准备阶段
- [ ] 充分了解遗留代码的业务逻辑
- [ ] 编写特性测试覆盖关键功能
- [ ] 确定迁移策略（绞杀者/分支抽象/防腐层）
- [ ] 评估风险和回滚方案

### 执行阶段
- [ ] 小步迭代，每步可验证
- [ ] 保持新旧代码并行运行
- [ ] 使用特性开关控制切换
- [ ] 监控错误和性能指标

### 验收阶段
- [ ] 所有测试通过
- [ ] 性能不低于旧系统
- [ ] 功能行为一致
- [ ] 清理旧代码和特性开关

## 常见陷阱

### 避免
- 一次性全部重写
- 忽略边界情况
- 没有充分测试就切换
- 过早删除旧代码

### 推荐
- 渐进式迁移
- 双系统并行验证
- 特性开关控制
- 保留回滚能力
