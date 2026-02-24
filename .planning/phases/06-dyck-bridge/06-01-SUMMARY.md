---
phase: 06-dyck-bridge
plan: 01
subsystem: bijections
tags: [bfs, pathfinding, graph, composition, dyck-bridge, vanilla-js]

# Dependency graph
requires:
  - phase: 05-remaining-bijections
    provides: All 8 classical bijection modules registered in router
  - phase: 04-remaining-structures
    provides: All 11 structure modules with fromDyck/toDyck/draw
provides:
  - Bijection graph with BFS pathfinding (findPath)
  - Step composition for multi-leg paths (composeSteps)
  - Enhanced router returning {steps, path} for all 110 non-identity structure pairs
affects: [06-dyck-bridge plan 02, 07-presentation-hardening]

# Tech tracking
tech-stack:
  added: []
  patterns: [bijection graph adjacency list, BFS with edge-priority sorting, step composition via callback delegation]

key-files:
  created: [js/bijections/bridge.js]
  modified: [js/bijections/router.js]

key-decisions:
  - "Classical-first BFS via adjacency list sort order (no weighted Dijkstra needed for 11-node graph)"
  - "Bridge edges only for island structures (staircase-polygon, stack-sortable-perm) to dyck-path hub -- not universal pairwise"
  - "classicalGetSteps passed as callback to composeSteps to avoid circular imports between router and bridge"
  - "Router return type changed from Array|null to {steps, path}|null -- Plan 02 updates main.js consumer"

patterns-established:
  - "Bridge module pattern: graph construction at module load, frozen adjacency list, BFS pathfinding"
  - "Step composition pattern: classical callback delegation + bridge drawFrame using structure draw() with correspondence colors"

requirements-completed: [BRDG-01, BRDG-02]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 6 Plan 01: Dyck Bridge Summary

**BFS pathfinding over frozen bijection graph (11 nodes, 8 classical + 2 bridge edges) with step composition enabling all 110 non-identity structure pairs to return animation steps from the router**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-24T19:43:51Z
- **Completed:** 2026-02-24T19:46:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created bridge.js with bijection graph construction, BFS shortest-path, and step composition for multi-leg paths
- Enhanced router.js to fall back to bridge pathfinding when no classical bijection exists for a pair
- All 110 non-identity structure pairs now return animation steps (verified exhaustively)
- Classical pairs still use their direct bijection modules unchanged (no regression)
- Island structures (staircase-polygon, stack-sortable-perm) route through dyck-path hub with 2-step bridge conversions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create bridge.js with bijection graph, BFS pathfinding, and step composition** - `ed61ff9` (feat)
2. **Task 2: Integrate bridge into router as fallback for non-classical pairs** - `ce5d456` (feat)

## Files Created/Modified
- `js/bijections/bridge.js` - New module: bijection graph (11 nodes, 10 edges), BFS findPath, composeSteps with classical callback + bridge drawFrame
- `js/bijections/router.js` - Enhanced: imports bridge, adds classicalGetSteps callback, getSteps returns {steps, path} for all non-identity pairs

## Decisions Made
- Classical-first BFS via adjacency list sort order rather than weighted Dijkstra -- for an 11-node graph, sorting classical edges first in each neighbor list gives BFS the same classical-preferred behavior with zero extra complexity
- Bridge edges added only for island structures (staircase-polygon, stack-sortable-perm) connecting to dyck-path as hub node, rather than adding universal pairwise bridge edges between all non-classical pairs -- keeps graph sparse and paths intuitive
- classicalGetSteps extracted as a private function in router.js and passed as callback to bridge.composeSteps() to avoid circular import dependency
- Router return type changed from bare Array|null to {steps, path}|null -- this temporarily breaks main.js (which expects an array), but Plan 02 immediately updates main.js to handle the new format

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Bridge module and enhanced router are complete; Plan 02 will update main.js to consume the new {steps, path} return type and add the chain indicator UI (BRDG-03)
- The app is temporarily broken between Plan 01 and Plan 02 because main.js still expects getSteps to return an array -- this is expected and documented in the plan

## Self-Check: PASSED

All files and commits verified:
- FOUND: js/bijections/bridge.js
- FOUND: js/bijections/router.js
- FOUND: 06-01-SUMMARY.md
- FOUND: ed61ff9 (Task 1)
- FOUND: ce5d456 (Task 2)

---
*Phase: 06-dyck-bridge*
*Completed: 2026-02-24*
