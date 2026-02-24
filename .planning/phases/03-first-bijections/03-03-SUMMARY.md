---
phase: 03-first-bijections
plan: 03
subsystem: animation
tags: [bijection, binary-triang, parens-binary, color-correspondence, pre-order-traversal, 1L0R-decomposition]

# Dependency graph
requires:
  - phase: 03-first-bijections
    provides: "Bijection router, easing utilities, dual-mode render, step description panel, parens-dyck bijection pattern"
provides:
  - "Binary-Trees-to-Triangulations bijection with n+2 animated steps"
  - "Parentheses-to-Binary-Trees bijection with n+2 animated steps"
  - "Router with all 3 bijections registered (6 structure pair lookups)"
  - "Phase 3 complete: 3 classical bijections with step animations, color correspondence, and step descriptions"
affects: [04-bridge-bijections]

# Tech tracking
tech-stack:
  added: []
  patterns: ["pre-order node-to-triangle correspondence", "1L0R decomposition step recording", "subtree range indicator bars"]

key-files:
  created: [js/bijections/binary-triang.js, js/bijections/parens-binary.js]
  modified: [js/bijections/router.js]

key-decisions:
  - "Tree layout computed locally in bijection modules (same pattern as parens-dyck) to avoid modifying structure modules"
  - "Pre-order traversal order for binary-triang ensures node indices match triangle reveal order"
  - "Subtree range indicator bars in parens-binary show left/right content decomposition visually"

patterns-established:
  - "Bijection drawFrame three-zone pattern reused consistently across all 3 bijection modules"
  - "Local tree layout helpers (_layoutX/_layoutY) in bijection modules to keep structure modules unmodified"

requirements-completed: [BIJC-02, BIJC-03]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 3 Plan 3: Remaining Bijections Summary

**Binary-Trees-to-Triangulations and Parentheses-to-Binary-Trees bijections completing all 3 classical Catalan structure bijections with color correspondence and animated steps**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-24T05:31:41Z
- **Completed:** 2026-02-24T05:35:34Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created binary-triang bijection mapping internal tree nodes to polygon triangles via pre-order traversal
- Created parens-binary bijection using 1L0R recursive decomposition with subtree range indicators
- Registered all 3 bijections in router for 6 bidirectional structure pair lookups
- All bijections produce n+2 steps (4 at n=2, 5 at n=3, 6 at n=4) with consistent visual effects

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement binary-triang bijection module** - `1753821` (feat)
2. **Task 2: Implement parens-binary bijection module and register all in router** - `c07cf2d` (feat)

## Files Created/Modified
- `js/bijections/binary-triang.js` - Binary Trees to Triangulations bijection with pre-order node-triangle correspondence, three-zone rendering, polygon outline and triangle fill drawing
- `js/bijections/parens-binary.js` - Parentheses to Binary Trees bijection with 1L0R decomposition, character-to-node mapping, subtree range bars, incremental tree reveal
- `js/bijections/router.js` - Added imports and registration of binaryTriang and parensBinary modules

## Decisions Made
- Tree layout is computed locally within each bijection module using `_layoutX`/`_layoutY` properties (prefixed with underscore to avoid collision with structure module's `layoutX`/`layoutY`), following the established pattern from parens-dyck of drawing directly rather than delegating to structure module draw() functions
- Binary-triang uses pre-order traversal for triangle reveal order, ensuring node index i always maps to triangle index i for correct color correspondence
- Parens-binary adds subtle underline bars below the parenthesis string to indicate left and right subtree content ranges during active decomposition steps

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 3 classical bijections operational: parens-dyck (2n+2 steps), binary-triang (n+2 steps), parens-binary (n+2 steps)
- Phase 3 success criteria fully met: 3 bijections with step animations, color correspondence, glow/dim effects, and step descriptions
- Router handles 6 registered pair lookups; unregistered pairs still fall back to static rendering
- Ready for Phase 4 bridge bijections to add more structure pairs

## Self-Check: PASSED

All files exist. All commits verified.

---
*Phase: 03-first-bijections*
*Completed: 2026-02-24*
