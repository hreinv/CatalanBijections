---
phase: 05-remaining-bijections
plan: 01
subsystem: bijections
tags: [canvas, animation, ballot-sequence, dyck-path, mountain-range, bijection]

# Dependency graph
requires:
  - phase: 03-first-bijections
    provides: "Bijection module contract (META + getSteps), router, three-zone rendering pattern"
  - phase: 04-remaining-structures
    provides: "ballot-sequence.js and mountain-range.js structure modules with fromDyck/toDyck"
provides:
  - "ballot-dyck.js bijection module (Ballot Sequences to Dyck Paths)"
  - "dyck-mountain.js bijection module (Dyck Paths to Mountain Ranges)"
  - "Router expanded to 5 bijections (10 bidirectional pair lookups)"
affects: [05-remaining-bijections, 06-dyck-bridge]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Mountain segment-index coloring (not peak-only) for bijection animation"]

key-files:
  created:
    - "js/bijections/ballot-dyck.js"
    - "js/bijections/dyck-mountain.js"
  modified:
    - "js/bijections/router.js"

key-decisions:
  - "Mountain segments colored by segment index (not peak-only) to match Dyck path correspondence per RESEARCH.md Pitfall 2"
  - "Ballot vote tallies rendered below each vote letter with same three-zone dimming as vote characters"

patterns-established:
  - "Visual reinterpretation bijections follow parens-dyck.js pattern exactly with 2n+2 steps"

requirements-completed: [BIJC-08, BIJC-06]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 5 Plan 01: Ballot-to-Dyck and Dyck-to-Mountain Bijections Summary

**Two visual reinterpretation bijection modules (ballot-dyck, dyck-mountain) with 2n+2 step animations, registered in router bringing total to 5 bijections**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-24T19:09:15Z
- **Completed:** 2026-02-24T19:12:41Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Ballot-to-Dyck bijection with vote-by-vote animation showing A->up, B->down correspondence
- Dyck-to-Mountain bijection with segment-by-segment mountain silhouette building
- Both support forward and reversed directions, produce 2n+2 steps for all n=1..4
- Router expanded from 3 to 5 bijections (10 bidirectional lookups), no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement ballot-dyck and dyck-mountain bijection modules** - `12ef609` (feat)
2. **Task 2: Register both bijections in router and verify end-to-end** - `19e34f9` (feat)

## Files Created/Modified
- `js/bijections/ballot-dyck.js` - Ballot Sequences to Dyck Paths bijection with three-zone vote rendering and tally display
- `js/bijections/dyck-mountain.js` - Dyck Paths to Mountain Ranges bijection with incremental mountain silhouette building
- `js/bijections/router.js` - Added imports and registrations for both new modules

## Decisions Made
- Mountain segments colored by segment index to match Dyck path segment colors (avoiding peak-only coloring from static draw() per RESEARCH.md Pitfall 2)
- Ballot tallies (A:B counts) rendered below vote letters with same dimming zones as the vote characters for visual consistency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 5 of 8 bijections now implemented
- Ready for Plan 05-02 (Dyck-to-Lattice and Binary-Trees-to-Rooted-Plane-Trees)
- Router pattern proven for easy expansion

## Self-Check: PASSED

- FOUND: js/bijections/ballot-dyck.js
- FOUND: js/bijections/dyck-mountain.js
- FOUND: 05-01-SUMMARY.md
- FOUND: commit 12ef609
- FOUND: commit 19e34f9

---
*Phase: 05-remaining-bijections*
*Completed: 2026-02-24*
