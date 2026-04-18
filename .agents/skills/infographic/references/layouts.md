# 信息图布局库（14 种）

来源：wechat infographic-styles（10 种）+ baoyu-infographic 补充（4 种）。
适用场景：数据可视化、知识科普、分析报告、文章配图。

---

## bento-grid — 模块网格（推荐默认）
```
## Layout: Bento Grid
Information Density: Multiple topics (4-8 cells)

Structure:
- Mixed cell sizes (1×1, 2×1, 1×2) filling canvas
- Hero cell for main point (largest)
- Supporting cells around it with varied sizes
- Clear cell boundaries, consistent padding
- Visual hierarchy through cell size

Best For: Multiple-topic overview, feature highlights, dashboard summaries
```

## linear-progression — 时间线/流程
```
## Layout: Linear Progression
Information Density: Sequential (3-6 steps)

Structure:
- Horizontal or diagonal flow, left to right
- Nodes connected by arrows or path line
- Each node: number + icon + label + brief description
- Milestones visually distinct (size or color)
- Start and end clearly marked

Best For: Process flows, timelines, step-by-step guides
```

## binary-comparison — 双向对比
```
## Layout: Binary Comparison
Information Density: Two sides × 3-5 points each

Structure:
- Strong center divider (vertical line or VS graphic)
- Left: Option A — label + color + 3-5 points
- Right: Option B — label + contrasting color + 3-5 points
- Summary verdict or neutral at bottom
- Color-code each side distinctly

Best For: A vs B comparisons, before/after, pros/cons
```

## hierarchical-layers — 金字塔层级
```
## Layout: Hierarchical Layers
Information Density: 3-5 layers

Structure:
- Top-to-bottom pyramid or inverted pyramid
- Each layer: distinct color band + label + brief description
- Width encodes importance/volume
- Layer boundaries clearly delineated
- Base or apex labeled as key takeaway

Best For: Priority frameworks, organizational hierarchies, importance ranking
```

## hub-spoke — 中心辐射
```
## Layout: Hub & Spoke
Information Density: 1 center + 4-8 spokes

Structure:
- Central concept in prominent shape (circle or hexagon)
- 4-8 connected sub-topics radiating outward
- Each spoke: icon + label + 1-2 detail lines
- Color-code each spoke differently
- Connecting lines show relationship type

Best For: Concept relationships, factor analysis, category overview
```

## dashboard — 数据仪表板
```
## Layout: Dashboard
Information Density: High (6-12 metrics)

Structure:
- Grid of metric cards (KPI boxes)
- Each card: metric name + large number/stat + trend indicator
- Progress bars or sparklines where applicable
- Color coding for status (green/yellow/red)
- Summary row at top or bottom

Best For: Statistical summaries, KPI reports, data-heavy sections
```

## funnel — 转化漏斗
```
## Layout: Funnel
Information Density: 4-7 stages

Structure:
- Top-to-bottom narrowing funnel shape
- Each stage: width proportional to volume + label + metric
- Color gradient from top to bottom
- Stage labels inside or beside funnel sections
- Final outcome at narrow bottom, highlighted

Best For: Conversion processes, filtering steps, narrowing analysis
```

## tree-branching — 树形分类
```
## Layout: Tree / Branching
Information Density: Root + 2-4 branches + leaves

Structure:
- Root node at top or left
- 2-4 main branches each with 2-4 leaf nodes
- Clear parent-child lines
- Icons per category cluster
- Color families per main branch

Best For: Taxonomy, classification systems, organizational breakdowns
```

## venn-diagram — 韦恩图（交叉）
```
## Layout: Venn Diagram
Information Density: 2-3 overlapping sets

Structure:
- 2 or 3 overlapping circles/shapes
- Each zone labeled: unique to A, unique to B, shared A∩B
- Items listed within each zone
- Overlap zone visually distinct (blend of colors)
- Title explains what the diagram compares

Best For: Intersecting concepts, shared attributes, overlap analysis
```

## structural-breakdown — 结构拆解
```
## Layout: Structural Breakdown
Information Density: 1 whole → 4-8 parts

Structure:
- Main subject/object shown whole at top/left
- Exploded or deconstructed view showing components
- Each component: leader line + label + brief description
- Parts arranged to suggest spatial or logical relationship
- Annotations in margins or callout boxes

Best For: Component analysis, anatomy of a concept, feature breakdown
```

## iceberg — 冰山模型（baoyu 补充）
```
## Layout: Iceberg
Information Density: 2-tier visible/hidden (3-8 items total)

Structure:
- Horizontal waterline dividing canvas into above/below sections
- Above waterline (30%): visible/obvious facts (1-2 items)
- Below waterline (70%): hidden depth, root causes, underlying factors (3-6 items)
- Items below get progressively deeper/more detailed
- Iceberg silhouette as background shape

Best For: Root cause analysis, hidden vs obvious factors, depth-of-knowledge concepts
```

## bridge — 桥接模型（baoyu 补充）
```
## Layout: Bridge
Information Density: Problem → Solution (3-7 bridge steps)

Structure:
- Left anchor: current state / problem (labeled)
- Right anchor: desired state / solution (labeled)
- Bridge arch spanning the gap with 3-7 steps/elements
- Each bridge segment: label + brief description
- Gap below bridge: optional "without this" risk label

Best For: Transformation narratives, gap analysis, how-we-get-there explanations
```

## winding-roadmap — 蜿蜒路线图（baoyu 补充）
```
## Layout: Winding Roadmap
Information Density: Journey (5-9 milestones)

Structure:
- Winding path/road from bottom-left to top-right
- 5-9 milestone markers along the path
- Each milestone: icon + label + brief note
- Start clearly marked at bottom, destination at top
- Optional terrain or context illustrations beside path

Best For: Learning journeys, career paths, long-term strategies, progress narratives
```

## circular-flow — 循环流（baoyu 补充）
```
## Layout: Circular Flow
Information Density: Cycle (4-8 stages)

Structure:
- Circular or oval arrangement of 4-8 stages
- Directional arrows between stages (clockwise preferred)
- Each stage: icon + label + brief description
- Center of circle: optional summary label or title
- Color progression around the cycle

Best For: Recurring cycles, feedback loops, iterative processes, ecosystem diagrams
```

---

## 内容类型 → 布局推荐

| 章节/内容特征 | 推荐 layout | 次选 layout |
|-----------|------------|------------|
| 含数据/统计数字 | `dashboard` 或 `bento-grid` | `binary-comparison` |
| 含流程/步骤 | `linear-progression` | `winding-roadmap` |
| 含对比/优劣（二元，A vs B）| `binary-comparison` | `venn-diagram` |
| 含多方对比（3+ 方，如多产品横评）| `dashboard` 或 `bento-grid` | `binary-comparison` |
| 含层级/优先级 | `hierarchical-layers` | `funnel` |
| 含分类/体系 | `tree-branching` 或 `hub-spoke` | `structural-breakdown` |
| 含漏斗/转化 | `funnel` | `linear-progression` |
| 含交叉/重叠概念 | `venn-diagram` | `bento-grid` |
| 含多维概览 | `bento-grid` | `hub-spoke` |
| 技术/工程内容 | `structural-breakdown` | `dashboard` |
| 软性/人文内容 | `hub-spoke` 或 `bento-grid` | `winding-roadmap` |
| 隐性因素/深层原因 | `iceberg` | `hierarchical-layers` |
| 问题→解决方案 | `bridge` | `linear-progression` |
| 循环/迭代流程 | `circular-flow` | `hub-spoke` |
| 旅程/里程碑 | `winding-roadmap` | `linear-progression` |
