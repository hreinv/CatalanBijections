# Roadmap: Catalan Number Bijection Explorer

## Overview

This roadmap delivers a presentation-ready interactive tool for demonstrating bijections between 11 Catalan number structures. The build order follows strict dependency chains: core Dyck word representation first, then a vertical slice proving the full pipeline (structures + animation + UI), then expanding to all structures and bijections, and finally the Dyck bridge for any-to-any coverage. Each phase delivers a coherent, verifiable capability that the presenter can demo.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Core Foundation** - Dyck word engine, Canvas setup, drawing contract, and projector-friendly theme
- [ ] **Phase 2: Vertical Slice** - Four key structures, animation engine, and UI skeleton proving the full pipeline
- [ ] **Phase 3: First Bijections** - Three classical bijections with step animations, color correspondence, and step descriptions
- [ ] **Phase 4: Remaining Structures** - Seven additional structure renderers completing all 11 Catalan structures
- [ ] **Phase 5: Remaining Bijections** - Five additional classical bijections completing all 8 hand-crafted animations
- [ ] **Phase 6: Dyck Bridge** - Automatic bijection composition for all 55 structure pairs via Dyck word pathfinding
- [ ] **Phase 7: Presentation Hardening** - Keyboard shortcuts, edge case handling, and projector verification
- [ ] **Phase 8: Verify Completed Work & Fix Integration Debt** - VERIFICATION.md for Phases 2-3, dead import fix, orphaned export cleanup (Gap Closure)

## Phase Details

### Phase 1: Core Foundation
**Goal**: The app loads in a browser with a working Canvas, Dyck word enumeration, and a clean visual foundation ready for structure rendering
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04
**Success Criteria** (what must be TRUE):
  1. Opening index.html in a browser displays a working Canvas app with no errors in console and no external dependencies loaded
  2. Dyck word enumeration generates exactly C(n) valid instances for each n=1 through n=4 (1, 2, 5, 14 respectively)
  3. Canvas renders sharp lines and text on a HiDPI display (no blurriness on Retina/4K screens)
  4. Visual theme uses white background with high-contrast colors and thick strokes readable from the back of a classroom
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Dyck word enumeration engine, validation, and color palette (TDD)
- [ ] 01-02-PLAN.md — HTML/Canvas shell with HiDPI rendering and projector theme

### Phase 2: Vertical Slice
**Goal**: Presenter can select two structures (from four available), choose n, cycle through instances, and control animation playback in a side-by-side layout
**Depends on**: Phase 1
**Requirements**: STRC-01, STRC-02, STRC-06, STRC-10, STRC-12, ANIM-01, ANIM-02, ANIM-03, ANIM-04, ANIM-05, UICT-01, UICT-02, UICT-03, UICT-05
**Success Criteria** (what must be TRUE):
  1. Balanced parentheses, Dyck paths, binary trees, and triangulations each render correctly for all C(n) instances at n=1 through n=4
  2. Each of the four structures converts to/from Dyck words and round-trips correctly for all 14 instances at n=4
  3. Presenter can select any two structures from dropdowns and see them rendered side-by-side (source left, target right)
  4. Playback controls (play/pause, step forward/back, jump to start/end, speed slider) respond correctly and animation runs smoothly via requestAnimationFrame
  5. Instance navigator cycles through all C(n) instances with previous/next buttons and shows "X of Y" indicator
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md — Four structure modules (parentheses, Dyck paths, binary trees, triangulations) with registry and round-trip tests
- [ ] 02-02-PLAN.md — UI controls, app state management, and side-by-side canvas rendering
- [ ] 02-03-PLAN.md — Animation engine with rAF loop and playback control wiring

### Phase 3: First Bijections
**Goal**: Presenter can animate three classical bijections step-by-step with color-coded element correspondence and textual explanations of each transformation step
**Depends on**: Phase 2
**Requirements**: BIJC-01, BIJC-02, BIJC-03, ANIM-06, UICT-04, UICT-06, UICT-07
**Success Criteria** (what must be TRUE):
  1. Parentheses-to-Dyck-Paths bijection animates with 5+ distinct steps, each with a text description explaining the transformation
  2. Binary-Trees-to-Triangulations bijection animates showing how internal nodes correspond to triangles
  3. Parentheses-to-Binary-Trees bijection animates showing how nesting structure maps to subtree structure
  4. Matching elements across source and target structures share the same color, making the correspondence visually obvious
  5. The currently active transformation step pulses or glows while non-active elements are dimmed
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — Easing utility, bijection router skeleton, step description panel, and dual-mode render
- [ ] 03-02-PLAN.md — Parentheses-to-Dyck-Paths bijection with color correspondence and glow/dim highlighting
- [ ] 03-03-PLAN.md — Binary-Trees-to-Triangulations and Parentheses-to-Binary-Trees bijections

### Phase 4: Remaining Structures
**Goal**: All 11 Catalan structures render correctly and convert to/from Dyck words, completing the full structure catalog
**Depends on**: Phase 2
**Requirements**: STRC-03, STRC-04, STRC-05, STRC-07, STRC-08, STRC-09, STRC-11
**Success Criteria** (what must be TRUE):
  1. Mountain ranges, lattice paths, staircase polygons, rooted plane trees, ballot sequences, non-crossing partitions, and stack-sortable permutations each render correctly for all C(n) instances at n=1 through n=4
  2. Every structure's toDyck/fromDyck round-trips correctly for all 14 instances at n=4 (verified by the existing verification harness)
  3. All 11 structures appear in the structure selector dropdowns and can be selected for side-by-side display
  4. Tree layouts (rooted plane trees) avoid node collisions for all 14 instances at n=4, including degenerate linear chains
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Remaining Bijections
**Goal**: All 8 classical bijections animate with step-by-step explanations, covering the major known Catalan bijections
**Depends on**: Phase 3, Phase 4
**Requirements**: BIJC-04, BIJC-05, BIJC-06, BIJC-07, BIJC-08
**Success Criteria** (what must be TRUE):
  1. Dyck-Paths-to-Lattice-Paths bijection animates showing the 45-degree geometric rotation
  2. Binary-Trees-to-Rooted-Plane-Trees bijection animates showing the left-child/right-sibling rotation correspondence
  3. Dyck-Paths-to-Mountain-Ranges, Non-crossing-Partitions-to-Triangulations, and Ballot-Sequences-to-Dyck-Paths bijections each animate with 5+ steps and text descriptions
  4. Every classical bijection produces correct results for all 14 instances at n=4 (cross-checked against Dyck word composition)
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD
- [ ] 05-03: TBD

### Phase 6: Dyck Bridge
**Goal**: Presenter can select any two of the 11 structures and see an animated bijection, with intermediate structures shown when composing through the Dyck word bridge
**Depends on**: Phase 4, Phase 5
**Requirements**: BRDG-01, BRDG-02, BRDG-03
**Success Criteria** (what must be TRUE):
  1. Selecting any non-classical pair of structures produces an animated bijection by composing through Dyck words
  2. The bijection chain indicator shows which intermediate structures are used when composing (e.g., "Mountain Ranges -> Dyck Path -> Binary Tree")
  3. Pathfinding selects the shortest route through the bijection graph, preferring classical bijections over longer bridge paths
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Presentation Hardening
**Goal**: The tool is reliable and fluid for live classroom presentation with keyboard-driven control
**Depends on**: Phase 6
**Requirements**: UICT-08
**Success Criteria** (what must be TRUE):
  1. Spacebar toggles play/pause, arrow keys step forward/back, and number keys control speed -- all without clicking
  2. The tool handles window resize, tab switching, and rapid input without visual glitches or state corruption
  3. All colors remain distinguishable when displayed on a typical classroom projector (verified on target hardware)
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

### Phase 8: Verify Completed Work & Fix Integration Debt
**Goal**: Formally verify all Phase 2 and Phase 3 requirements against success criteria, fix integration issues, and clean up tech debt so the audit passes for completed work
**Depends on**: Phase 3
**Requirements**: (verifies STRC-01, STRC-02, STRC-06, STRC-10, STRC-12, ANIM-01-06, UICT-01-07, BIJC-01-03)
**Gap Closure**: Closes 21 partial requirements, 3 integration issues, 4 tech debt items from v1.0 audit
**Success Criteria** (what must be TRUE):
  1. VERIFICATION.md exists for Phase 2 confirming all 14 requirements pass their success criteria
  2. VERIFICATION.md exists for Phase 3 confirming all 7 requirements pass their success criteria
  3. Dead import in binary-triang.js is removed
  4. Orphaned exports (THEME_COLORS, validate(), lerp()) are removed or wired to consumers
  5. All 21 previously-partial requirements are now fully satisfied (3-source cross-reference passes)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8
Note: Phase 3 and Phase 4 depend only on Phase 2, so they could execute in either order. Phase 5 depends on both Phase 3 and Phase 4.
Phase 8 (gap closure) depends only on Phase 3 and can run any time after Phase 3.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Foundation | 2/2 | Complete | 2026-02-24 |
| 2. Vertical Slice | 3/3 | Complete | 2026-02-24 |
| 3. First Bijections | 3/3 | Complete | 2026-02-23 |
| 4. Remaining Structures | 0/3 | Not started | - |
| 5. Remaining Bijections | 0/3 | Not started | - |
| 6. Dyck Bridge | 0/2 | Not started | - |
| 7. Presentation Hardening | 0/1 | Not started | - |
| 8. Verify & Fix Integration Debt | 0/1 | Not started | - |
