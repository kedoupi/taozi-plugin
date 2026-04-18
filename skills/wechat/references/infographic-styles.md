# 微信公众号信息图风格库

参考 baoyu-infographic。适用于文章章节配图中含数据/对比/流程/层级的场景。
生成用 YouMind `generateImage`，比例 16:9（900×506）。

---

## Prompt 组装模板

```
Create a professional infographic following these specifications:

## Image Specifications
- Type: Article section infographic
- Layout: {LAYOUT_NAME}
- Style: {STYLE_NAME}
- Aspect Ratio: 16:9 (landscape, 900×506)
- Language: Chinese (Simplified)

## Core Principles
- Follow the layout structure precisely for information architecture
- Apply style aesthetics consistently throughout
- Keep information concise, highlight keywords and core concepts
- Use ample whitespace for visual clarity
- Maintain clear visual hierarchy
- All text in Simplified Chinese

## Layout Guidelines
{LAYOUT_GUIDELINES}

## Style Guidelines
{STYLE_GUIDELINES}

---

Generate the infographic based on the content below:
{CONTENT}
```

---

## 10 种专业信息图风格（Styles）

### corporate-memphis — 彩色平面插画（推荐默认）
```
## Style: Corporate Memphis
Color Palette:
- Background: white (#FFFFFF) or light gray (#F5F5F5)
- Primary shapes: coral (#FF6B6B), teal (#4ECDC4), yellow (#FFE66D), purple (#A8A8D8)
- Lines: black (#000000)

Visual Elements:
- Flat geometric shapes with slight organic edges
- Simplified human figures (abstract, no facial features)
- Bold outlines, limited color fills
- Dynamic diagonal compositions

Typography: Clean bold sans-serif, keywords in colored blocks
Best For: Business analysis, data summaries, concept explanations
```

### craft-handmade — 手绘插画风
```
## Style: Craft / Hand-drawn
Color Palette:
- Background: light cream (#FFF8F0) or warm white
- Primary: warm pastels, craft paper tones
- Accents: bold highlight colors

Visual Elements:
- Hand-drawn or cut-paper quality, organic imperfect shapes
- Simple cartoon elements and icons
- Layered depth with subtle shadows
- Keywords highlighted with hand-drawn underlines

Typography: Casual hand-lettered style, readable labels
Best For: Educational content, friendly explanations, approachable data
```

### bold-graphic — 漫画/高对比风
```
## Style: Bold Graphic / Comic
Color Palette:
- Background: white or black
- Primary: vivid red, electric blue, bright yellow
- Thick black outlines required

Visual Elements:
- Strong silhouettes, halftone dot patterns
- Pop art energy, motion lines
- High contrast, no gradients
- Speech bubbles for callouts

Typography: Heavy condensed bold, ALL CAPS emphasis, outlined text
Best For: Data that needs impact, statistics with wow factor, trend analysis
```

### technical-schematic — 蓝图/工程风
```
## Style: Technical Schematic / Blueprint
Color Palette:
- Background: blueprint blue (#1B3A6B) or dark navy (#0D1B2A)
- Lines: white (#FFFFFF) or light blue (#87CEEB)
- Accents: bright yellow (#FFD700), cyan (#00FFFF)

Visual Elements:
- Blueprint drafting aesthetic, isometric 3D elements
- Precise grid lines, dimension markers
- Technical labels with leader lines
- Measurement annotations

Typography: Monospace or engineering block lettering
Best For: Process flows, system architecture, technical explanations
```

### chalkboard — 黑板粉笔风
```
## Style: Chalkboard
Color Palette:
- Background: blackboard green (#2D4A22) or black (#1A1A1A)
- Primary: chalk white (#F5F5DC), cream (#FFFDD0)
- Accents: pastel chalk colors (pink, blue, yellow)

Visual Elements:
- Rough chalk texture, slightly smudged strokes
- Hand-drawn diagram elements
- Occasional erased marks for depth

Typography: Casual chalk handwriting, varying pressure
Best For: Educational content, step-by-step explanations
```

### aged-academia — 复古学术风
```
## Style: Aged Academia / Vintage Scientific
Color Palette:
- Background: aged paper (#E8DCC8) or parchment (#F4E4C1)
- Primary: sepia brown (#704214), dark ink (#2C1810), rust red (#8B2500)
- Accents: forest green (#2D5A27)

Visual Elements:
- Victorian/Edwardian illustration style
- Engraving-style line art, cross-hatching for depth
- Ornate borders, decorative dividers
- Old scientific diagram aesthetic

Typography: Classic serif, italic annotations, ornate headers
Best For: Historical data, research summaries, authoritative content
```

### origami — 折纸几何风
```
## Style: Origami / Geometric Paper
Color Palette:
- Background: white or very light gray
- Primary: flat geometric colors (no gradients): teal, coral, mustard, navy
- Folded edges: slight shadow for depth

Visual Elements:
- Geometric polygon shapes suggesting folded paper
- Clean angular compositions
- No textures, pure flat geometric forms
- Shadow lines at fold edges for 3D feel

Typography: Clean geometric sans-serif, fits within shape containers
Best For: Structured data, category comparisons, clean modern look
```

### corporate-memphis-dark — 深色商务风（夜间/科技感）
```
## Style: Dark Corporate
Color Palette:
- Background: deep navy (#0D1B2A) or charcoal (#1C1C2E)
- Primary: electric blue (#00CFFF), purple (#BF5AF2), teal (#00D4AA)
- Text: white (#FFFFFF), light gray (#E0E0E0)

Visual Elements:
- Dark background with glowing accent colors
- Gradient fills on key shapes (subtle)
- Clean geometric forms, no hand-drawn elements
- Data visualization elements (bars, circles, lines)

Typography: Modern tech sans-serif, light weight on dark
Best For: Tech articles, AI/data topics, premium content
```

### pop-laboratory — 实验室精度风（新）
```
## Style: Pop Laboratory
Color Palette:
- Background: grid paper (#F0F0FF) or graph paper white
- Primary: cobalt blue (#0047AB), hot pink (#FF2D78), lime (#32CD32)
- Technical: black grid lines, measurement markers

Visual Elements:
- Blueprint grid background
- Scientific precision markers (crosshairs, measurement lines)
- Bold pop-art color fills within technical structures
- Lab diagram meets pop poster

Typography: Bold sans-serif mixed with monospace labels
Best For: Data-heavy tech content, scientific explanations with flair
```

### morandi-journal — 手绘日记风（新）
```
## Style: Morandi Journal
Color Palette:
- Background: off-white #F5F0EB
- Primary: Morandi tones — dusty rose (#C4A29E), sage (#8FAF8F), warm gray (#B8B0A8), slate blue (#8B9EB7)
- Ink: soft brown (#6B4C3B)

Visual Elements:
- Hand-drawn doodles with slight imperfection
- Morandi warm muted palette throughout
- Journal/sketchbook aesthetic
- Stick figures and simple expressive drawings
- Hand-lettered annotations

Typography: Casual handwriting, mix of print and cursive
Best For: Lifestyle articles, personal experience content, soft emotional topics
```

---

## 10 种信息布局（Layouts）

### bento-grid — 模块网格（推荐默认）
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

### linear-progression — 时间线/流程
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

### binary-comparison — 双向对比
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

### hierarchical-layers — 金字塔层级
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

### hub-spoke — 中心辐射
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

### dashboard — 数据仪表板
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

### funnel — 转化漏斗
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

### tree-branching — 树形分类
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

### venn-diagram — 韦恩图（交叉）
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

### structural-breakdown — 结构拆解
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

---

## 章节类型 → 信息图推荐规则

| 章节内容特征 | 推荐 layout | 推荐 style |
|-----------|------------|-----------|
| 含数据/统计数字 | `dashboard` 或 `bento-grid` | `corporate-memphis` 或 `pop-laboratory` |
| 含流程/步骤 | `linear-progression` | `craft-handmade` 或 `chalkboard` |
| 含对比/优劣 | `binary-comparison` | `corporate-memphis` 或 `bold-graphic` |
| 含层级/优先级 | `hierarchical-layers` | `origami` 或 `corporate-memphis` |
| 含分类/体系 | `tree-branching` 或 `hub-spoke` | `corporate-memphis` 或 `aged-academia` |
| 含漏斗/转化 | `funnel` | `bold-graphic` 或 `corporate-memphis-dark` |
| 含交叉/重叠概念 | `venn-diagram` | `minimal` 或 `origami` |
| 含多维概览 | `bento-grid` | `corporate-memphis` |
| 技术/工程内容 | `structural-breakdown` | `technical-schematic` 或 `pop-laboratory` |
| 软性/人文内容 | `hub-spoke` 或 `bento-grid` | `morandi-journal` 或 `craft-handmade` |
