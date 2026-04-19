---
name: csharp-patterns
description: C# 开发模式参考 — async/await、LINQ、依赖注入、Entity Framework、nullable 类型。
---

# C# 开发模式参考

## Async/Await

```csharp
// 正确的 async 链
public async Task<User> GetUserAsync(int id, CancellationToken ct = default) {
    var user = await _db.Users
        .AsNoTracking()
        .FirstOrDefaultAsync(u => u.Id == id, ct)
        .ConfigureAwait(false);
    return user ?? throw new NotFoundException($"User {id} not found");
}

// 并发执行
var userTask = _db.Users.ToListAsync(ct);
var orderTask = _db.Orders.ToListAsync(ct);
await Task.WhenAll(userTask, orderTask);
var users = await userTask;
var orders = await orderTask;

// 安全的 Task.WhenAll
var results = await Task.WhenAll(tasks);
```

规则: 全链路 async | 不用 .Result/.Wait() | 库代码加 ConfigureAwait(false) | 传递 CancellationToken

## LINQ

```csharp
// 物化避免多次查询
var activeUsers = await _db.Users
    .Where(u => u.IsActive && u.CreatedAt > cutoff)
    .OrderBy(u => u.Name)
    .Select(u => new UserDto(u.Id, u.Name, u.Email))
    .ToListAsync(ct);

// 分组
var byDept = employees
    .GroupBy(e => e.Department)
    .ToDictionary(g => g.Key, g => g.ToList());

// 展平
var allTags = posts.SelectMany(p => p.Tags).Distinct().ToList();
```

## 依赖注入

```csharp
// 注册服务
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddSingleton<IEmailService, SendGridEmailService>();
builder.Services.AddHttpClient<IGithubClient, GithubClient>(client => {
    client.BaseAddress = new Uri("https://api.github.com");
});

// 构造函数注入
public class UserService(IUserRepository repo, ILogger<UserService> logger) {
    public async Task<User> CreateAsync(CreateUserDto dto) {
        logger.LogInformation("Creating user {Email}", dto.Email);
        return await repo.AddAsync(new User(dto));
    }
}
```

## Nullable 参考类型

```csharp
// 开启 nullable（.csproj）
// <Nullable>enable</Nullable>

string name = GetName();       // 非空
string? optName = TryGetName(); // 可空

// 空值合并
var display = optName ?? "Anonymous";
var length = optName?.Length ?? 0;

// 模式匹配
if (optName is { Length: > 0 } nonEmpty) {
    Process(nonEmpty); // 编译器知道非空
}
```

## Entity Framework 模式

```csharp
// 预加载避免 N+1
var orders = await _db.Orders
    .Include(o => o.Items)
        .ThenInclude(i => i.Product)
    .Where(o => o.UserId == userId)
    .AsNoTracking()
    .ToListAsync(ct);

// 批量操作
await _db.Users
    .Where(u => u.LastLogin < cutoff)
    .ExecuteUpdateAsync(s => s.SetProperty(u => u.IsActive, false));

// 事务
await using var tx = await _db.Database.BeginTransactionAsync(ct);
try {
    await _db.SaveChangesAsync(ct);
    await tx.CommitAsync(ct);
} catch {
    await tx.RollbackAsync(ct);
    throw;
}
```
