# Catalan Number Bijection Explorer

## What This Is

An interactive web-based simulation tool for a Math 380 (Computational Geometry) course presentation. It visually demonstrates 11 combinatorial structures counted by Catalan numbers and allows the presenter to animate step-by-step bijections between any two structures. Built as a zero-dependency vanilla HTML/Canvas app that runs by opening `index.html` in any browser.

## Core Value

The presenter can pick any two Catalan structures and walk the class through an animated, step-by-step visual transformation showing exactly how the bijection maps elements between them.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 11 Catalan structures visually rendered (Balanced Parentheses, Dyck Paths, Mountain Ranges, Lattice Paths Below Diagonal, Staircase Polygons, Binary Trees, Rooted Plane Trees, Ballot Sequences, Non-crossing Partitions, Triangulations, Stack-sortable Permutations)
- [ ] Support n = 1 to 4 (up to C(4) = 14 instances per structure)
- [ ] Pick any two structures and see an animated bijection transformation
- [ ] 8 hand-crafted classical bijections with custom step-by-step animations
- [ ] Dyck word bridge for non-classical pairs (automatic pathfinding)
- [ ] Playback controls: play/pause, step forward/back, jump to start/end, speed slider
- [ ] Color-coded element correspondence between structures
- [ ] Instance navigator to cycle through all C(n) instances for a given n
- [ ] Step description text explaining each transformation step
- [ ] Bijection chain indicator showing intermediate structures when composing
- [ ] Clean, minimal visual style (white background, clear lines, projector-friendly)

### Out of Scope

- Mobile-optimized layout — presentation is on a laptop/projector
- Backend/server — purely client-side, no data persistence needed
- User accounts or saved state — ephemeral presentation tool
- n > 4 — too many instances (C(5)=42) for visual clarity
- Proof/formal verification of bijections — this is a visual teaching aid

## Context

- **Course:** Math 380 — Computational Geometry
- **Purpose:** Class presentation on Catalan numbers, focusing on the immense number of bijections
- **Audience:** Math students who understand combinatorics but benefit from visual demonstrations
- **Delivery:** Web app opened in browser, alt-tabbed to during Google Slides presentation
- **Tech stack:** Vanilla HTML/CSS/JavaScript with HTML5 Canvas — zero dependencies, no build step

### 11 Catalan Structures

1. Balanced Parentheses
2. Dyck Paths
3. Mountain Ranges
4. Lattice Paths Below Diagonal
5. Staircase Polygons
6. Binary Trees
7. Rooted Plane Trees
8. Ballot Sequences
9. Non-crossing Partitions
10. Triangulations of Convex (n+2)-gon
11. Stack-sortable Permutations

### 8 Classical Bijections (hand-crafted animations)

1. Parentheses ↔ Dyck Paths — '(' = up step, ')' = down step
2. Binary Trees ↔ Triangulations — triangles correspond to internal nodes
3. Parentheses ↔ Binary Trees — recursive nesting defines subtree structure
4. Dyck Paths ↔ Lattice Paths — 45° geometric rotation
5. Binary Trees ↔ Rooted Plane Trees — rotation correspondence (left-child/right-sibling)
6. Dyck Paths ↔ Mountain Ranges — visual reinterpretation of the same curve
7. Non-crossing Partitions ↔ Triangulations — partition blocks correspond to triangle fans
8. Ballot Sequences ↔ Dyck Paths — "A always ahead" = path never below axis

### Architecture

- Internal representation: all structures stored as Dyck words (sequences of +1/-1)
- Each structure module: `toDyck()`, `fromDyck()`, `draw()` interface
- Bijection modules: `getSteps()` returns animation step sequence
- Bridge module: composes through Dyck words for non-classical pairs
- Animation engine: interpolation, playback controls, timing

## Constraints

- **Tech stack:** Vanilla HTML/CSS/JS + Canvas — no frameworks, no build step, no npm
- **Portability:** Must work by opening index.html in any modern browser
- **Visual clarity:** Clean minimal style optimized for projector display
- **Size:** n ≤ 4 to keep visualizations readable

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vanilla HTML/Canvas over React/D3 | Zero dependencies, runs anywhere, no build step risk during presentation | — Pending |
| Dyck words as universal internal representation | Enables any-to-any bijection through composition, only 11 converters needed instead of 55 | — Pending |
| 8 classical + bridge approach | Hand-crafted animations for famous bijections, Dyck bridge for remaining pairs | — Pending |
| n ≤ 4 limit | C(4)=14 instances is visually manageable, C(5)=42 would be too crowded | — Pending |

---
*Last updated: 2026-02-23 after initialization*
