# Swift 自动化钩子

> 本文件扩展 [common/coding-style.md](../coding-style.md)

## swift-format

```bash
# Apple 官方格式化工具
swift-format format -i -r Sources/
swift-format lint -r Sources/
```

```json
// .swift-format.json
{
  "version": 1,
  "indentation": { "spaces": 4 },
  "lineLength": 120,
  "rules": {
    "indentSwitchCase": true,
    "spaceInsideBrackets": false
  }
}
```

## SwiftLint

```yaml
# .swiftlint.yml
included: [Sources, Tests]
excluded: [.build, DerivedData]

opt_in_rules:
  - force_unwrapping
  - empty_count
  - closure_spacing
  - overridden_super_call

type_body_length:
  warning: 300
  error: 500

function_body_length:
  warning: 40
  error: 80
```

```bash
swiftlint lint --strict
swiftlint --fix
```

## xcodebuild 测试

```bash
# 运行测试 + 覆盖率
xcodebuild test \
  -scheme MyScheme \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  -enableCodeCoverage YES
```

## pre-commit 配置

```yaml
repos:
  - repo: local
    hooks:
      - id: swift-format
        name: Swift Format
        entry: swift-format format -i
        language: system
        types: [swift]
      - id: swiftlint
        name: SwiftLint
        entry: swiftlint lint --fix
        language: system
        types: [swift]
```

## CI 流水线

```bash
set -euo pipefail
swift-format lint -r Sources/
swiftlint lint --strict
xcodebuild build -scheme MyScheme \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  CODE_SIGNING_ALLOWED=NO
xcodebuild test -scheme MyScheme \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  -enableCodeCoverage YES
```
