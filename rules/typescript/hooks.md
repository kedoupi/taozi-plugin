# TypeScript 自动化钩子

> 本文件扩展 [common/coding-style.md](../coding-style.md)

## 格式化工具链

优先使用 Biome（替代 ESLint + Prettier 组合），或传统 ESLint + Prettier。

### Biome 配置

```json
// biome.json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": { "noExplicitAny": "error" },
      "complexity": { "noBannedTypes": "error" }
    }
  }
}
```

### ESLint + Prettier 配置（备选）

```javascript
// .eslintrc.cjs
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
  },
};
```

## 类型检查

```bash
# CI 中必须执行，禁止跳过
npx tsc --noEmit

# package.json scripts
# "typecheck": "tsc --noEmit"
# "lint": "biome check ."
# "lint:fix": "biome check --write ."
# "format": "biome format --write ."
```

## Git Hooks（lint-staged）

```json
// .lintstagedrc.json
{
  "*.{ts,tsx}": ["biome check --write", "tsc --noEmit --pretty"],
  "*.{json,md}": ["biome format --write"]
}
```

## pre-commit 配置

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: typecheck
        name: TypeScript 类型检查
        entry: npx tsc --noEmit
        language: system
        types: [typescript]
        pass_filenames: false
      - id: biome
        name: Biome 检查
        entry: npx biome check --write
        language: system
        types: [file]
```
