---
name: multi-execute
description: 多 Agent 并行执行 — 按照计划并行调度多个 Agent 执行子任务
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
argument-hint: [计划文件路径]
---

# Taozi Multi-Execute - 多 Agent 并行执行

读取 multi-plan 生成的执行计划，按依赖顺序并行调度多个 Agent 完成子任务。

## 执行步骤

### 1. 读取执行计划

读取 `$ARGUMENTS` 指定的计划文件：

```bash
# 验证文件存在
cat "$ARGUMENTS"
```

如果文件不存在：
```
错误: 计划文件不存在。
请先运行 /multi-plan [任务描述] 生成执行计划。
```

### 2. 解析计划

解析执行计划中的：
- 子任务列表及其依赖关系
- 每个 Agent 分配
- 输入/输出定义
- 依赖图（确定执行顺序）

### 3. 分组执行

按依赖分组，组内并行，组间顺序执行：

```
执行策略:
1. 解析依赖图，确定拓扑排序
2. 没有依赖的任务作为第一批并行执行
3. 每批完成后，检查下一批的依赖是否满足
4. 依赖满足的任务开始执行
5. 重复直到所有任务完成
```

### 4. Agent 调度

对每个子任务，根据计划中的 Agent 分配：

```
调度方式:
- 使用 Agent 对应的专业知识执行任务
- 传递上游任务的输出作为输入
- 每个 Agent 遵循自己的工作流程和输出规范
- 完成后输出标准化的结果
```

### 5. 结果收集

每个子任务完成后收集：
- 执行状态（成功/失败/部分完成）
- 输出产物（文件路径、报告内容）
- 发现的问题（需要人工介入的）
- 传递给下游任务的上下文

### 6. 验证检查

所有任务完成后：
- 检查所有预期产物是否生成
- 运行构建验证
- 运行测试（如果有）
- 检查是否有遗漏的依赖

## 输出规范

### 执行报告
```markdown
## 多 Agent 执行报告

### 执行概况
- 总任务数: 5
- 成功: 4
- 失败: 0
- 部分完成: 1
- 总耗时: 约 N 分钟

### 执行详情

#### Group A (并行)
- **T1** fullstack-developer: 实现用户 API
  - 状态: 成功
  - 产物: src/api/users.ts, src/services/user.service.ts
  - 用时: 3 分钟

- **T2** tdd-guide: 编写用户模块测试
  - 状态: 成功
  - 产物: tests/user.service.test.ts
  - 用时: 2 分钟

#### Group B (依赖 A)
- **T3** fullstack-developer: 集成测试补充
  - 状态: 成功
  - 产物: tests/user.integration.test.ts
  - 依赖: T1, T2

#### Group C (依赖 B)
- **T4** code-reviewer: 代码审查
  - 状态: 成功
  - 产物: 审查报告（见下方）

- **T5** doc-updater: 文档更新
  - 状态: 部分完成
  - 产物: README.md（已更新）
  - 备注: API 文档需要补充更多细节

### 验证结果
- 构建: 通过
- 测试: 12/12 通过
- 类型检查: 无错误

### 生成的文件
1. src/api/users.ts
2. src/services/user.service.ts
3. tests/user.service.test.ts
4. tests/user.integration.test.ts
5. README.md (已更新)

### 遗留问题
- T5 部分完成: API 文档需补充示例代码
- 建议运行 /doc-updater 补充完善
```

## 错误处理

### 任务失败
- 记录失败原因
- 标记所有依赖此任务的后续任务为"阻塞"
- 继续执行不依赖失败任务的其他任务
- 在报告中汇总所有失败和阻塞项

### 部分完成
- 记录完成的部分
- 标注未完成的部分和原因
- 提供手动修复的建议

## 使用示例

```bash
# 执行已生成的计划
/multi-execute .claude/multi-plan.md

# 指定完整路径
/multi-execute ~/project/.claude/multi-plan.md
```

## 注意事项

- 计划文件由 `/multi-plan` 生成，不要手动编辑格式
- 执行过程中会修改文件，建议先提交或创建分支
- 失败的任务需要人工介入后再继续
- 大型任务建议分阶段执行，每阶段生成新的计划
