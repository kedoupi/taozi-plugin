---
name: ultra-think
description: 深度分析与多维度问题求解 — 技术决策、架构权衡、复杂问题
argument-hint: [problem or question to analyze]
---

# Ultra Think

深度分析、系统推理、从多个视角探索问题空间。适合高风险、高影响、多方案权衡的决策。

## 何时使用

- 架构决策（单体 vs 微服务、技术选型）
- 复杂问题（规模扩展、重大重构、跨系统集成）
- 战略规划（平台演进、长期路线图）
- 深层设计挑战（API 演进、兼容性平衡）

## 核心思维原则

- **First Principles**：拆解到基础事实
- **Systems Thinking**：考虑相互关联与反馈循环
- **Probabilistic**：用概率和区间思考，不追求确定
- **Inversion**：思考"该避免什么"，而不只是"该做什么"
- **Second-Order**：考虑后果的后果

## 分析流程

### 1. 问题解析

从 `$ARGUMENTS` 中提取：
- 核心挑战
- 所有利益相关者与约束
- 隐含需求与隐藏复杂度
- 质疑假设，暴露未知

### 2. 多维度分析

#### Technical Perspective
- 技术可行性与约束
- 可扩展性、性能、可维护性
- 安全影响
- 技术债与未来可演进性

#### Business Perspective
- 业务价值与 ROI
- 上市时间压力
- 竞争优势
- 风险回报权衡

#### User Perspective
- 用户需求与痛点
- 可用性与可访问性
- 用户体验影响
- 边界情况与用户旅程

#### System Perspective
- 系统级影响
- 集成点
- 依赖与耦合
- 涌现行为

### 3. 生成多方案

- 至少 3-5 种不同方法
- 每个方案考虑：优劣 / 实现复杂度 / 资源需求 / 风险 / 长期影响
- 包含常规与创新方案
- 考虑混合方案

### 4. Deep Dive

对最有潜力的方案：
- 详细实现计划
- 陷阱与缓解
- 阶段化 / MVP 路径
- 二阶、三阶效应
- 失败模式与恢复

### 5. Cross-Domain

- 借鉴其他行业或领域
- 应用不同场景的设计模式
- 生物或自然系统类比
- 创新组合

### 6. Challenge & Refine

- 扮演 devil's advocate
- 识别弱点和盲点
- "what if" 场景
- 压力测试假设
- 查找意外后果

### 7. Synthesize

- 综合各视角洞察
- 关键决策因素
- 关键权衡
- 创新发现
- 问题空间的细致视图

### 8. 结构化建议

```markdown
## Problem Analysis
- Core challenge / Key constraints / Critical success factors

## Solution Options

### Option 1: [Name]
- Description
- Pros/Cons
- Implementation approach
- Risk assessment

### Option 2: [Name]
...

## Recommendation
- Recommended approach
- Rationale
- Implementation roadmap
- Success metrics
- Risk mitigation plan

## Alternative Perspectives
- Contrarian view
- Future considerations
- Areas for further research
```

### 9. Meta-Analysis

- 反思思考过程本身
- 识别不确定区域
- 承认偏见或局限
- 建议补充专业知识
- 给出建议的置信度

## 输出期望

- 综合分析（通常 2-4 页洞察）
- 多个可行方案含权衡
- 清晰推理链
- 承认不确定性
- 可操作建议
- 新颖洞察或视角
