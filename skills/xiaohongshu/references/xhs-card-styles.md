# 小红书图文卡片风格库

参考 baoyu-xhs-images。图片生成用 YouMind `generateImage`，prompt 按本文档组装后传入，固定比例 3:4（1080×1440）。

---

## Prompt 组装模板

```
Create a Xiaohongshu (Little Red Book) style infographic following these guidelines:

## Image Specifications
- Type: Infographic card
- Orientation: Portrait (vertical)
- Aspect Ratio: 3:4

## Core Principles
- Hand-drawn quality throughout — NO realistic or photographic elements
- Keep information concise, highlight keywords and core concepts
- Use ample whitespace for easy visual scanning
- Maintain clear visual hierarchy
- ALL text MUST be hand-drawn style, NOT computer-generated fonts
- Use the same language as the content provided (Chinese: ""，。！)

---

{STYLE_SECTION}

---

{LAYOUT_SECTION}

---

{CONTENT_SECTION}

---

Please use nano banana pro to generate the infographic based on the specifications above.
```

将 `{STYLE_SECTION}`、`{LAYOUT_SECTION}`、`{CONTENT_SECTION}` 替换为下方对应内容。

---

## 12 种视觉风格（Styles）

### cute — 甜美可爱少女风
```
## Style: Cute / Kawaii
**Color Palette**:
- Background: soft white or baby pink (#FFF0F5)
- Primary: pastel pink (#F4A7B9), lavender (#C9B8E8), mint (#A8D8C8)
- Accents: warm yellow (#FFE599), peach (#FFCBA4)

**Visual Elements**:
- Rounded bubbly shapes, soft watercolor washes
- Kawaii doodle icons (tiny stars, hearts, bows, clouds)
- Slightly wobbly hand-drawn borders
- Blush cheeks on character elements if present

**Typography**: Rounded bubbly lettering, keywords in pastel speech bubbles
```
*最适合*：种草分享、美妆护肤、生活方式、情感类

---

### fresh — 清新自然风
```
## Style: Fresh / Natural
**Color Palette**:
- Background: clean white (#FFFFFF) or light cream (#F9F7F4)
- Primary: sage green (#A8C5A0), sky blue (#87CEEB), warm cream (#F5E6C8)
- Accents: dusty rose (#E8A89C), soft coral (#F4A261)

**Visual Elements**:
- Light botanical illustrations (leaves, branches, simple florals)
- Clean minimal linework, generous white space
- Watercolor-style washes for backgrounds
- Nature-inspired dividers and borders

**Typography**: Clean hand-lettering, slightly serif for headlines
```
*最适合*：健康生活、美食、旅行、环保

---

### warm — 温暖亲切风
```
## Style: Warm / Cozy
**Color Palette**:
- Background: warm cream (#FFF3E0) or light terracotta (#FAE8DC)
- Primary: amber (#F5A623), terracotta (#D4795A), dusty rose (#E8A89C)
- Accents: sage green (#B5C4B1), butter yellow (#FFE082)

**Visual Elements**:
- Cozy textured backgrounds (linen, kraft paper feel)
- Hand-lettering with slight imperfections
- Warm-toned watercolor accents
- Homey icons (candles, cups, books, cozy objects)

**Typography**: Casual hand-lettering, mix of print and cursive
```
*最适合*：家居、亲子、情感、美食

---

### bold — 高冲击力风
```
## Style: Bold / High Impact
**Color Palette**:
- Background: stark white (#FFFFFF) or deep black (#1A1A1A)
- Primary: vivid red (#FF3B30), electric blue (#007AFF), bright yellow (#FFD60A)
- Accents: neon orange (#FF6B35), hot magenta (#FF2D78)

**Visual Elements**:
- Thick black outlines, strong silhouettes
- Pop art energy, halftone dot patterns
- Dynamic diagonal layouts and motion lines
- Bold graphic shapes, no subtle gradients

**Typography**: Heavy condensed bold fonts, ALL CAPS emphasis, outlined text
```
*最适合*：热点资讯、观点输出、避坑指南、涨粉内容

---

### minimal — 极简精致风
```
## Style: Minimal / Refined
**Color Palette**:
- Background: pure white (#FFFFFF) or off-white (#F8F8F6)
- Primary: deep charcoal (#2C2C2C), warm black (#1A1A1A)
- Accents: single accent only — choose one: sage (#8FAF8F), dusty pink (#D4A5A5), or navy (#2C3E50)

**Visual Elements**:
- Maximum white space (60%+ of canvas)
- Ultra-thin linework, hairline borders
- Single focal illustration, no clutter
- Grid-aligned layout, precise spacing

**Typography**: Clean sans-serif, varied weight hierarchy, no decorative fonts
```
*最适合*：高端品牌、知识干货、产品测评

---

### retro — 复古怀旧风
```
## Style: Retro / Vintage
**Color Palette**:
- Background: aged paper (#E8DCC8) or faded yellow (#F0E68C)
- Primary: muted mustard (#C9A84C), rust red (#8B2500), navy (#1B3A5C)
- Accents: cream (#FFF8DC), forest green (#2D5A27)

**Visual Elements**:
- Grainy film texture overlay
- Vintage badge and stamp elements
- Muted, slightly desaturated colors
- Retro poster typography, Art Deco borders

**Typography**: Vintage serif or condensed display fonts, letterpress feel
```
*最适合*：历史文化、复古美学、品牌故事

---

### pop — 活力流行风
```
## Style: Pop / Y2K
**Color Palette**:
- Background: gradient (hot pink #FF2D78 → purple #BF5AF2) or holographic silver
- Primary: bright pink (#FF69B4), electric blue (#00CFFF), lime (#39FF14)
- Accents: chrome silver, iridescent accents

**Visual Elements**:
- Y2K / early 2000s aesthetic, bubbly 3D elements
- Chrome text effects, holographic stickers
- Glossy buttons, dynamic burst shapes
- Emoji-style illustrations

**Typography**: Bold rounded 3D letters, gradient fills on text
```
*最适合*：潮流资讯、娱乐、青年文化

---

### notion — 极简手绘知识风
```
## Style: Notion / Knowledge Card
**Color Palette**:
- Background: pure white (#FFFFFF) or light gray (#F5F5F5)
- Primary: black (#000000), dark gray (#333333)
- Accents: yellow highlight (#FFF176), single color (blue #4A90D9 or green #52B788)

**Visual Elements**:
- Minimal black line art, knowledge-notebook aesthetic
- Simple checkbox, bullet, and tab elements
- Yellow highlighter strokes on key terms
- Clean grid or ruled-line background (optional, faint)
- Diagram blocks with thin borders

**Typography**: Monospace or clean sans-serif, handwritten annotations in smaller size
```
*最适合*：干货教程、知识整理、读书笔记、方法论

---

### chalkboard — 黑板粉笔风
```
## Style: Chalkboard
**Color Palette**:
- Background: deep blackboard green (#2D4A22) or classic black (#1A1A1A)
- Primary: chalk white (#F5F5DC), cream white (#FFFDD0)
- Accents: dusty pink chalk (#E8A8B0), pastel blue (#A8D8EA), warm yellow (#FFE082)

**Visual Elements**:
- Rough chalk texture throughout
- Slightly smudged, imperfect chalk strokes
- Hand-drawn diagram elements (arrows, boxes, underlines)
- Occasional erased/ghosted marks for depth

**Typography**: Casual chalk handwriting, varying pressure strokes
```
*最适合*：教育内容、学习笔记、科普解释

---

### study-notes — 手写笔记风
```
## Style: Study Notes / Handwritten
**Color Palette**:
- Background: lined notebook paper texture (#FAFAF0) or graph paper (#F0F0FF)
- Primary: ballpoint blue (#4169E1), black ink (#1A1A2E)
- Accents: red annotation (#CC0000), yellow highlighter (#FFFF00 at 50% opacity), green (#228B22)

**Visual Elements**:
- Realistic notebook paper with faint blue lines or grid
- Blue ballpoint pen primary writing
- Red pen for corrections, circles, and important notes
- Yellow highlighter strokes on key terms
- Post-it note elements, sticky tape accents
- Doodles in margins (arrows, stars, faces)

**Typography**: Casual handwritten style (print and cursive mix), annotations in smaller red script
```
*最适合*：学习干货、考试技巧、备考内容

---

### screen-print — 丝网印刷海报风
```
## Style: Screen Print / Silkscreen Poster
**Color Palette**:
- Maximum 4 flat colors — NO gradients
- Choose one duotone pair: [black + orange] or [navy + cream] or [red + yellow]
- Background: one solid flat color
- Halftone dots for tonal variation only

**Visual Elements**:
- Bold flat color blocks, stark silhouettes
- Halftone dot patterns (NOT gradients)
- Slight color layer misregistration (authentic print feel)
- Paper grain texture beneath all colors
- Stencil-cut edges, no outlines between colors

**Typography**: Bold condensed Art Deco lettering, stencil-cut quality, typography as design element
```
*最适合*：艺术感内容、观点海报、活动宣传

---

### sketch-notes — 手绘信息图风
```
## Style: Sketch Notes / Visual Notes
**Color Palette**:
- Background: warm white (#FEFEFE)
- Primary: pencil gray (#555555), dark brown (#3D2B1F)
- Accents: macaron palette — pink (#F4A7B9), mint (#A8D8C8), lavender (#C9B8E8), yellow (#FFE599)

**Visual Elements**:
- Pencil sketch quality, slight paper texture
- Hand-drawn icons (simple, iconic, 2-3 stroke style)
- Macaron color fills inside sketch outlines
- Organic bubble text labels
- Quick gesture sketches for illustrations

**Typography**: Hand-lettered print, sketch-style arrows and connectors
```
*最适合*：思维导图、流程梳理、创意内容

---

## 8 种信息布局（Layouts）

### sparse — 金句/封面（1-2 个核心点）
```
## Layout: Sparse
**Information Density**: Minimal (1-2 key points)
**Whitespace**: 70%+

**Structure**:
- One dominant visual element (illustration or icon, occupies 50-60% of canvas)
- Title: large, centered or top-aligned
- 1-2 supporting text lines maximum
- Call-to-action or swipe hint at bottom

**Best For**: Cover slide, opening hook, single powerful quote, emotional resonance
```

### balanced — 常规内容（3-4 个要点）
```
## Layout: Balanced
**Information Density**: Moderate (3-4 key points)
**Whitespace**: 40-50%

**Structure**:
- Title at top (15% of height)
- 3-4 content blocks arranged in even grid or alternating text/visual
- Each block: icon + short label + 1-line description
- Footer with summary or CTA

**Best For**: Standard content cards, tips, key takeaways
```

### dense — 知识卡片（5-8 个要点）
```
## Layout: Dense
**Information Density**: High (5-8 key points)
**Whitespace**: 20-30%

**Structure**:
- Compact header (title only)
- 2-column or 3-column grid of content items
- Each item: small icon + short label + brief description (2 lines max)
- Consistent row height, tight but readable spacing
- Optional dividing lines between rows

**Best For**: Cheat sheets, comprehensive tips, reference cards
```

### list — 清单/排行（4-7 项）
```
## Layout: List
**Information Density**: Moderate (4-7 items)
**Whitespace**: 35%

**Structure**:
- Prominent title with visual accent
- Numbered or bulleted vertical list
- Each item: number/icon + bold key term + brief description
- Consistent item height, alternating subtle background (optional)
- Completion/summary box at bottom

**Best For**: Step-by-step guides, rankings, checklists, recommendations
```

### comparison — 对比（左右两列）
```
## Layout: Comparison
**Information Density**: Moderate (2 columns × 3-5 rows)
**Whitespace**: 30%

**Structure**:
- Title at top
- Bold center divider (vertical line or vs. graphic)
- Left column: Option A with label + 3-5 points
- Right column: Option B with label + 3-5 points
- Color coding: one color per side
- Summary winner or neutral conclusion at bottom

**Best For**: Before/after, pros/cons, A vs B, product comparisons
```

### flow — 流程/时间线（3-6 步）
```
## Layout: Flow
**Information Density**: Moderate (3-6 steps)
**Whitespace**: 35%

**Structure**:
- Title at top
- Vertical or diagonal step progression
- Each step: numbered circle/icon → description block
- Directional arrows connecting steps
- Step icons visually distinct per stage
- Final step highlighted as goal/result

**Best For**: How-to guides, process explanations, timelines, journeys
```

### mindmap — 思维导图
```
## Layout: Mindmap
**Information Density**: Moderate-High (1 center + 4-8 branches)
**Whitespace**: 25-35%

**Structure**:
- Central topic in prominent circle/shape (center of canvas)
- 4-8 branch nodes radiating outward
- Each branch: connecting line + icon + label + 1-2 sub-points
- Color-code each branch differently
- Organic, slightly asymmetric arrangement (not rigid)

**Best For**: Concept maps, topic overviews, relationship mapping, brainstorming output
```

### quadrant — 四象限矩阵
```
## Layout: Quadrant
**Information Density**: Moderate (4 cells × 2-3 points each)
**Whitespace**: 30%

**Structure**:
- Title at top
- 2×2 grid with clear axis labels (X axis: low→high, Y axis: low→high)
- Each quadrant: distinct background color + quadrant label + 2-3 bullet items
- Axis intersection clearly marked
- Legend or axis title on sides

**Best For**: Priority matrices, 2-variable analysis, strategic categorization
```

---

## 3 种配色方案（Palettes，可覆盖风格原色）

### macaron
```
Background: cream #FFF8F0
Text: dark brown #3D2B1F
Zone 1: pink #F4A7B9
Zone 2: lavender #C9B8E8
Zone 3: mint #A8D8C8
Zone 4: butter #FFE599
Accent: peach #FFCBA4
Constraint: keep all colors at ≤70% saturation, no harsh contrasts
```

### warm
```
Background: warm cream #FFF3E0
Text: deep brown #4A2C2A
Zone 1: amber #F5A623
Zone 2: terracotta #D4795A
Zone 3: dusty rose #E8A89C
Zone 4: sage #B5C4B1
Accent: butter yellow #FFE082
Constraint: all colors must feel warm-toned, avoid cool blues/greens
```

### neon
```
Background: near-black #0A0A0A
Text: white #FFFFFF
Zone 1: hot pink #FF2D78
Zone 2: electric blue #00CFFF
Zone 3: neon green #39FF14
Zone 4: purple #BF5AF2
Accent: orange #FF6B35
Constraint: dark background required, max 3 neon colors per card to avoid clash
```

---

## 智能推荐规则

| 内容类型 | 推荐 style | 推荐 layout |
|---------|-----------|------------|
| 种草分享 / 开箱 | `cute` 或 `warm` | `balanced` 或 `comparison` |
| 干货教程 / 方法论 | `notion` 或 `sketch-notes` | `list` 或 `flow` |
| 产品测评 / 对比 | `minimal` 或 `bold` | `comparison` 或 `dense` |
| 学习笔记 / 备考 | `study-notes` | `dense` 或 `list` |
| 励志金句 / 情感 | `cute` 或 `warm` | `sparse` |
| 热点资讯 / 观点 | `bold` 或 `screen-print` | `balanced` 或 `sparse` |
| 思维梳理 / 复盘 | `sketch-notes` | `mindmap` 或 `flow` |
| 四象限 / 矩阵分析 | `minimal` 或 `notion` | `quadrant` |
| 美食 / 生活方式 | `fresh` 或 `warm` | `balanced` |
| 潮流 / 娱乐 | `pop` 或 `bold` | `balanced` |
