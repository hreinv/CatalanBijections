# Requirements: Catalan Number Bijection Explorer

**Defined:** 2026-02-23
**Core Value:** Presenter can pick any two Catalan structures and walk the class through an animated, step-by-step visual transformation showing exactly how the bijection maps elements between them.

## v1 Requirements

Requirements for the presentation-ready release. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: App loads from index.html with zero dependencies (no npm, no build step)
- [x] **FOUND-02**: Dyck word enumeration correctly generates all C(n) instances for n=1 to 4
- [x] **FOUND-03**: HiDPI canvas rendering with devicePixelRatio scaling for sharp projector display
- [x] **FOUND-04**: Clean minimal visual theme (white background, high-contrast colors, thick strokes)

### Structure Rendering

- [x] **STRC-01**: Balanced parentheses rendered as formatted character sequences
- [x] **STRC-02**: Dyck paths rendered as lattice paths with up/down steps on a grid
- [x] **STRC-03**: Mountain ranges rendered as mountain-profile curves
- [x] **STRC-04**: Lattice paths below diagonal rendered on an n x n grid
- [x] **STRC-05**: Staircase polygons rendered as staircase-bounded shapes
- [x] **STRC-06**: Binary trees rendered with recursive node-edge layout
- [x] **STRC-07**: Rooted plane trees rendered with ordered children layout
- [x] **STRC-08**: Ballot sequences rendered as labeled vote sequences
- [x] **STRC-09**: Non-crossing partitions rendered on a circle with arcs
- [x] **STRC-10**: Triangulations rendered as convex polygons with diagonals
- [x] **STRC-11**: Stack-sortable permutations rendered with stack visualization
- [x] **STRC-12**: Each structure correctly converts to/from Dyck word representation (round-trip identity verified for all C(4)=14 instances)

### Classical Bijections

- [x] **BIJC-01**: Parentheses to Dyck Paths bijection with step-by-step animation ('(' = up, ')' = down)
- [x] **BIJC-02**: Binary Trees to Triangulations bijection with step-by-step animation (triangles correspond to internal nodes)
- [x] **BIJC-03**: Parentheses to Binary Trees bijection with step-by-step animation (recursive nesting defines subtrees)
- [x] **BIJC-04**: Dyck Paths to Lattice Paths bijection with step-by-step animation (45 degree geometric rotation)
- [x] **BIJC-05**: Binary Trees to Rooted Plane Trees bijection with step-by-step animation (left-child/right-sibling rotation)
- [x] **BIJC-06**: Dyck Paths to Mountain Ranges bijection with step-by-step animation (visual reinterpretation)
- [x] **BIJC-07**: Non-crossing Partitions to Triangulations bijection with step-by-step animation (partition blocks to triangle fans)
- [x] **BIJC-08**: Ballot Sequences to Dyck Paths bijection with step-by-step animation (A-ahead = path above axis)

### Bridge System

- [x] **BRDG-01**: Dyck word bridge composes bijections for non-classical structure pairs
- [x] **BRDG-02**: Pathfinding selects shortest route through bijection graph for any two structures
- [x] **BRDG-03**: Bijection chain indicator shows intermediate structures when composing through bridge

### Animation Engine

- [x] **ANIM-01**: Timestamp-based animation loop using requestAnimationFrame
- [x] **ANIM-02**: Play/pause toggle for bijection animations
- [x] **ANIM-03**: Step forward and step backward controls for manual progression
- [x] **ANIM-04**: Jump to start and jump to end controls
- [x] **ANIM-05**: Speed slider adjustable from 0.5x to 3x
- [x] **ANIM-06**: Smooth easing transitions between animation steps

### UI Controls

- [x] **UICT-01**: Structure A and Structure B dropdown selectors for choosing any two structures
- [x] **UICT-02**: n selector (1-4) to set the Catalan number index
- [x] **UICT-03**: Instance navigator with previous/next buttons and "X of Y" indicator
- [x] **UICT-04**: Step description text panel showing current bijection step explanation
- [x] **UICT-05**: Side-by-side dual-panel layout with source structure left, target structure right
- [x] **UICT-06**: Color-coded element correspondence (matching elements share colors across both panels)
- [x] **UICT-07**: Active transformation step highlighting (current step pulses/glows, others dim)
- [x] **UICT-08**: Keyboard shortcuts (spacebar play/pause, arrow keys step, number keys speed)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Visualization

- **ENHV-01**: All-instances gallery view showing all C(n) instances in a grid
- **ENHV-02**: URL hash state for bookmarking specific demos
- **ENHV-03**: Presenter notes / cheat sheet panel with bijection definitions

## Out of Scope

| Feature | Reason |
|---------|--------|
| User-editable structures | Massive input validation complexity, not needed for a presentation demo |
| n > 4 support | C(5)=42 instances too dense for projector display, kills pacing |
| Mobile/touch support | Presentation runs on one laptop connected to projector |
| 3D visualizations | All 11 structures have clean 2D representations, WebGL adds dependency |
| LaTeX rendering | Breaks zero-dependency constraint, formal notation lives in Google Slides |
| Sound effects | Distracting in classroom, browser autoplay policies unreliable |
| Tutorial/onboarding | Only user is the presenter who built it |
| Save/load state | One-shot presentation tool, no persistence needed |
| Quiz/assessment mode | This is a demonstration, not an interactive exercise |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| STRC-01 | Phase 2 | Complete |
| STRC-02 | Phase 2 | Complete |
| STRC-03 | Phase 4 | Complete |
| STRC-04 | Phase 4 | Complete |
| STRC-05 | Phase 4 | Complete |
| STRC-06 | Phase 2 | Complete |
| STRC-07 | Phase 4 | Complete |
| STRC-08 | Phase 4 | Complete |
| STRC-09 | Phase 4 | Complete |
| STRC-10 | Phase 2 | Complete |
| STRC-11 | Phase 4 | Complete |
| STRC-12 | Phase 2 | Complete |
| BIJC-01 | Phase 3 | Complete |
| BIJC-02 | Phase 3 | Complete |
| BIJC-03 | Phase 3 | Complete |
| BIJC-04 | Phase 5 | Complete |
| BIJC-05 | Phase 5 | Complete |
| BIJC-06 | Phase 5 | Complete |
| BIJC-07 | Phase 5 | Complete |
| BIJC-08 | Phase 5 | Complete |
| BRDG-01 | Phase 6 | Complete |
| BRDG-02 | Phase 6 | Complete |
| BRDG-03 | Phase 6 | Complete |
| ANIM-01 | Phase 2 | Complete |
| ANIM-02 | Phase 2 | Complete |
| ANIM-03 | Phase 2 | Complete |
| ANIM-04 | Phase 2 | Complete |
| ANIM-05 | Phase 2 | Complete |
| ANIM-06 | Phase 3 | Complete |
| UICT-01 | Phase 2 | Complete |
| UICT-02 | Phase 2 | Complete |
| UICT-03 | Phase 2 | Complete |
| UICT-04 | Phase 3 | Complete |
| UICT-05 | Phase 2 | Complete |
| UICT-06 | Phase 3 | Complete |
| UICT-07 | Phase 3 | Complete |
| UICT-08 | Phase 7 | Complete |

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0

---
*Requirements defined: 2026-02-23*
*Last updated: 2026-02-24 after 08-02 dead code removal (all audit integration issues resolved)*
