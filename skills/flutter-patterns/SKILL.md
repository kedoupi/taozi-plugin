---
name: flutter-patterns
description: Flutter/Dart 开发模式参考 — Widget 组合、状态管理（Riverpod/BLoC）、async/Future、null safety、测试。
---

# Flutter/Dart 开发模式参考

## Widget 组合

```dart
// 优先组合，不继承
class UserCard extends StatelessWidget {
  const UserCard({super.key, required this.user});
  final User user;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: CircleAvatar(backgroundImage: NetworkImage(user.avatarUrl)),
        title: Text(user.name),
        subtitle: Text(user.email),
        trailing: const Icon(Icons.arrow_forward_ios),
      ),
    );
  }
}

// const 构造函数性能优化
class AppHeader extends StatelessWidget {
  const AppHeader({super.key, required this.title});
  final String title;
  @override
  Widget build(BuildContext context) => Text(title, style: Theme.of(context).textTheme.headlineMedium);
}
```

原则: 尽可能用 `const` | 拆小 Widget | StatelessWidget 优先

## Riverpod 状态管理

```dart
// Provider 定义
@riverpod
Future<List<User>> users(UsersRef ref) async {
  return ref.watch(userRepositoryProvider).getAll();
}

@riverpod
class UserNotifier extends _$UserNotifier {
  @override
  Future<User?> build(String userId) async {
    return ref.watch(userRepositoryProvider).findById(userId);
  }

  Future<void> update(UserUpdate data) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() =>
        ref.read(userRepositoryProvider).update(userId, data));
  }
}

// 在 Widget 中使用
class UserScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final users = ref.watch(usersProvider);
    return users.when(
      loading: () => const CircularProgressIndicator(),
      error: (e, _) => Text('Error: $e'),
      data: (list) => UserList(users: list),
    );
  }
}
```

## Async / Future

```dart
// FutureBuilder
FutureBuilder<User>(
  future: fetchUser(id),
  builder: (context, snapshot) {
    if (snapshot.connectionState == ConnectionState.waiting)
      return const CircularProgressIndicator();
    if (snapshot.hasError) return Text('Error: ${snapshot.error}');
    return UserCard(user: snapshot.requireData);
  },
)

// async/await 安全模式
Future<void> submit() async {
    try {
        await api.post(data);
        if (!mounted) return;  // 必须检查！
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Done')));
    } catch (e) {
        if (!mounted) return;
        showDialog(context: context, builder: (_) => ErrorDialog(error: e));
    }
}
```

## Null Safety

```dart
// 可空处理模式
String? name = getName();
final display = name ?? 'Anonymous';
final length = name?.length ?? 0;

// 断言只在确定非空时用（测试/确定有值时）
final user = cache['admin']!;

// 晚初始化（一定会在使用前赋值）
late final Database _db;
@override
void initState() {
    super.initState();
    _db = Database.open();
}
```

## 测试

```dart
// Widget 测试
testWidgets('UserCard shows name', (tester) async {
  await tester.pumpWidget(MaterialApp(
    home: UserCard(user: User(id: '1', name: 'Alice', email: 'a@a.com')),
  ));
  expect(find.text('Alice'), findsOneWidget);
});

// Unit 测试（Riverpod）
test('users provider returns list', () async {
  final container = ProviderContainer(overrides: [
    userRepositoryProvider.overrideWithValue(FakeUserRepository()),
  ]);
  addTearDown(container.dispose);
  final users = await container.read(usersProvider.future);
  expect(users, isNotEmpty);
});
```
