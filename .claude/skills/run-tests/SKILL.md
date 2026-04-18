---
name: run-tests
description: 运行 Taozi 插件全部测试并输出汇总结果。新增 agents/skills/hooks/rules 后、提交前调用。
---

运行全部测试：

```bash
node tests/run-all.js
```

输出结果后，汇报：
- 总测试数 / 通过数 / 失败数
- 如有失败，列出失败的测试名称和报错原因
- 如全部通过，确认"✓ 全部测试通过，可以提交"
