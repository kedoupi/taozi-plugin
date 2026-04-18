---
name: new-hook
description: 在 taozi-plugin 中创建新 hook 的三步向导：脚本文件、hooks.json 注册、测试补充
---

新 hook 创建向导。按三步执行，缺一不可。

## 步骤

### 1. 创建 hook 脚本

新建 `scripts/hooks/<name>.js`，遵循以下模板：

```js
const { readStdinJson } = require('../lib/utils');

async function main() {
  const event = await readStdinJson();
  const toolInput = event.tool_input || {};

  // 在此添加逻辑
  // exit(0) = 放行
  // exit(2) = 拦截（仅 PreToolUse 有效，输出到 stderr 作为 Claude 的反馈）

  process.exit(0);
}

main().catch(err => {
  process.stderr.write(err.message + '\n');
  process.exit(0); // 默认放行，不因 hook 错误阻断正常流程
});
```

关键约束：
- 从 stdin 读取 JSON（不是命令行参数）
- `exit(2)` 拦截仅对 `PreToolUse` 有效
- 拦截时将原因写入 `stderr`，Claude 会看到这段文字

创建后运行语法校验：
```bash
node --check scripts/hooks/<name>.js
```

### 2. 注册到 hooks.json

在 `hooks/hooks.json` 中对应事件数组内追加：

```json
{
  "type": "command",
  "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/hooks/<name>.js",
  "matcher": "<matcher>",  
  "id": "<name>"
}
```

常用事件和 matcher：
- `PreToolUse` + `Bash` — 检查 bash 命令
- `PostToolUse` + `Write|Edit` — 编辑后检查
- `SessionStart` + `*` — 会话启动
- `Stop` + `*` — 会话结束

验证格式合法：
```bash
npm run lint
```

### 3. 补充测试

在 `tests/hooks/hooks.test.js` 中参照现有测试模式添加测试（包括正常放行和拦截两种 case）：

```js
test('<name>: 描述正常情况', () => {
  // ...
});

test('<name>: 描述拦截情况', () => {
  // ...
});
```

运行确认全绿：
```bash
node tests/run-all.js
```

### 完成确认

三步均通过后报告：hook 名称、注册事件、matcher、测试数量。
